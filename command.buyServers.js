/**
 * Description: bs is used to buy new machines.
 *
 * Options:
 *   -d     Daemon mode: automatically buys new machines.
 */
const USAGE = 'bs [-d]';

import { parseArgs } from './utils.args.js';
import { readData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getServersMap } from './utils.servers.js';

const MIN_RAM = 8;
const DAEMON_RUN_EVERY = 1000;
const SLEEP_AFTER_BUY = 4000;

async function purchase(ns, log, ram) {
  const newHost = ns.purchaseServer('bought', ram);
  log(`Added ${newHost} (ram = ${ram})`, { toast: 'info' });
  await ns.asleep(SLEEP_AFTER_BUY);
}

export async function main(ns) {
  ns.disableLog('ALL');

  const { opts } = parseArgs(ns, { maxArgs: 0, USAGE });
  const isDaemon = opts.d;

  const maxRam = ns.getPurchasedServerMaxRam();
  const minRamCost = ns.getPurchasedServerCost(MIN_RAM);
  const maxServers = ns.getPurchasedServerLimit();

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log, logError, stop }) => {
    const { money } = readData(ns, 'player');
    const moneyToSpend = money * (1 / Math.log2(money + 1));
    const purchasedServers = ns.getPurchasedServers();

    if (purchasedServers.length < maxServers) {
      if (minRamCost < moneyToSpend) {
        await purchase(ns, log, MIN_RAM);
      }
      return;
    }

    const serversMap = getServersMap(ns);
    const serverNotFound = purchasedServers.find((host) => !serversMap[host]);
    if (serverNotFound) {
      logError(`Couldn't read server information for ${serverNotFound}.`);
      return;
    }

    const sorted = purchasedServers.sort((a, b) => serversMap[a].maxRam - serversMap[b].maxRam);
    const cheapestHost = sorted[0];
    const cheapestServer = serversMap[cheapestHost];

    let newRam = cheapestServer.maxRam * 2;
    if (newRam > maxRam) {
      ns.toast('Bought most expensive servers', 'info');
      stop();
      return;
    }

    while (newRam < maxRam && ns.getPurchasedServerCost(newRam * 2) <= moneyToSpend) {
      newRam *= 2;
    }
    const newCost = ns.getPurchasedServerCost(newRam);
    if (newCost > moneyToSpend) {
      const minCostStr = ns.nFormat(newCost, '0.0a');
      const moneyToSpendStr = ns.nFormat(moneyToSpend, '0.0a');
      log(`Not enough money to spend to buy a server (${minCostStr} > ${moneyToSpendStr})`);
      return;
    }

    ns.killall(cheapestHost);
    const couldDelete = ns.deleteServer(cheapestHost);
    if (!couldDelete) {
      logError(`Couldn't delete server ${cheapestHost}`);
      return;
    }
    await purchase(ns, log, newRam);
  });
}
