export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/** Max tasks included in AI workspace snapshot to limit latency and token usage. */
export const AI_CONTEXT_MAX_TASKS = 50;

/** Max parallel Gemini evaluations when refreshing org metrics. */
export const PERFORMANCE_EVAL_CONCURRENCY = 3;
