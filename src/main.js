import { actionCategories, customerLooks, drinks, recipeActions, unlockedDrinks } from "./content.js?v=6";
import { DEFAULT_DIFFICULTY } from "./difficulty.js";
import { deleteHangulBackward, insertHangulKey, jamoForKey } from "./hangul-input.js";
import { evaluateLanguageAttempt, evaluateRecipeAction } from "./recipe.js";
import { evaluateWordProgress, gradeResponse } from "./typing.js?v=2";

const HANGUL_INPUT_SETTING = "jamo-hangul-input";
const KEYBOARD_VISIBILITY_SETTING = "jamo-keyboard-visible";
const DIFFICULTY_SETTING = "jamo-difficulty";
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const SHIFT_LENGTHS = { easy: 150000, medium: 105000, hard: 75000 };
const TESTING_WITHOUT_TIME_LIMIT = true;
const UNLOCK_EVERYTHING_FOR_TESTING = true;

function isUnlocked(item) {
  return UNLOCK_EVERYTHING_FOR_TESTING || item.unlockAt <= state.served;
}

function loadSetting(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadDifficulty() {
  const difficulty = loadSetting(DIFFICULTY_SETTING, DEFAULT_DIFFICULTY);
  return DIFFICULTIES.has(difficulty) ? difficulty : DEFAULT_DIFFICULTY;
}

const elements = {
  accuracyResult: document.querySelector("#accuracy-result"),
  actionButton: document.querySelector("#action-button"),
  baristaSpeech: document.querySelector("#barista-speech"),
  bestStreakResult: document.querySelector("#best-streak-result"),
  clockInButton: document.querySelector("#clock-in-button"),
  closeKitchenAction: document.querySelector("#close-kitchen-action"),
  compositionState: document.querySelector("#composition-state"),
  customerDialogue: document.querySelector("#customer-dialogue"),
  customerLine: document.querySelector("#customer-line"),
  customerTranslation: document.querySelector("#customer-translation"),
  customerPortrait: document.querySelector("#customer-portrait"),
  difficultyButtons: document.querySelectorAll("[data-difficulty]"),
  discardDrinkButton: document.querySelector("#discard-drink-button"),
  failedCount: document.querySelector("#failed-count"),
  failedResult: document.querySelector("#failed-result"),
  frontOrderSlot: document.querySelector("#front-order-slot"),
  frontRoom: document.querySelector("#front-room"),
  frontWorkSlot: document.querySelector("#front-work-slot"),
  gameStage: document.querySelector("#game-stage"),
  hangulInputToggle: document.querySelector("#hangul-input-toggle"),
  ingredientDialog: document.querySelector("#ingredient-dialog"),
  ingredientDialogTitle: document.querySelector("#ingredient-dialog-title"),
  ingredientGrid: document.querySelector("#ingredient-grid"),
  input: document.querySelector("#typing-input"),
  inputLabel: document.querySelector("#input-label"),
  inputWrap: document.querySelector("#input-wrap"),
  toolBench: document.querySelector(".tool-bench"),
  kitchenCup: document.querySelector("#kitchen-cup"),
  kitchenActionOverlay: document.querySelector("#kitchen-action-overlay"),
  kitchenDrink: document.querySelector("#kitchen-drink"),
  kitchenOrderSlot: document.querySelector("#kitchen-order-slot"),
  kitchenProgress: document.querySelector("#kitchen-progress"),
  kitchenRoom: document.querySelector("#kitchen-room"),
  kitchenWorkSlot: document.querySelector("#kitchen-work-slot"),
  keyboardDialog: document.querySelector("#keyboard-dialog"),
  keyboardVisibilityControl: document.querySelector("#keyboard-visibility-control"),
  keyboardVisibilityToggle: document.querySelector("#keyboard-visibility-toggle"),
  modeButtons: document.querySelectorAll("[data-mode]"),
  notepadInputSlot: document.querySelector("#notepad-input-slot"),
  orderResult: document.querySelector("#order-result"),
  outcome: document.querySelector("#order-outcome"),
  outcomeDetail: document.querySelector("#outcome-detail"),
  outcomeKorean: document.querySelector("#outcome-korean"),
  outcomeTitle: document.querySelector("#outcome-title"),
  orderTicket: document.querySelector("#order-ticket"),
  orderNoteText: document.querySelector("#order-note-text"),
  orderTicketNumber: document.querySelector("#order-ticket-number"),
  pauseButton: document.querySelector("#pause-button"),
  pausedOverlay: document.querySelector("#paused-overlay"),
  previousRecipe: document.querySelector("#previous-recipe"),
  readyScreen: document.querySelector("#ready-screen"),
  recipeBook: document.querySelector("#recipe-book"),
  recipeDialog: document.querySelector("#recipe-dialog"),
  recipePageNumber: document.querySelector("#recipe-page-number"),
  nextRecipe: document.querySelector("#next-recipe"),
  replayButton: document.querySelector("#replay-button"),
  serveDrinkButton: document.querySelector("#serve-drink-button"),
  servedCount: document.querySelector("#served-count"),
  streakCount: document.querySelector("#streak-count"),
  summary: document.querySelector("#summary"),
  targetLine: document.querySelector("#target-line"),
  taskCue: document.querySelector("#task-cue"),
  timer: document.querySelector("#timer"),
  toolButtons: document.querySelectorAll(".tool-button"),
  translation: document.querySelector("#translation"),
  workInputSlot: document.querySelector("#work-input-slot"),
  workPanel: document.querySelector("#work-panel"),
};

const typingKeyboard = elements.keyboardDialog.querySelector(".keyboard-map").cloneNode(true);
typingKeyboard.classList.add("typing-keyboard");
typingKeyboard.setAttribute("aria-hidden", "true");
typingKeyboard.querySelector(".keyboard-legend")?.remove();
const typingKeyboardControls = document.createElement("div");
typingKeyboardControls.className = "typing-keyboard-controls";
for (const [key, label] of [["Shift", "⇧"], ["Space", "␣"], ["Backspace", "⌫"]]) {
  const keyElement = document.createElement("kbd");
  keyElement.dataset.key = key;
  keyElement.textContent = label;
  typingKeyboardControls.append(keyElement);
}
typingKeyboard.append(typingKeyboardControls);
elements.inputWrap.append(typingKeyboard);
let typingKeyboardAvailable = false;

const state = {
  mode: "hangul",
  room: "front",
  difficulty: loadDifficulty(),
  builtInHangul: loadSetting(HANGUL_INPUT_SETTING, "built-in") !== "native",
  showTypingKeyboard: loadSetting(KEYBOARD_VISIBILITY_SETTING, "shown") !== "hidden",
  phase: "ready",
  taskIndex: 0,
  orderNumber: 0,
  served: 0,
  failed: 0,
  streak: 0,
  bestStreak: 0,
  accuracyTotal: 0,
  attemptsGraded: 0,
  corrections: 0,
  wasInError: false,
  isComposing: false,
  isPaused: false,
  startedAt: 0,
  deadline: 0,
  pausedAt: 0,
  outcomeAt: 0,
  orderMisses: 0,
  drinkIsWrong: false,
  order: null,
  writtenOrder: "",
  lastToolId: null,
  preparedActions: [],
  recipeCompleted: 0,
  selectedAction: null,
  tasks: [],
  recipePage: 0,
};

function currentTask() {
  return state.tasks[state.taskIndex];
}

function modeText(value) {
  return value[activeMode() === "hangul" ? "korean" : "english"];
}

function activeMode() {
  return state.mode;
}

function renderAcceptedOrderTicket() {
  const englishName = document.createElement("span");
  const koreanName = document.createElement("span");
  englishName.className = `order-drink-name${activeMode() === "english" ? " is-primary" : ""}`;
  koreanName.className = `order-drink-name${activeMode() === "hangul" ? " is-primary" : ""}`;
  englishName.textContent = state.order.drink.english;
  koreanName.lang = "ko";
  koreanName.textContent = state.order.drink.korean;
  elements.orderNoteText.replaceChildren(englishName, koreanName);
}

function promptTarget() {
  return state.room === "kitchen" ? state.selectedAction : currentTask()?.target;
}

function expectedAnswer() {
  const target = promptTarget();
  return target ? modeText(target) : "";
}

function formatClock(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function remainingTime() {
  const now = state.isPaused
    ? state.pausedAt
    : state.phase === "order-outcome"
      ? state.outcomeAt
      : performance.now();
  return Math.max(0, state.deadline - now);
}

function selectDifferent(items, previous, key) {
  const choices = items.filter((item) => !previous || item[key] !== previous[key]);
  return choices[Math.floor(Math.random() * choices.length)];
}

function createOrder() {
  const previous = state.order;
  const customerLook = selectDifferent(customerLooks, previous?.customerLook, "color");
  const availableDrinks = unlockedDrinks(UNLOCK_EVERYTHING_FOR_TESTING ? Number.POSITIVE_INFINITY : state.served);
  const drink = selectDifferent(availableDrinks, previous?.drink, "korean");
  const dialogue = drink.dialogue[Math.floor(Math.random() * drink.dialogue.length)];
  return { customerLook, dialogue, drink };
}

function buildTasks(order) {
  const { drink } = order;
  return [
    {
      cue: "Take the order",
      translation: order.dialogue.english,
      target: { korean: drink.korean, english: drink.english },
      inputLabel: "Write down the order",
      action: "Take order",
      noteField: "drink",
    },
  ];
}

function createCharacter({ character, status }) {
  const span = document.createElement("span");
  span.textContent = character === " " ? "\u00a0" : character;
  span.className = `character character--${status}`;
  return span;
}

function renderTarget(evaluation = evaluateWordProgress("", expectedAnswer(), activeMode())) {
  const wordFeedback = activeMode() === "hangul";
  const target = promptTarget();
  const displayCharacters = Array.from(expectedAnswer());
  const displayEvaluation = {
    ...evaluation,
    characters: evaluation.characters.map((character, index) => ({
      ...character,
      character: displayCharacters[index] ?? character.character,
    })),
  };
  const wordsByStart = new Map(displayEvaluation.words.map((word) => [word.start, word]));
  const nodes = [];
  const renderCharacter = (character) => createCharacter(
    wordFeedback ? { ...character, status: "pending" } : character,
  );

  elements.targetLine.classList.toggle("target-line--word-feedback", wordFeedback);
  for (let index = 0; index < displayEvaluation.characters.length;) {
    const word = wordsByStart.get(index);
    if (!word) {
      nodes.push(renderCharacter(displayEvaluation.characters[index]));
      index += 1;
      continue;
    }
    const wordElement = document.createElement("span");
    wordElement.className = "target-word";
    wordElement.classList.toggle("target-word--active", word.active);
    wordElement.classList.toggle("target-word--recognized", word.recognized);
    wordElement.classList.toggle("target-word--incorrect", word.incorrect === true);
    wordElement.replaceChildren(
      ...displayEvaluation.characters.slice(word.start, word.end).map(renderCharacter),
    );
    nodes.push(wordElement);
    index = word.end;
  }
  const primary = document.createElement("span");
  primary.className = "target-primary";
  primary.lang = activeMode() === "hangul" ? "ko" : "en";
  primary.replaceChildren(...nodes);
  const secondary = document.createElement("span");
  secondary.className = "target-secondary";
  secondary.lang = activeMode() === "hangul" ? "en" : "ko";
  secondary.textContent = target?.[activeMode() === "hangul" ? "english" : "korean"] ?? "";
  elements.targetLine.replaceChildren(primary, secondary);
}

function inputStatus() {
  if (activeMode() !== "hangul") return "";
  return state.builtInHangul ? "Built-in Korean keyboard" : "Using device Korean keyboard";
}

function setTypingKeyboardVisible(visible) {
  typingKeyboardAvailable = visible;
  typingKeyboard.hidden = !visible || !state.showTypingKeyboard;
  elements.keyboardVisibilityControl.hidden = !visible;
}

function setTypingKeyPressed(event, pressed) {
  const key = event.code.startsWith("Key")
    ? event.code.slice(3)
    : event.code.startsWith("Shift")
      ? "Shift"
      : event.code;
  for (const keyElement of typingKeyboard.querySelectorAll(`[data-key="${key}"]`)) {
    keyElement.classList.toggle("is-pressed", pressed);
    keyElement.classList.toggle("is-shifted", pressed && event.shiftKey && event.code.startsWith("Key"));
  }
}

function clearTypingKeys() {
  for (const keyElement of typingKeyboard.querySelectorAll(".is-pressed, .is-shifted")) {
    keyElement.classList.remove("is-pressed", "is-shifted");
  }
}

function renderRecipeBook() {
  state.recipePage = Math.max(0, Math.min(state.recipePage, drinks.length - 1));
  const drink = drinks[state.recipePage];
  const page = document.createElement("section");
  const heading = document.createElement("h3");
  const koreanName = document.createElement("p");
  const list = document.createElement("ol");
  const locked = !isUnlocked(drink);
  heading.textContent = drink.english;
  koreanName.className = "recipe-korean-name";
  koreanName.lang = "ko";
  koreanName.textContent = drink.korean;
  page.classList.toggle("is-locked", locked);
  if (locked) {
    const notice = document.createElement("p");
    notice.className = "recipe-lock";
    notice.textContent = `Unlock after ${drink.unlockAt} served orders`;
    page.append(heading, koreanName, notice);
  } else {
    for (const recipeAction of drink.recipe) {
      const item = document.createElement("li");
      item.innerHTML = `<strong lang="ko">${recipeAction.korean}</strong><span>${recipeAction.english}</span>`;
      list.append(item);
    }
    page.append(heading, koreanName, list);
  }
  elements.recipeBook.replaceChildren(page);
  elements.recipePageNumber.textContent = `${state.recipePage + 1} / ${drinks.length}`;
  elements.previousRecipe.disabled = state.recipePage === 0;
  elements.nextRecipe.disabled = state.recipePage === drinks.length - 1;
}

function unlockedCategoryActions(category) {
  return category.actions.filter(isUnlocked);
}

function updateKitchenStations() {
  for (const button of elements.toolButtons) {
    if (button.dataset.category) {
      const category = actionCategories.find(({ id }) => id === button.dataset.category);
      button.disabled = unlockedCategoryActions(category).length === 0;
    } else if (button.dataset.tool !== "discard") {
      const recipeAction = Object.values(recipeActions).find(({ id }) => id === button.dataset.tool);
      button.disabled = !isUnlocked(recipeAction);
    }
  }
}

function openIngredientMenu(categoryId) {
  const category = actionCategories.find(({ id }) => id === categoryId);
  const actions = unlockedCategoryActions(category);
  elements.ingredientDialogTitle.textContent = `${category.english} · ${category.korean}`;
  elements.ingredientGrid.replaceChildren(...actions.map((recipeAction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ingredient-option";
    button.innerHTML = `<strong lang="ko">${recipeAction.korean}</strong><span>${recipeAction.english}</span>`;
    button.addEventListener("click", () => {
      elements.ingredientDialog.close();
      selectKitchenAction(recipeAction, document.querySelector(`[data-category="${categoryId}"]`));
    });
    return button;
  }));
  elements.ingredientDialog.showModal();
}

function clearToolSelection() {
  state.selectedAction = null;
  for (const button of elements.toolButtons) {
    button.classList.remove("is-selected", "is-wrong");
  }
}

function showKitchenPrompt(message = "Choose the next tool from memory.") {
  state.phase = "kitchen-select";
  clearToolSelection();
  elements.kitchenActionOverlay.hidden = true;
  elements.closeKitchenAction.hidden = false;
  elements.serveDrinkButton.disabled = true;
  elements.taskCue.textContent = "Kitchen · 주방";
  elements.translation.textContent = message;
  elements.targetLine.hidden = true;
  elements.inputWrap.hidden = false;
  elements.inputLabel.textContent = "Select a tool";
  elements.input.value = "";
  elements.input.disabled = true;
  setTypingKeyboardVisible(false);
  elements.input.lang = "ko";
  elements.input.classList.remove("has-error", "is-complete");
  elements.actionButton.textContent = "Use tool";
  elements.actionButton.disabled = true;
  elements.compositionState.textContent = `${state.recipeCompleted} actions complete`;
  elements.baristaSpeech.textContent = "레시피 순서를 기억하세요.";
  requestAnimationFrame(() => {
    const availableTools = [...elements.toolButtons].filter((button) => !button.disabled);
    const previousTool = availableTools.find(
      (button) => (button.dataset.tool ?? button.dataset.category) === state.lastToolId,
    );
    (previousTool ?? availableTools[0])?.focus();
  });
}

function enterKitchen() {
  state.room = "kitchen";
  elements.frontRoom.hidden = true;
  elements.kitchenRoom.hidden = false;
  elements.workInputSlot.append(elements.inputWrap);
  elements.kitchenWorkSlot.append(elements.workPanel);
  elements.customerDialogue.hidden = true;
  elements.orderNoteText.hidden = false;
  elements.kitchenOrderSlot.append(elements.orderTicket);
  elements.kitchenDrink.textContent = state.order.drink.english;
  elements.kitchenProgress.replaceChildren();
  renderPreparedDrink();
  elements.discardDrinkButton.disabled = true;
  elements.serveDrinkButton.disabled = true;
  updateKitchenStations();
  showKitchenPrompt();
}

function selectKitchenTool(button) {
  if (button.dataset.category) {
    if (!button.disabled && state.room === "kitchen" && ["kitchen-select", "kitchen-error"].includes(state.phase)) {
      openIngredientMenu(button.dataset.category);
    }
    return;
  }
  const canDiscardReadyDrink = state.phase === "kitchen-complete" && button.dataset.tool === "discard";
  if (
    button.disabled || state.room !== "kitchen" ||
    (!canDiscardReadyDrink && !["kitchen-select", "kitchen-error"].includes(state.phase))
  ) return;
  const recipeAction = Object.values(recipeActions).find(({ id }) => id === button.dataset.tool);
  selectKitchenAction(recipeAction, button);
}

function selectKitchenAction(recipeAction, button) {
  clearToolSelection();
  state.selectedAction = recipeAction;
  state.lastToolId = button.dataset.tool ?? button.dataset.category;
  state.phase = "kitchen-typing";
  button.classList.add("is-selected");
  elements.kitchenActionOverlay.hidden = false;
  elements.closeKitchenAction.hidden = false;
  elements.serveDrinkButton.disabled = true;
  elements.translation.textContent = state.selectedAction.english;
  elements.targetLine.hidden = false;
  renderTarget();
  elements.inputWrap.hidden = false;
  elements.inputLabel.textContent = "Type the emphasized phrase";
  elements.input.disabled = false;
  setTypingKeyboardVisible(activeMode() === "hangul");
  elements.input.lang = activeMode() === "hangul" ? "ko" : "en";
  elements.actionButton.textContent = "Use tool";
  elements.actionButton.disabled = false;
  elements.compositionState.textContent = inputStatus();
  elements.baristaSpeech.textContent = "도구를 사용하려면 행동을 입력하세요.";
  requestAnimationFrame(() => elements.input.focus());
}

function addCompletedAction(recipeAction, wrong = false) {
  const item = document.createElement("li");
  item.textContent = recipeAction.korean;
  item.classList.toggle("is-wrong", wrong);
  elements.kitchenProgress.append(item);
  state.preparedActions.push(recipeAction.id);
  renderPreparedDrink();
  elements.discardDrinkButton.disabled = false;
}

function renderPreparedDrink() {
  const vessel = [...state.preparedActions]
    .reverse()
    .find((actionId) => actionId === "mug" || actionId === "clear-cup");
  const ingredients = new Set(state.preparedActions);
  elements.kitchenCup.className = "kitchen-cup";
  elements.kitchenCup.classList.toggle("is-empty", !vessel);
  elements.kitchenCup.classList.toggle("is-mug", vessel === "mug");
  elements.kitchenCup.classList.toggle("is-glass", vessel === "clear-cup");
  for (const ingredient of ["coffee", "water", "sparkling-water", "milk", "ice"]) {
    elements.kitchenCup.classList.toggle(`has-${ingredient}`, ingredients.has(ingredient));
  }
  const preparedIngredients = state.preparedActions
    .map((actionId) => Object.values(recipeActions).find(({ id }) => id === actionId))
    .filter(Boolean);
  for (const category of ["tea", "syrup", "milk", "topping"]) {
    elements.kitchenCup.classList.toggle(
      `has-${category}`,
      preparedIngredients.some((recipeAction) => recipeAction.category === category),
    );
  }
  for (const ingredient of ["green-tea", "matcha", "hibiscus", "peach-tea", "yuja", "strawberry-syrup", "lemon-syrup", "green-grape-syrup", "grapefruit-syrup", "peach-syrup", "whipped-cream", "lemon"]) {
    elements.kitchenCup.classList.toggle(`has-${ingredient}`, ingredients.has(ingredient));
  }
  elements.kitchenCup.setAttribute(
    "aria-label",
    vessel ? `${vessel === "mug" ? "Mug" : "Tall glass"} with ${state.preparedActions.join(", ")}` : "No cup selected",
  );
}

function finishDrink() {
  state.phase = "kitchen-complete";
  clearToolSelection();
  elements.kitchenActionOverlay.hidden = true;
  elements.serveDrinkButton.disabled = false;
  elements.translation.textContent = `${state.order.drink.english} complete`;
  elements.input.value = "";
  elements.input.disabled = true;
  elements.inputWrap.hidden = true;
  setTypingKeyboardVisible(false);
  elements.input.classList.add("is-complete");
  elements.baristaSpeech.textContent = "음료가 완성됐어요!";
  requestAnimationFrame(() => elements.serveDrinkButton.focus());
}

function serveDrink() {
  if (state.phase !== "kitchen-complete") return;
  state.room = "front";
  elements.kitchenActionOverlay.hidden = true;
  elements.serveDrinkButton.disabled = true;
  elements.kitchenRoom.hidden = true;
  elements.frontRoom.hidden = false;
  elements.frontWorkSlot.append(elements.workPanel);
  elements.frontOrderSlot.append(elements.orderTicket);
  elements.customerDialogue.hidden = false;
  elements.customerLine.textContent = "감사합니다!";
  elements.customerTranslation.textContent = "Thank you!";
  elements.taskCue.textContent = "Order served";
  elements.targetLine.hidden = true;
  if (state.drinkIsWrong) {
    resolveOrder(
      false,
      `That wasn't the ${state.order.drink.english} they ordered.`,
      "Customer unhappy",
      "주문한 음료가 아니에요",
    );
  } else {
    resolveOrder(true, `${state.order.drink.english} handed off successfully.`);
  }
}

function discardDrink() {
  state.recipeCompleted = 0;
  state.drinkIsWrong = false;
  state.orderMisses = 0;
  state.preparedActions = [];
  elements.kitchenProgress.replaceChildren();
  renderPreparedDrink();
  elements.discardDrinkButton.disabled = true;
  showKitchenPrompt("Fresh cup. Start the recipe again.");
}

function cancelKitchenAction() {
  if (state.phase !== "kitchen-typing") return;
  if (state.selectedAction?.id === "discard" && state.recipeCompleted === state.order.drink.recipe.length) {
    finishDrink();
    return;
  }
  showKitchenPrompt("Action cancelled. Choose a tool.");
}

function navigateKitchenTools(event) {
  if (state.room !== "kitchen" || state.phase !== "kitchen-select") return;
  const directions = {
    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],
    ArrowRight: [1, 0],
    KeyD: [1, 0],
    ArrowUp: [0, -1],
    KeyW: [0, -1],
    ArrowDown: [0, 1],
    KeyS: [0, 1],
  };
  const direction = directions[event.code];
  if (!direction) return;
  event.preventDefault();
  const availableTools = [...elements.toolButtons].filter((button) => !button.disabled);
  const current = document.activeElement.closest?.("[data-tool]");
  if (!current || !availableTools.includes(current)) {
    availableTools[0]?.focus();
    return;
  }

  const currentRect = current.getBoundingClientRect();
  const originX = currentRect.left + currentRect.width / 2;
  const originY = currentRect.top + currentRect.height / 2;
  const candidates = availableTools
    .filter((button) => button !== current)
    .map((button) => {
      const rect = button.getBoundingClientRect();
      const deltaX = rect.left + rect.width / 2 - originX;
      const deltaY = rect.top + rect.height / 2 - originY;
      const forward = deltaX * direction[0] + deltaY * direction[1];
      const sideways = Math.abs(deltaX * direction[1] - deltaY * direction[0]);
      return { button, forward, score: forward + sideways * 2 };
    })
    .filter(({ forward }) => forward > 4)
    .sort((first, second) => first.score - second.score);
  candidates[0]?.button.focus();
}

function renderTask() {
  const task = currentTask();
  const isWritingOrder = task.noteField === "drink";
  state.phase = "typing";
  state.wasInError = false;
  elements.taskCue.textContent = task.cue;
  elements.translation.textContent = task.translation;
  elements.customerTranslation.textContent = task.translation;
  elements.inputLabel.textContent = task.inputLabel;
  elements.actionButton.textContent = task.action;
  elements.actionButton.disabled = false;
  elements.targetLine.hidden = false;
  elements.inputWrap.hidden = false;
  elements.kitchenActionOverlay.hidden = true;
  elements.orderNoteText.hidden = isWritingOrder;
  if (isWritingOrder) elements.notepadInputSlot.append(elements.inputWrap);
  else elements.workInputSlot.append(elements.inputWrap);
  elements.customerDialogue.hidden = false;
  elements.customerLine.textContent = state.order.dialogue.korean;
  elements.baristaSpeech.textContent = "주문을 정확히 적어 주세요.";
  elements.input.value = "";
  elements.input.disabled = false;
  setTypingKeyboardVisible(activeMode() === "hangul");
  elements.input.lang = activeMode() === "hangul" ? "ko" : "en";
  elements.input.classList.remove("has-error", "is-complete");
  elements.compositionState.textContent = inputStatus();
  renderTarget();
  requestAnimationFrame(() => elements.input.focus());
}

function beginOrder() {
  state.room = "front";
  elements.frontRoom.hidden = false;
  elements.kitchenRoom.hidden = true;
  elements.frontWorkSlot.append(elements.workPanel);
  state.orderNumber += 1;
  state.taskIndex = 0;
  state.order = createOrder();
  state.tasks = buildTasks(state.order);
  elements.customerPortrait.textContent = state.order.customerLook.portrait;
  elements.customerPortrait.dataset.color = state.order.customerLook.color;
  elements.customerLine.textContent = state.order.dialogue.korean;
  elements.frontOrderSlot.append(elements.orderTicket);
  elements.orderTicketNumber.textContent = `ORDER ${String(state.orderNumber).padStart(2, "0")}`;
  elements.orderNoteText.textContent = "Start writing...";
  state.writtenOrder = "";
  state.preparedActions = [];
  state.recipeCompleted = 0;
  state.orderMisses = 0;
  state.drinkIsWrong = false;
  state.selectedAction = null;
  renderTask();
}

function startShift() {
  const duration = SHIFT_LENGTHS[state.difficulty];
  state.phase = "typing";
  state.served = 0;
  state.failed = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.orderNumber = 0;
  state.accuracyTotal = 0;
  state.attemptsGraded = 0;
  state.corrections = 0;
  state.room = "front";
  state.startedAt = performance.now();
  state.deadline = state.startedAt + duration;
  elements.readyScreen.hidden = true;
  elements.summary.hidden = true;
  elements.gameStage.hidden = false;
  elements.frontRoom.hidden = false;
  elements.kitchenRoom.hidden = true;
  elements.frontWorkSlot.append(elements.workPanel);
  elements.pauseButton.disabled = false;
  elements.servedCount.textContent = "0";
  elements.failedCount.textContent = "0";
  elements.streakCount.textContent = "0";
  beginOrder();
  updateClock();
}

function finishShift() {
  if (state.phase === "complete" || state.phase === "ready") return;
  state.phase = "complete";
  state.isPaused = false;
  const accuracy = state.attemptsGraded
    ? Math.round((state.accuracyTotal / state.attemptsGraded) * 100)
    : 0;
  elements.gameStage.hidden = true;
  elements.outcome.hidden = true;
  elements.pausedOverlay.hidden = true;
  elements.summary.hidden = false;
  elements.pauseButton.disabled = true;
  elements.pauseButton.textContent = "Pause";
  elements.timer.textContent = "00:00";
  elements.orderResult.textContent = String(state.served);
  elements.failedResult.textContent = String(state.failed);
  elements.accuracyResult.textContent = `${accuracy}%`;
  elements.bestStreakResult.textContent = String(state.bestStreak);
}

function resolveOrder(success, detail, title, korean) {
  state.phase = "order-outcome";
  state.outcomeAt = performance.now();
  elements.input.disabled = true;
  setTypingKeyboardVisible(false);
  elements.outcome.dataset.result = success ? "success" : "failure";
  elements.outcomeTitle.textContent = title ?? (success ? "Order out!" : "Order missed");
  elements.outcomeKorean.textContent = korean ?? (success ? "잘했어요!" : "다음 주문에 다시 도전해요");
  elements.outcomeDetail.textContent = detail;
  elements.outcome.hidden = false;
  if (success) {
    state.served += 1;
    elements.servedCount.textContent = String(state.served);
    const newlyUnlocked = UNLOCK_EVERYTHING_FOR_TESTING
      ? []
      : drinks.filter(({ unlockAt }) => unlockAt === state.served);
    if (newlyUnlocked.length) {
      elements.outcomeDetail.textContent += ` New recipes unlocked: ${newlyUnlocked.map(({ english }) => english).join(", ")}.`;
    }
  } else {
    state.failed += 1;
    state.streak = 0;
    elements.failedCount.textContent = String(state.failed);
    elements.streakCount.textContent = "0";
  }
}

function continueAfterOutcome() {
  state.deadline += performance.now() - state.outcomeAt;
  elements.outcome.hidden = true;
  beginOrder();
}

function showTaskFeedback(task, tier) {
  state.phase = "feedback";
  elements.input.disabled = true;
  setTypingKeyboardVisible(false);
  elements.actionButton.disabled = false;
  elements.input.classList.toggle("is-complete", tier === "perfect");
  elements.actionButton.textContent = task.noteField === "drink" ? "Go to kitchen" : "Continue";

  if (task.noteField === "drink") {
    state.writtenOrder = elements.input.value.trim();
    renderAcceptedOrderTicket();
  }
  elements.compositionState.textContent = tier === "perfect" ? "Perfect" : "Understood";
}

function submitTask() {
  if (state.room === "kitchen") {
    submitKitchenAction();
    return;
  }
  if (state.phase !== "typing" || state.isComposing || state.isPaused) return;
  const task = currentTask();
  const result = gradeResponse(elements.input.value, modeText(task.target), state.mode);
  state.accuracyTotal += result.accuracy;
  state.attemptsGraded += 1;

  if (result.tier === "missed") {
    const languageAttempt = evaluateLanguageAttempt(state.orderMisses, result.tier);
    state.orderMisses = languageAttempt.misses;
    state.streak = 0;
    elements.streakCount.textContent = "0";
    elements.input.classList.add("has-error");
    if (languageAttempt.failed) {
      resolveOrder(false, "The order wasn't understood after two tries.");
    } else {
      elements.compositionState.textContent = "Not understood. One try remaining.";
    }
    return;
  }

  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  elements.streakCount.textContent = String(state.streak);
  showTaskFeedback(task, result.tier);
}

function submitKitchenAction() {
  if (state.phase !== "kitchen-typing" || !state.selectedAction || state.isComposing || state.isPaused) return;
  const result = gradeResponse(elements.input.value, modeText(state.selectedAction), activeMode());
  state.accuracyTotal += result.accuracy;
  state.attemptsGraded += 1;

  if (result.tier === "missed") {
    const languageAttempt = evaluateLanguageAttempt(state.orderMisses, result.tier);
    state.orderMisses = languageAttempt.misses;
    state.streak = 0;
    elements.streakCount.textContent = "0";
    elements.input.classList.add("has-error");
    if (languageAttempt.failed) {
      resolveOrder(false, "The action wasn't understood after two tries.");
    } else {
      elements.compositionState.textContent = "Not understood. One try remaining.";
    }
    return;
  }

  if (state.selectedAction.id === "discard") {
    discardDrink();
    return;
  }

  const recipeResult = evaluateRecipeAction(
    state.order.drink.recipe,
    state.recipeCompleted,
    state.selectedAction.id,
  );
  if (!recipeResult.correct) {
    state.corrections += 1;
    state.drinkIsWrong = true;
    addCompletedAction(state.selectedAction, true);
    showKitchenPrompt("That changed the drink. Throw it out, or continue at your own risk.");
    return;
  }

  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.recipeCompleted = recipeResult.nextCompletedCount;
  elements.streakCount.textContent = String(state.streak);
  addCompletedAction(state.selectedAction);
  if (recipeResult.complete) finishDrink();
  else showKitchenPrompt();
}

function advanceTask() {
  if (state.phase !== "feedback") return;
  enterKitchen();
}

function evaluateInput() {
  if (!["typing", "kitchen-typing"].includes(state.phase) || state.isPaused || elements.input.disabled) return;
  if (state.room === "front" && currentTask().noteField === "drink") {
    elements.orderNoteText.textContent = elements.input.value.trim() || "Start writing...";
  }
  if (state.isComposing) return;
  const evaluation = evaluateWordProgress(elements.input.value, expectedAnswer(), activeMode());
  if (!elements.targetLine.hidden) renderTarget(evaluation);
  const hasError = activeMode() === "hangul"
    ? evaluation.words.some(({ incorrect }) => incorrect)
    : evaluation.hasError;
  if (hasError && !state.wasInError) state.corrections += 1;
  state.wasInError = hasError;
  elements.input.classList.toggle("has-error", hasError);
  if (evaluation.complete) submitTask();
}

function updateClock() {
  if (state.phase === "ready" || state.phase === "complete") return;
  if (TESTING_WITHOUT_TIME_LIMIT) {
    elements.timer.textContent = "NO LIMIT";
    elements.timer.classList.remove("is-urgent");
    return;
  }
  const remaining = remainingTime();
  elements.timer.textContent = formatClock(remaining);
  elements.timer.classList.toggle("is-urgent", remaining <= 15000);
  if (remaining <= 0) finishShift();
}

function resetGame() {
  state.phase = "ready";
  state.room = "front";
  state.isPaused = false;
  elements.gameStage.hidden = true;
  elements.summary.hidden = true;
  elements.outcome.hidden = true;
  elements.readyScreen.hidden = false;
  elements.frontRoom.hidden = false;
  elements.kitchenRoom.hidden = true;
  elements.kitchenActionOverlay.hidden = true;
  setTypingKeyboardVisible(false);
  elements.frontWorkSlot.append(elements.workPanel);
  elements.pausedOverlay.hidden = true;
  elements.pauseButton.disabled = true;
  elements.pauseButton.textContent = "Pause";
  elements.timer.textContent = TESTING_WITHOUT_TIME_LIMIT
    ? "NO LIMIT"
    : formatClock(SHIFT_LENGTHS[state.difficulty]);
  elements.timer.classList.remove("is-urgent");
  elements.servedCount.textContent = "0";
  elements.failedCount.textContent = "0";
  elements.streakCount.textContent = "0";
}

function togglePause() {
  if (state.phase === "ready" || state.phase === "complete") return;
  state.isPaused = !state.isPaused;
  if (state.isPaused) {
    state.pausedAt = performance.now();
  } else {
    state.deadline += performance.now() - state.pausedAt;
    requestAnimationFrame(() => elements.input.focus());
  }
  elements.pausedOverlay.hidden = !state.isPaused;
  elements.pauseButton.textContent = state.isPaused ? "Resume" : "Pause";
}

elements.clockInButton.addEventListener("click", startShift);
elements.replayButton.addEventListener("click", startShift);
document.querySelector("#next-order-button").addEventListener("click", continueAfterOutcome);
elements.closeKitchenAction.addEventListener("click", cancelKitchenAction);
elements.kitchenActionOverlay.addEventListener("click", (event) => {
  if (event.target === elements.kitchenActionOverlay) cancelKitchenAction();
});
elements.kitchenActionOverlay.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  cancelKitchenAction();
});
elements.serveDrinkButton.addEventListener("click", serveDrink);
elements.actionButton.addEventListener("click", () => {
  if (state.phase === "kitchen-complete") {
    serveDrink();
    return;
  }
  if (state.phase === "kitchen-error") {
    showKitchenPrompt("Choose a different tool.");
    return;
  }
  if (state.phase === "typing") submitTask();
  else if (state.phase === "kitchen-typing") submitKitchenAction();
  else advanceTask();
});
elements.input.addEventListener("keydown", (event) => {
  setTypingKeyPressed(event, true);
  if (event.key === "Enter" && !state.isComposing) {
    if (state.phase === "feedback") advanceTask();
    else if (state.phase === "kitchen-complete") serveDrink();
    else submitTask();
    return;
  }
  if (
    activeMode() !== "hangul" || !state.builtInHangul || state.isComposing || event.isComposing ||
    event.metaKey || event.ctrlKey || event.altKey
  ) return;

  const selectionStart = elements.input.selectionStart ?? elements.input.value.length;
  const selectionEnd = elements.input.selectionEnd ?? selectionStart;
  let edit = null;
  if (event.key === "Backspace") {
    edit = deleteHangulBackward(elements.input.value, selectionStart, selectionEnd);
  } else {
    const jamo = jamoForKey(event.code, event.shiftKey);
    if (jamo) edit = insertHangulKey(elements.input.value, selectionStart, selectionEnd, jamo);
  }
  if (!edit) return;
  event.preventDefault();
  elements.input.value = edit.value;
  elements.input.setSelectionRange(edit.selectionStart, edit.selectionEnd ?? edit.selectionStart);
  evaluateInput();
});
document.addEventListener("keyup", (event) => setTypingKeyPressed(event, false));
elements.input.addEventListener("blur", clearTypingKeys);
elements.input.addEventListener("compositionstart", () => {
  state.isComposing = true;
  elements.compositionState.textContent = "Composing Hangul...";
});
elements.input.addEventListener("compositionend", () => {
  state.isComposing = false;
  elements.compositionState.textContent = inputStatus();
  requestAnimationFrame(evaluateInput);
});
elements.input.addEventListener("input", evaluateInput);
elements.toolBench.addEventListener("keydown", navigateKitchenTools);

