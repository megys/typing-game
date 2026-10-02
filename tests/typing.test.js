import assert from "assert";
import {
  evaluateAnswer,
  evaluateWordProgress,
  gradeResponse,
  normalizeText,
} from "../src/typing.js";
import {
  composeTwoSet,
  deleteHangulBackward,
  insertHangulKey,
  jamoForKey,
} from "../src/hangul-input.js";
import { responseDuration } from "../src/difficulty.js";
import { actionCategories, drinks, recipeActions, unlockedDrinks } from "../src/content.js";
import { evaluateLanguageAttempt, evaluateRecipeAction } from "../src/recipe.js";

const tests = [
  ["defines the full unlockable cafe menu", () => {
    assert.equal(drinks.length, 23);
    assert.deepEqual(drinks.slice(0, 4).map(({ unlockAt }) => unlockAt), [0, 0, 0, 0]);
    assert.equal(drinks[drinks.length - 1].unlockAt, 14);
    assert.ok(drinks.every(({ recipe }) => recipe.length >= 2));
  }],
  ["groups the expanded ingredients into compact kitchen stations", () => {
    assert.deepEqual(
      actionCategories.map(({ id, actions }) => [id, actions.length]),
      [["tea", 10], ["syrup", 10], ["fridge", 7], ["topping", 3]],
    );
  }],
  ["unlocks the full drink menu over fourteen served orders", () => {
    assert.deepEqual([0, 2, 4, 6, 8, 10, 12, 14].map((served) => unlockedDrinks(served).length), [4, 6, 8, 10, 12, 14, 16, 23]);
    assert.ok(actionCategories.flatMap(({ actions }) => actions).every(({ unlockAt }) => unlockAt <= 14));
  }],
  ["includes common Korean cafe ades made with sparkling water", () => {
    const ades = drinks.filter(({ korean }) => korean.endsWith("에이드") || korean === "레모네이드");
    assert.deepEqual(ades.map(({ korean }) => korean), ["딸기에이드", "레모네이드", "청포도에이드", "자몽에이드", "복숭아에이드"]);
    assert.ok(ades.every(({ recipe }) => recipe.some(({ id }) => id === "sparkling-water")));
  }],
  ["defines the sink action used to throw away a drink", () => {
    assert.equal(recipeActions.discard.id, "discard");
    assert.equal(recipeActions.discard.korean, "음료를 버려요");
    assert.equal(recipeActions.discard.english, "Throw away the drink");
  }],
  ["gives every drink varied dialogue that names the order", () => {
    for (const drink of drinks) {
      assert.ok(drink.dialogue.length >= 3);
      for (const line of drink.dialogue) {
        assert.ok(line.korean.includes(drink.korean));
        assert.ok(line.english.toLowerCase().includes(drink.english.toLowerCase()));
      }
    }
  }],
  ["advances a recipe only when the chosen tool is next", () => {
    const recipe = drinks.find(({ english }) => english === "Iced Americano").recipe;
    assert.deepEqual(evaluateRecipeAction(recipe, 0, "coffee"), {
      correct: false,
      complete: false,
      nextCompletedCount: 0,
    });
    assert.deepEqual(evaluateRecipeAction(recipe, 0, "clear-cup"), {
      correct: true,
      complete: false,
      nextCompletedCount: 1,
    });
    assert.deepEqual(evaluateRecipeAction(recipe, 3, "ice"), {
      correct: true,
      complete: true,
      nextCompletedCount: 4,
    });
  }],
  ["fails an order after two missed Korean submissions", () => {
    assert.deepEqual(evaluateLanguageAttempt(0, "missed"), { misses: 1, failed: false });
    assert.deepEqual(evaluateLanguageAttempt(1, "missed"), { misses: 2, failed: true });
    assert.deepEqual(evaluateLanguageAttempt(1, "close"), { misses: 1, failed: false });
  }],
  ["applies difficulty response limits", () => {
    assert.equal(responseDuration(12, "easy"), null);
    assert.equal(responseDuration(12, "medium"), 12000);
    assert.equal(responseDuration(12, "hard"), 6000);
    assert.equal(responseDuration(6, "hard"), 4000);
  }],
  ["maps physical two-set keys and shifted forms", () => {
    assert.equal(jamoForKey("KeyR"), "ㄱ");
    assert.equal(jamoForKey("KeyR", true), "ㄲ");
    assert.equal(jamoForKey("Digit1"), null);
  }],
  ["composes a Korean greeting from English keyboard strokes", () => {
    const greeting = composeTwoSet("dkssudgktpdy");
    assert.equal(greeting, "안녕하세요");
    assert.equal(evaluateAnswer(greeting, "안녕하세요").complete, true);
  }],
  ["composes compound vowels and final consonants", () => {
    assert.equal(composeTwoSet("rhks"), "관");
    assert.equal(composeTwoSet("rkqt"), "값");
  }],
  ["moves a final consonant into the next syllable", () => {
    assert.equal(composeTwoSet("rksk"), "가나");
    assert.equal(composeTwoSet("rkqtk"), "갑사");
  }],
  ["inserts at the caret and replaces selected text", () => {
    assert.deepEqual(insertHangulKey("가다", 1, 1, "ㄴ"), {
      value: "간다",
      selectionStart: 1,
      selectionEnd: 1,
    });
    assert.deepEqual(insertHangulKey("가X다", 1, 2, "ㄴ"), {
      value: "간다",
      selectionStart: 1,
      selectionEnd: 1,
    });
  }],
  ["backspaces through a syllable one jamo at a time", () => {
    const withoutFinal = deleteHangulBackward("한", 1, 1);
    const withoutVowel = deleteHangulBackward(withoutFinal.value, 1, 1);
    const empty = deleteHangulBackward(withoutVowel.value, 1, 1);
    assert.equal(withoutFinal.value, "하");
    assert.equal(withoutVowel.value, "ㅎ");
    assert.equal(empty.value, "");
  }],
  ["normalizes decomposed Hangul", () => {
    assert.equal(normalizeText("한"), "한");
  }],
  ["accepts romanization without case sensitivity", () => {
    assert.equal(evaluateAnswer("Annyeong", "annyeong", "romanization").complete, true);
  }],
  ["accepts English without case sensitivity", () => {
    assert.equal(evaluateAnswer("ICED LATTE", "Iced latte", "english").complete, true);
  }],
  ["marks only entered characters while leaving the rest pending", () => {
    assert.deepEqual(
      evaluateAnswer("안녕", "안녕하세요").characters.map(({ status }) => status),
      ["correct", "correct", "pending", "pending", "pending"],
    );
  }],
  ["reports an incorrect syllable without completing the answer", () => {
    const result = evaluateAnswer("안녕하새요", "안녕하세요");
    assert.equal(result.complete, false);
    assert.equal(result.hasError, true);
    assert.equal(result.characters[3].status, "incorrect");
  }],
  ["rejects extra input", () => {
    const result = evaluateAnswer("안녕!", "안녕");
    assert.equal(result.complete, false);
    assert.equal(result.hasError, true);
  }],
  ["recognizes a word before its trailing space is entered", () => {
    const result = evaluateWordProgress("아메리카노", "아메리카노 한 잔 주세요");
    assert.equal(result.words[0].recognized, true);
    assert.equal(result.words[0].active, true);
  }],
  ["moves the active word after its separator is entered", () => {
    const result = evaluateWordProgress("아메리카노 ", "아메리카노 한 잔 주세요");
    assert.equal(result.words[0].recognized, true);
    assert.equal(result.words[1].active, true);
  }],
  ["delays an incorrect word state until moving to the next word", () => {
    const typing = evaluateWordProgress("아메리카니", "아메리카노 한 잔 주세요");
    const movedOn = evaluateWordProgress("아메리카니 ", "아메리카노 한 잔 주세요");
    assert.equal(typing.words[0].incorrect, false);
    assert.equal(movedOn.words[0].incorrect, true);
  }],
  ["recognizes a word before its punctuation is entered", () => {
    const result = evaluateWordProgress("이름이 뭐예요", "이름이 뭐예요?");
    assert.equal(result.words[1].recognized, true);
    assert.equal(result.complete, false);
  }],
  ["completes a final word without requiring a separator", () => {
    const result = evaluateWordProgress("반가워요", "반가워요");
    assert.equal(result.words[0].recognized, true);
    assert.equal(result.complete, true);
  }],
  ["completes a composed Hangul phrase on its final syllable", () => {
    const answer = composeTwoSet("dkapflzksh gks wks wntpdy");
    const result = evaluateWordProgress(answer, "아메리카노 한 잔 주세요");
    assert.equal(answer, "아메리카노 한 잔 주세요");
    assert.equal(result.words[3].recognized, true);
    assert.equal(result.complete, true);
  }],
  ["grades exact responses as perfect after normalization", () => {
    assert.equal(gradeResponse(" Annyeong ", "annyeong", "romanization").tier, "perfect");
  }],
  ["grades a small typo as close", () => {
    assert.equal(gradeResponse("네 부탁해요", "네, 부탁해요").tier, "close");
  }],
  ["grades an unintelligible response as missed", () => {
    assert.equal(gradeResponse("아니요", "아메리카노 한 잔 주세요").tier, "missed");
  }],
];

let failures = 0;

for (const [name, test] of tests) {
  try {
    test();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${tests.length} tests passed.`);
}