/**
 *  Description: spawn handles hacking, growing and weakening machines.
 *
 * Options:
 *   -d     Daemon mode: automatically runs every second
 */
const USAGE = 'spawn [-d]';

import { CandidatesManager } from './lib.spawn.CandidatesManager.js';
import { Debug } from './lib.spawn.Debug.js';

import { parseArgs } from './utils.args.js';
import { readData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getServersMap } from './utils.servers.js';

const DAEMON_RUN_EVERY = 1000;

const WEAKEN_THREAD_SEC_DECREASE = 0.05;
const GROW_THREAD_SEC_INCREASE = 0.004;
const HACK_THREAD_SEC_INCREASE = 0.002;

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  const isDaemon = opts.d;

  const ramAllowanceFactor = parseFloat(args[0] ?? '1.00');

  const debug = new Debug();
  const candidatesManager = new CandidatesManager(debug, ramAllowanceFactor);

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log, logError }) => {
    const servers = getServersMap(ns);
    const candidates = readData(ns, 'candidates');

    await candidatesManager.update(ns, candidates, servers);

    debug.print(log);
  });
}
