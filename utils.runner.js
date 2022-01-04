import { createLogger, createErrorLogger } from './utils.log.js';

export function createRunner(ns, isDaemon, { cleanup = () => {}, sleepDuration = 1000 } = {}) {
  return async function run(fn) {
    const log = createLogger(ns, { isDaemon });
    const logError = createErrorLogger(ns, { isDaemon });
    let firstRun = true;
    let shouldStop = !isDaemon;
    const stop = () => {
      shouldStop = true;
    };
    if (isDaemon) ns.tprint('Running daemon');
    do {
      await fn({ firstRun, log, logError, stop });
      firstRun = false;
      await cleanup();
      if (isDaemon) {
        log(`Sleeping ${sleepDuration} ms`);
        await ns.asleep(sleepDuration);
      }
    } while (!shouldStop);
  };
}
