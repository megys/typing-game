const INITIALS = Array.from("ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ");
const VOWELS = Array.from("ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ");
const FINALS = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ",
  "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const KEY_MAP = {
  KeyQ: ["ㅂ", "ㅃ"], KeyW: ["ㅈ", "ㅉ"], KeyE: ["ㄷ", "ㄸ"], KeyR: ["ㄱ", "ㄲ"],
  KeyT: ["ㅅ", "ㅆ"], KeyY: ["ㅛ", "ㅛ"], KeyU: ["ㅕ", "ㅕ"], KeyI: ["ㅑ", "ㅑ"],
  KeyO: ["ㅐ", "ㅒ"], KeyP: ["ㅔ", "ㅖ"], KeyA: ["ㅁ", "ㅁ"], KeyS: ["ㄴ", "ㄴ"],
  KeyD: ["ㅇ", "ㅇ"], KeyF: ["ㄹ", "ㄹ"], KeyG: ["ㅎ", "ㅎ"], KeyH: ["ㅗ", "ㅗ"],
  KeyJ: ["ㅓ", "ㅓ"], KeyK: ["ㅏ", "ㅏ"], KeyL: ["ㅣ", "ㅣ"], KeyZ: ["ㅋ", "ㅋ"],
  KeyX: ["ㅌ", "ㅌ"], KeyC: ["ㅊ", "ㅊ"], KeyV: ["ㅍ", "ㅍ"], KeyB: ["ㅠ", "ㅠ"],
  KeyN: ["ㅜ", "ㅜ"], KeyM: ["ㅡ", "ㅡ"],
};

const ASCII_CODE_MAP = {
  q: "KeyQ", w: "KeyW", e: "KeyE", r: "KeyR", t: "KeyT", y: "KeyY", u: "KeyU",
  i: "KeyI", o: "KeyO", p: "KeyP", a: "KeyA", s: "KeyS", d: "KeyD", f: "KeyF",
  g: "KeyG", h: "KeyH", j: "KeyJ", k: "KeyK", l: "KeyL", z: "KeyZ", x: "KeyX",
  c: "KeyC", v: "KeyV", b: "KeyB", n: "KeyN", m: "KeyM",
};

const COMPOUND_VOWELS = new Map([
  ["ㅗㅏ", "ㅘ"], ["ㅗㅐ", "ㅙ"], ["ㅗㅣ", "ㅚ"],
  ["ㅜㅓ", "ㅝ"], ["ㅜㅔ", "ㅞ"], ["ㅜㅣ", "ㅟ"], ["ㅡㅣ", "ㅢ"],
]);
const VOWEL_PARTS = new Map(Array.from(COMPOUND_VOWELS, ([parts, combined]) => [combined, Array.from(parts)]));
const COMPOUND_FINALS = new Map([
  ["ㄱㅅ", "ㄳ"], ["ㄴㅈ", "ㄵ"], ["ㄴㅎ", "ㄶ"], ["ㄹㄱ", "ㄺ"], ["ㄹㅁ", "ㄻ"],
  ["ㄹㅂ", "ㄼ"], ["ㄹㅅ", "ㄽ"], ["ㄹㅌ", "ㄾ"], ["ㄹㅍ", "ㄿ"], ["ㄹㅎ", "ㅀ"], ["ㅂㅅ", "ㅄ"],
]);
const FINAL_PARTS = new Map(Array.from(COMPOUND_FINALS, ([parts, combined]) => [combined, Array.from(parts)]));
const DOUBLE_INITIALS = new Map([
  ["ㄱㄱ", "ㄲ"], ["ㄷㄷ", "ㄸ"], ["ㅂㅂ", "ㅃ"], ["ㅅㅅ", "ㅆ"], ["ㅈㅈ", "ㅉ"],
]);
const DOUBLE_PARTS = new Map(Array.from(DOUBLE_INITIALS, ([parts, combined]) => [combined, parts[0]]));

function isSyllable(character) {
  const codePoint = character?.codePointAt(0);
  return codePoint >= 0xac00 && codePoint <= 0xd7a3;
}

function decomposeSyllable(character) {
  const offset = character.codePointAt(0) - 0xac00;
  const finalIndex = offset % 28;
  const vowelIndex = Math.floor(offset / 28) % 21;
  const initialIndex = Math.floor(offset / (21 * 28));
  return { initialIndex, vowelIndex, finalIndex };
}

function composeSyllable(initialIndex, vowelIndex, finalIndex = 0) {
  return String.fromCodePoint(0xac00 + ((initialIndex * 21) + vowelIndex) * 28 + finalIndex);
}

function replaceLastCharacter(value, replacement) {
  return `${Array.from(value).slice(0, -1).join("")}${replacement}`;
}

