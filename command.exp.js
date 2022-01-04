/**
 * Description: exp takes XP by weakening a single server in a loop.
 *   Optionally takes a ratio representing the amount of RAM to take on each server.
 *   Defaults to 0.1 (10%) of total ram.
 *
 * Options:
 *   -d     Daemon mode: automatically buys next Hacknet upgrades every second.
 */
const USAGE = 'weaken [-d] [<ratio>]';

import { parseArgs } from './utils.args.js';
import { readData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getServersMap } from './utils.servers.js';

const BASE_HOST = 'home';
const DAEMON_RUN_EVERY = 1000;
const EXP_SCRIPT = 'script.weaken.js';
const EXP_SCRIPT_RAM = 1.8;

let i = 0;

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  const ratio = parseFloat(args[0] || '0.1');
  const isDaemon = opts.d;

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ firstRun, log, logError }) => {
    // Find target server
    const candidates = readData(ns, 'candidates');
    if (!candidates || !candidates[0]) {
      logError(`Couldn't find targetHost`);
      return;
    }
    const targetHost = candidates[0];

    for (const [host, server] of Object.entries(getServersMap(ns))) {
      // Make sure script exists
      if (firstRun || !ns.fileExists(host, EXP_SCRIPT)) {
        await ns.scp(EXP_SCRIPT, BASE_HOST, host);
      }

      // Do not replace currently existing script
      const isRunning = ns.ps(host).some((p) => p.filename === EXP_SCRIPT);
      if (isRunning) continue;

      // Run script
      const ram = Math.min(server.ramAvailble, server.maxRam * ratio);
      const nbThreads = Math.floor(ram / EXP_SCRIPT_RAM);
      // ns.exec(EXP_SCRIPT, host, nbThreads, targetHost, `exp-${++i}`);
      log(`Running exp script on ${host} with ${nbThreads}.`);
    }
  });
}
