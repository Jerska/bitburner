export function createLogger(ns, { isDaemon = false }) {
  return function log(msg) {
    if (isDaemon) {
      ns.print(msg);
    } else {
      ns.tprint(msg);
    }
  };
}

export function createErrorLogger(ns, { isDaemon = false }) {
  return function logError() {
    if (isDaemon) {
      ns.print(msg);
      ns.toast(msg, 'error');
    } else {
      ns.tprint(msg);
    }
  };
}
