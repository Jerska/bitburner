export function createLogger(ns, { isDaemon = false } = {}) {
  return function log(msg, { toast = null } = {}) {
    if (isDaemon) {
      ns.print(msg);
      if (toast !== null) ns.toast(msg, toast);
    } else {
      ns.tprint(msg);
    }
  };
}

export function createErrorLogger(ns, { isDaemon = false } = {}) {
  return function logError(msg, { alert = false } = {}) {
    if (isDaemon) {
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
