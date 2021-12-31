export function disableLog(ns, ...args) {
  for (const arg of args) {
    ns.disableLog(arg);
  }
}

export function createLogger(ns, { isDaemon = false }) {
  disableLog('print', 'tprint');
  return function log(msg) {
    if (isDaemon) {
      ns.print(msg);
    } else {
      ns.tprint(msg);
    }
  };
}

export function createErrorLogger(ns, { isDaemon = false }) {
  disableLog('print', 'toast', 'tprint');
  return function logError() {
    if (isDaemon) {
      ns.print(msg);
      ns.toast(msg, 'error');
    } else {
      ns.tprint(msg);
    }
  };
}
