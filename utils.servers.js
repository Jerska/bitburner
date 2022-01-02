import { readData } from './utils.data.js';

const BASE_HOST = 'home';

export function getServer(ns, server) {
  return getServersMap(ns, { withoutHome })[server];
}

export function getHosts(ns, { withoutHome }) {
  return Object.keys(getServersMap(ns, { withoutHome }));
}

export function getServers(ns, { withoutHome = false } = {}) {
  return Object.values(getServersMap(ns, { withoutHome }));
}

export function getServersMap(ns, { withoutHome = false } = {}) {
  const res = { ...readData(ns, 'servers') };
  if (withoutHome) delete res[BASE_HOST];
  return res;
}