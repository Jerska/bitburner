/**
 * Description: contracts looks for contracts and solves them.
 *
 * Options:
 *   -d     Daemon mode: automatically pulls every 10 seconds
 */
const USAGE = 'contracts [-d]';

import { parseArgs } from './utils.args.js';
import { createRunner } from './utils.runner.js';
import { getServers } from './utils.servers.js';
import { solvers } from './solvers.js';

const DAEMON_RUN_EVERY = 10 * 1000;
const CONTRACT_SUFFIX = '.cct';

export async function main(ns) {
  ns.disableLog('ALL');

  const { opts } = parseArgs(ns, { maxArgs: 0, USAGE });
  const isDaemon = opts.d;

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log, logError, stop }) => {
    let contract = null;
    let host = null;

    for (const server of getServers(ns)) {
      const contracts = ns.ls(server.hostname, CONTRACT_SUFFIX);
      if (contracts.length === 0) continue;
      contract = contracts[0];
      host = server.hostname;
    }

    if (contract === null) {
      log('No contract to solve');
      return;
    }

    const name = ns.codingcontract.getContractType(contract, host);
    const input = ns.codingcontract.getData(contract, host);
    const solver = solvers.find((s) => s.name === name);

    if (!solver) {
      logError(`Couldn't find solver for ${JSON.stringify(name)}`);
      return;
    }

    let res = solver.solve(input); // Not catching errors to make sure it stops executing
    if (Array.isArray(res)) {
      res = res.length === 0 ? '""' : res.join(',');
    }

    const reward = ns.codingcontract.attempt(res, contract, host, { returnReward: true });
    if (reward === '') {
      logError(`Couldn't solve contract ${contract}`, { alert: true });
      stop();
      return;
    }

    log(`Solved ${name} contract\nGot ${reward}`, { toast: true });
  });
}
