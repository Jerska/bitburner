/**
 * Description: exp takes XP by weakening a single server in a loop.
 *   Optionally takes a ratio representing the amount of RAM to take on each server.
 *   Defaults to 0.1 (10%) of total ram.
 *
 * Options:
 *   -d     Daemon mode: automatically buys next Hacknet upgrades every second.
 *   -k     Kill mode: kills all running experience scripts.
 */
const USAGE = 'exp [-d][-k] [<ratio>]';

import { parseArgs } from './utils.args.js';
import { readData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getHosts, getServersMap } from './utils.servers.js';

const BASE_HOST = 'home';
const DAEMON_RUN_EVERY = 1000;
const EXP_SCRIPT = 'script.weaken.js';
const EXP_SCRIPT_RAM = 1.8;

let i = 0;

function isExpScript(p) {
  if (p.filename !== EXP_SCRIPT) return false;
  if (p.args.length < 3) return false;
  if (!String(p.args[1]).startsWith('exp-')) return false;
  return true;
}

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  const ratio = parseFloat(args[0] || '0.1');
  const isDaemon = opts.d;
  const kill = opts.k;

  const runningUntil = {};

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ firstRun, log, logError, stop }) => {
    if (firstRun) {
      if (kill && isDaemon) {
        logError(`Can't call exp with both -d and -k set.`, { alert: true });
        stop();
        return;
      }

      // Check existing instances and optionally kill them
      for (const host of getHosts(ns)) {
        const running = ns.ps(host).find((p) => isExpScript(p));
        if (kill) {
          if (Boolean(running)) {
            const success = ns.kill(running.filename, host, ...running.args);
            if (success) {
              log(`* Killed exp script on ${host}`);
            } else {
              logError(`* [Error] Could not kill exp script on ${host}`);
            }
            continue;
          }
        }
        runningUntil[host] = running?.args?.[2] ?? 0;
      }

      if (kill) {
        stop();
        return;
      }
    }

    // Find target server
    const candidates = readData(ns, 'candidates');
    if (!candidates || !candidates[0]) {
      logError(`Couldn't find targetHost`);
      return;
    }
    const targetHost = candidates[0];
    const weakenTime = ns.getWeakenTime(targetHost);

    for (const [host, server] of Object.entries(getServersMap(ns))) {
      if (runningUntil[host] > Date.now()) continue;
      // Make sure script exists
      if (firstRun || !ns.fileExists(EXP_SCRIPT, host)) {
        await ns.scp(EXP_SCRIPT, BASE_HOST, host);
      }

      // Run script
      const ram = Math.min(server.ramAvailable, server.maxRam * ratio);
      const nbThreads = Math.floor(ram / EXP_SCRIPT_RAM);
      if (nbThreads === 0) continue;
      const endAt = Math.ceil(Date.now() + weakenTime);
      runningUntil[host] = endAt;
      ns.exec(EXP_SCRIPT, host, nbThreads, targetHost, `exp-${++i}`, endAt);
      log(`Running exp script on ${host} with ${nbThreads}.`);
    }
  });
}
