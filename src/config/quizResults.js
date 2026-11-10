// ═══════════════════════════════════════════════════════════════
// ECOFUTURE ZERO-WASTE QUIZ — RESULTS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Health thresholds for result tiers (health = score * 10)
 */
export const QUIZ_RESULT_THRESHOLDS = {
  PERFECT: 100, // 10/10 questions correct
  GOOD: 80,     // 80% to 99% (8-9/10 correct)
  LOW: 40,      // Below 40% (0-3/10 correct) - Strong encouraging tone
};

/**
 * Quotes and messages by performance tier
 */
export const QUIZ_RESULT_QUOTES = {
  // 100% - Celebration
  PERFECT: [
    'A perfect score. The Earth is fully healed, and you did it.',
  ],

  // 80% to 99% - Good quote
  GOOD: [
    'Well done. The planet is breathing easier because of you.',
    'Almost there. You are a true guardian of the Earth.',
    'Great work. A few more answers and the Earth is fully healed.',
  ],

  // 40% to 79% - Motivating message pushing for 100%
  MOTIVATING: [
    'The Earth is still hurting. Retake the quiz and heal the rest.',
    'Not healed yet. Every right answer cleans more of the planet. Try again for 100%.',
    'Your planet needs you. Retake the quiz and finish the job.',
  ],

  // Under 40% - Stronger but encouraging tone
  LOW: [
    'The Earth is in trouble. Learn the answers, retake the quiz, and bring it back to life.',
    'Every effort matters. Study the eco-principles, retake the quiz, and save our planet.',
    'The planet needs stronger action. Retake the quiz to turn the tide.',
  ],
};

// Track last chosen quote per session to avoid immediate repeats
let lastChosenQuote = null;

/**
 * Returns a quote based on quiz health with no immediate repeat
 * @param {number} health - 0 to 100
 * @returns {string} The result message quote
 */
export function getQuizResultQuote(health) {
  let list;

  if (health >= QUIZ_RESULT_THRESHOLDS.PERFECT) {
    return QUIZ_RESULT_QUOTES.PERFECT[0];
  } else if (health >= QUIZ_RESULT_THRESHOLDS.GOOD) {
    list = QUIZ_RESULT_QUOTES.GOOD;
  } else if (health >= QUIZ_RESULT_THRESHOLDS.LOW) {
    list = QUIZ_RESULT_QUOTES.MOTIVATING;
  } else {
    list = QUIZ_RESULT_QUOTES.LOW;
  }

  // Filter out the last quote to ensure variety
  const candidates = list.filter((q) => q !== lastChosenQuote);
  const pool = candidates.length > 0 ? candidates : list;
  const chosen = pool[Math.floor(Math.random() * pool.length)] || list[0];
  lastChosenQuote = chosen;
  return chosen;
}

/**
 * Returns the progress deficit message for scores below 100%
 * @param {number} health - 0 to 100
 * @returns {string|null} E.g. "20% more to fully heal the Earth"
 */
export function getQuizProgressLine(health) {
  if (health >= 100) return null;
  const remaining = Math.max(0, 100 - health);
  return `${remaining}% more to fully heal the Earth`;
}
