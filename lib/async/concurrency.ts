export type ConcurrencyResult = { succeeded: number; errors: string[] };

/** Run async work over items with a fixed concurrency limit. */
export async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  onError?: (item: T, error: unknown) => string
): Promise<ConcurrencyResult> {
  if (items.length === 0) {
    return { succeeded: 0, errors: [] };
  }

  const errors: string[] = [];
  let succeeded = 0;
  let index = 0;
  const limit = Math.max(1, Math.min(concurrency, items.length));

  async function runWorker() {
    while (index < items.length) {
      const current = index++;
      const item = items[current];
      try {
        await worker(item);
        succeeded += 1;
      } catch (error) {
        errors.push(onError?.(item, error) ?? String(error));
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
  return { succeeded, errors };
}