for (const button of elements.toolButtons) {
  button.addEventListener("click", () => selectKitchenTool(button));
}

for (const button of elements.modeButtons) {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    for (const modeButton of elements.modeButtons) {
      const selected = modeButton === button;
      modeButton.classList.toggle("is-active", selected);
      modeButton.setAttribute("aria-pressed", String(selected));
    }
    if (["typing", "kitchen-typing"].includes(state.phase)) {
      elements.input.value = "";
      elements.input.lang = activeMode() === "hangul" ? "ko" : "en";
      elements.input.classList.remove("has-error", "is-complete");
      setTypingKeyboardVisible(activeMode() === "hangul");
      elements.compositionState.textContent = inputStatus();
      renderTarget();
      requestAnimationFrame(() => elements.input.focus());
    }
    if (state.writtenOrder) renderAcceptedOrderTicket();
  });
}

for (const button of elements.difficultyButtons) {
  const selected = button.dataset.difficulty === state.difficulty;
  button.classList.toggle("is-active", selected);
  button.setAttribute("aria-pressed", String(selected));
  button.addEventListener("click", () => {
    state.difficulty = button.dataset.difficulty;
    for (const difficultyButton of elements.difficultyButtons) {
      const isSelected = difficultyButton === button;
      difficultyButton.classList.toggle("is-active", isSelected);
      difficultyButton.setAttribute("aria-pressed", String(isSelected));
    }
    try {
      localStorage.setItem(DIFFICULTY_SETTING, state.difficulty);
    } catch {
      // Keep the setting for this session when storage is unavailable.
    }
    resetGame();
  });
}

