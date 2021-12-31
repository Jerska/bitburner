import { createLogger, createErrorLogger } from './utils.log.js';

export function createRunner(ns, isDaemon, { cleanup = () => {}, sleepDuration = 1000 } = {}) {
  return async function run(fn) {
    const log = createLogger(ns, { isDaemon });
    const errorLog = createErrorLogger(ns, { isDaemon });
    if (isDaemon) ns.tprint('Running daemon');
    do {
      await fn(log, errorLog);
      await cleanup();
      if (isDaemon) {
        log(`Sleeping ${sleepDuration} ms`);
        await ns.asleep(sleepDuration);
      }
    } while (isDaemon);
  };
}
