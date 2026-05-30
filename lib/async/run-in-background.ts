import { after } from 'next/server';

/** Run work after the response is sent (emails, metrics). Falls back to fire-and-forget locally. */
export function runInBackground(label: string, work: () => Promise<void>): void {
  const run = () => {
    work().catch((error) => {
      console.error(`[background:${label}]`, error);
    });
  };

  try {
    after(run);
  } catch {
    run();
  }
}
