import { createLogger, createErrorLogger } from './utils.log.js';

export function createRunner(ns, isDaemon, { cleanup = () => {}, sleepDuration = 1000 } = {}) {
  return async function run(fn) {
    const log = createLogger(ns, { isDaemon });
    const errorLog = createErrorLogger(ns, { isDaemon });
    let shouldStop = !isDaemon;
    const stop = () => {
      shouldStop = true;
    };
    if (isDaemon) ns.tprint('Running daemon');
    do {
      await fn({ log, errorLog, stop });
      await cleanup();
      if (isDaemon) {
        log(`Sleeping ${sleepDuration} ms`);
        await ns.asleep(sleepDuration);
      }
    } while (shouldStop);
  };
}