function appendJamo(value, jamo) {
  const characters = Array.from(value);
  const previous = characters[characters.length - 1];
  const initialIndex = INITIALS.indexOf(jamo);
  const vowelIndex = VOWELS.indexOf(jamo);

  if (!previous) return jamo;

  if (isSyllable(previous)) {
    const syllable = decomposeSyllable(previous);

    if (vowelIndex >= 0 && syllable.finalIndex === 0) {
      const combined = COMPOUND_VOWELS.get(`${VOWELS[syllable.vowelIndex]}${jamo}`);
      if (combined) {
        return replaceLastCharacter(value, composeSyllable(
          syllable.initialIndex,
          VOWELS.indexOf(combined),
        ));
      }
    }

    if (vowelIndex >= 0 && syllable.finalIndex > 0) {
      const final = FINALS[syllable.finalIndex];
      const parts = FINAL_PARTS.get(final);
      const retainedFinal = parts?.[0] ?? "";
      const nextInitial = parts?.[1] ?? final;
      const nextInitialIndex = INITIALS.indexOf(nextInitial);
      const retainedSyllable = composeSyllable(
        syllable.initialIndex,
        syllable.vowelIndex,
        FINALS.indexOf(retainedFinal),
      );
      return replaceLastCharacter(
        value,
        `${retainedSyllable}${composeSyllable(nextInitialIndex, vowelIndex)}`,
      );
    }

    if (initialIndex >= 0 && syllable.finalIndex === 0) {
      const finalIndex = FINALS.indexOf(jamo);
      if (finalIndex >= 0) {
        return replaceLastCharacter(
          value,
          composeSyllable(syllable.initialIndex, syllable.vowelIndex, finalIndex),
        );
      }
    }

    if (initialIndex >= 0 && syllable.finalIndex > 0) {
      const combined = COMPOUND_FINALS.get(`${FINALS[syllable.finalIndex]}${jamo}`);
      if (combined) {
        return replaceLastCharacter(
          value,
          composeSyllable(syllable.initialIndex, syllable.vowelIndex, FINALS.indexOf(combined)),
        );
      }
    }
  }

  if (vowelIndex >= 0) {
    const previousInitialIndex = INITIALS.indexOf(previous);
    if (previousInitialIndex >= 0) {
      return replaceLastCharacter(value, composeSyllable(previousInitialIndex, vowelIndex));
    }

    const combined = COMPOUND_VOWELS.get(`${previous}${jamo}`);
    if (combined) return replaceLastCharacter(value, combined);
  }

  if (initialIndex >= 0) {
    const combined = DOUBLE_INITIALS.get(`${previous}${jamo}`);
    if (combined) return replaceLastCharacter(value, combined);
  }

  return `${value}${jamo}`;
}

export function jamoForKey(code, shiftKey = false) {
  return KEY_MAP[code]?.[shiftKey ? 1 : 0] ?? null;
}

export function insertHangulKey(value, selectionStart, selectionEnd, jamo) {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const nextBefore = appendJamo(before, jamo);
  return {
    value: `${nextBefore}${after}`,
    selectionStart: nextBefore.length,
    selectionEnd: nextBefore.length,
  };
}

export function deleteHangulBackward(value, selectionStart, selectionEnd) {
  if (selectionStart !== selectionEnd) {
    return { value: `${value.slice(0, selectionStart)}${value.slice(selectionEnd)}`, selectionStart };
  }
  if (selectionStart === 0) return { value, selectionStart };

  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const beforeCharacters = Array.from(before);
  const previous = beforeCharacters[beforeCharacters.length - 1];
  let nextBefore = beforeCharacters.slice(0, -1).join("");

  if (isSyllable(previous)) {
    const syllable = decomposeSyllable(previous);
    if (syllable.finalIndex > 0) {
      const final = FINALS[syllable.finalIndex];
      const reducedFinal = FINAL_PARTS.get(final)?.[0] ?? "";
      nextBefore += composeSyllable(
        syllable.initialIndex,
        syllable.vowelIndex,
        FINALS.indexOf(reducedFinal),
      );
    } else {
      const vowel = VOWELS[syllable.vowelIndex];
      const reducedVowel = VOWEL_PARTS.get(vowel)?.[0];
      nextBefore += reducedVowel
        ? composeSyllable(syllable.initialIndex, VOWELS.indexOf(reducedVowel))
        : INITIALS[syllable.initialIndex];
    }
  } else if (VOWEL_PARTS.has(previous)) {
    nextBefore += VOWEL_PARTS.get(previous)[0];
  } else if (DOUBLE_PARTS.has(previous)) {
    nextBefore += DOUBLE_PARTS.get(previous);
  }

  return {
    value: `${nextBefore}${after}`,
    selectionStart: nextBefore.length,
    selectionEnd: nextBefore.length,
  };
}

export function composeTwoSet(keySequence) {
  let value = "";
  for (const key of keySequence) {
    const code = ASCII_CODE_MAP[key.toLowerCase()];
    const jamo = code ? jamoForKey(code, key !== key.toLowerCase()) : null;
    value = jamo ? appendJamo(value, jamo) : `${value}${key}`;
  }
  return value;
}