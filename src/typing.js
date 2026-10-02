export function normalizeText(value, mode = "hangul") {
  const normalized = value.normalize("NFC");
  return ["english", "romanization"].includes(mode)
    ? normalized.toLocaleLowerCase("en-US")
    : normalized;
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] +
        (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        substitution,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

export function gradeResponse(input, expected, mode = "hangul") {
  const inputCharacters = Array.from(normalizeText(input.trim(), mode));
  const expectedCharacters = Array.from(normalizeText(expected.trim(), mode));
  const longestLength = Math.max(inputCharacters.length, expectedCharacters.length);
  const accuracy = longestLength === 0
    ? 1
    : Math.max(0, 1 - editDistance(inputCharacters, expectedCharacters) / longestLength);

  return {
    accuracy,
    tier: accuracy === 1 ? "perfect" : accuracy >= 0.7 ? "close" : "missed",
  };
}

export function evaluateAnswer(input, expected, mode = "hangul") {
  const normalizedInput = normalizeText(input, mode);
  const normalizedExpected = normalizeText(expected, mode);
  const inputCharacters = Array.from(normalizedInput);
  const expectedCharacters = Array.from(normalizedExpected);

  const characters = expectedCharacters.map((character, index) => {
    if (index >= inputCharacters.length) {
      return { character, status: "pending" };
    }

    return {
      character,
      status: inputCharacters[index] === character ? "correct" : "incorrect",
    };
  });

  return {
    characters,
    complete: normalizedInput === normalizedExpected,
    hasError:
      inputCharacters.length > expectedCharacters.length ||
      characters.some(({ status }) => status === "incorrect"),
  };
}

function findWordRanges(characters) {
  const ranges = [];
  let start = null;

  characters.forEach((character, index) => {
    const isWordCharacter = /[\p{L}\p{N}]/u.test(character);
    if (isWordCharacter && start === null) start = index;
    if (!isWordCharacter && start !== null) {
      ranges.push({ start, end: index });
      start = null;
    }
  });

  if (start !== null) ranges.push({ start, end: characters.length });
  return ranges;
}

export function evaluateWordProgress(input, expected, mode = "hangul") {
  const evaluation = evaluateAnswer(input, expected, mode);
  const inputCharacters = Array.from(normalizeText(input, mode));
  const expectedCharacters = Array.from(normalizeText(expected, mode));
  const ranges = findWordRanges(expectedCharacters);
  let activeWordIndex = ranges.findIndex(({ end }) => inputCharacters.length <= end);

  if (activeWordIndex === -1 && ranges.length > 0) {
    activeWordIndex = ranges.length - 1;
  }

  const words = ranges.map(({ start, end }, index) => {
    const enteredWord = inputCharacters.slice(start, end).join("");
    const expectedWord = expectedCharacters.slice(start, end).join("");
    const recognized = inputCharacters.length >= end && enteredWord === expectedWord;
    const incorrect = inputCharacters.length > end && enteredWord !== expectedWord;

    return {
      start,
      end,
      active: index === activeWordIndex,
      recognized,
      incorrect,
    };
  });

  return { ...evaluation, words };
}