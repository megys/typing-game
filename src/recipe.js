export function evaluateRecipeAction(recipe, completedCount, actionId) {
  const expected = recipe[completedCount];
  const correct = expected?.id === actionId;
  return {
    correct,
    complete: correct && completedCount + 1 === recipe.length,
    nextCompletedCount: correct ? completedCount + 1 : completedCount,
  };
}

export function evaluateLanguageAttempt(currentMisses, tier, limit = 2) {
  const misses = tier === "missed" ? currentMisses + 1 : currentMisses;
  return { misses, failed: misses >= limit };
}