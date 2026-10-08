/**
 * Switches for features that are built but intentionally not shown right now.
 * Turning one on brings it back without touching the feature's code.
 */
export const FEATURES = {
  /**
   * "Empfehlung mit KI erklären" in the advisor report (client) and the
   * /api/gemini/advisor route (server.ts). Off while there is no budget for AI
   * calls: the button is hidden, nothing is requested, and no server load is
   * created. Set to true to restore it.
   */
  aiExplanation: false
} as const;
