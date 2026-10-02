export const DEFAULT_DIFFICULTY = "medium";

export function responseDuration(seconds, difficulty = DEFAULT_DIFFICULTY) {
  if (difficulty === "easy") return null;
  if (difficulty === "hard") return Math.max(4, Math.ceil(seconds * 0.5)) * 1000;
  return seconds * 1000;
}