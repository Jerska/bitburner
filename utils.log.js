export function createLogger(ns, { isDaemon = false, daemonPrintTerminal = false } = {}) {
  return function log(msg, { toast = null } = {}) {
    if (isDaemon && !daemonPrintTerminal) {
      ns.print(msg);
      if (toast !== null) ns.toast(msg, toast);
    } else {
      ns.tprint(msg);
    }
  };
}

export function createErrorLogger(ns, { isDaemon = false, daemonPrintTerminal = false } = {}) {
  return function logError(msg, { alert = false } = {}) {
    if (isDaemon && !daemonPrintTerminal) {
      ns.print(msg);
      ns.toast(msg, 'error');
    } else {
      ns.tprint(msg);
    }
    if (alert) {
      ns.alert(msg);
    }
  };
}
