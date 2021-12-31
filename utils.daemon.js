import { createLogger, createErrorLogger } from './utils.log.js';

export function createDaemonRunner(ns, isDaemon, { cleanup = () => {}, sleepDuration = 1000 }) {
  return async function daemonRun(fn) {
    const log = createLogger(ns, { isDaemon });
    const errorLog = createErrorLogger(ns, { isDaemon });
    while (isDaemon) {
      await fn(log, errorLog);
      await ns.asleep(sleepDuration);
      await cleanup();
    }
  };
}
