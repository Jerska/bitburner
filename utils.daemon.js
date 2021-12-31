import { createLogger, createErrorLogger } from './utils.log.js';

export function createDaemonRunner(ns, isDaemon, { cleanup = () => {}, sleepDuration = 1000 }) {
  return async function daemonRun(fn) {
    const log = createLogger(ns, { isDaemon });
    const errorLog = createErrorLogger(ns, { isDaemon });
    do {
      await fn(log, errorLog);
      if (isDaemon) await ns.asleep(sleepDuration);
      await cleanup();
    } while (isDaemon);
  };
}
