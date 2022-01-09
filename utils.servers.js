import { readData } from './utils.data.js';

const BASE_HOST = 'home';

export function getServer(ns, server) {
  return getServersMap(ns)[server];
}

export function getHosts(ns, { withoutHome = false, adminOnly = false } = {}) {
  return Object.keys(getServersMap(ns, { withoutHome, adminOnly }));
}

export function getServers(ns, { withoutHome = false, adminOnly = false } = {}) {
  return Object.values(getServersMap(ns, { withoutHome, adminOnly }));
}

export function getServersMap(ns, { withoutHome = false, adminOnly = false } = {}) {
  const res = {};
  for (const [host, server] of readData(ns, 'servers')) {
    if (withoutHome && host === BASE_HOST) continue;
    if (adminOnly && !server.hasAdminRights) continue;
    res[host] = server;
  }
  return res;
}

export function getConnectPath(server) {
  return [...server.path.slice(1), server.hostname];
}