document.querySelector("#keyboard-help").addEventListener("click", () => elements.keyboardDialog.showModal());
document.querySelector("#recipe-book-button").addEventListener("click", () => {
  state.recipePage = Math.max(0, drinks.indexOf(state.order?.drink));
  renderRecipeBook();
  elements.recipeDialog.showModal();
});
elements.previousRecipe.addEventListener("click", () => {
  state.recipePage -= 1;
  renderRecipeBook();
});
elements.nextRecipe.addEventListener("click", () => {
  state.recipePage += 1;
  renderRecipeBook();
});
document.querySelector("#restart-button").addEventListener("click", resetGame);
document.querySelector("#resume-button").addEventListener("click", togglePause);
elements.pauseButton.addEventListener("click", togglePause);
elements.hangulInputToggle.checked = state.builtInHangul;
elements.hangulInputToggle.addEventListener("change", () => {
  state.builtInHangul = elements.hangulInputToggle.checked;
  try {
    localStorage.setItem(HANGUL_INPUT_SETTING, state.builtInHangul ? "built-in" : "native");
  } catch {
    // Keep the setting for this session when storage is unavailable.
  }
  elements.compositionState.textContent = inputStatus();
});
elements.keyboardVisibilityToggle.checked = state.showTypingKeyboard;
elements.keyboardVisibilityToggle.addEventListener("change", () => {
  state.showTypingKeyboard = elements.keyboardVisibilityToggle.checked;
  try {
    localStorage.setItem(KEYBOARD_VISIBILITY_SETTING, state.showTypingKeyboard ? "shown" : "hidden");
  } catch {
    // Keep the setting for this session when storage is unavailable.
  }
  setTypingKeyboardVisible(typingKeyboardAvailable);
});

setInterval(updateClock, 100);
renderRecipeBook();
resetGame();
