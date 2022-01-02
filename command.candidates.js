/**
 * Description: candidates lists and saves the best candidates servers.
 *   Optionally specify the list of candidates to save.
 *
 * Options:
 *   -d     Daemon mode: automatically refreshes candidates every 10s
 *   -r			Read-only: do not override the global candidates list.
 */
const USAGE = 'candidates [-d][-r] [<amount>]';

import { parseArgs } from './utils.args.js';
import { readData, upsertData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getServers } from './utils.servers.js';

const DEFAULT_CANDIDATES = 10;
const DAEMON_RUN_EVERY = 10 * 1000;

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { minArgs: 0, maxArgs: 1, USAGE });
  const nbCandidates = args[0] ? parseInt(args[0], 10) : DEFAULT_CANDIDATES;
  const isDaemon = opts.d;
  const readonly = opts.r;

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log, logError }) => {
    const player = readData(ns, 'player');
    let candidates = getServers(ns);
    candidates = candidates.filter((server) => {
      if (!server.purchasedByPlayer) return false;
      if (server.requiredHackingSkill > player.hacking) return false;
      return true;
    });
    candidates = candidates.sort((a, b) => {
      const aScore = (a.moneyMax * a.serverGrowth) / a.minDifficulty;
      const bScore = (b.moneyMax * b.serverGrowth) / b.minDifficulty;
      return bScore - aScore;
    });
    candidates = candidates.slice(0, nbCandidates);

    log('Top Hack candidates');
    for (const server of candidates) {
      const moneyAvailableStr = ns.nFormat(server.moneyAvailable, '0.00a');
      const moneyMaxStr = ns.nFormat(server.moneyMax, '0.00a');
      const moneyPercStr = ns.nFormat((server.moneyAvailable * 100) / server.moneyMax, '0.0');
      log(`* ${server.hostname}`);
      log(`  - money = ${moneyAvailableStr}/${moneyMaxStr} (${moneyPercStr}%)`);
      log(`  - serverGrowth = ${server.serverGrowth}`);
      const hackDiffStr = ns.nFormat(server.hackDifficulty, '0');
      log(`  - minDifficulty = ${server.minDifficulty} (current = ${hackDiffStr})`);
      const score = (server.moneyMax * server.serverGrowth) / server.minDifficulty;
      const scoreStr = ns.nFormat(score, '0a');
      log(`  - score = ${scoreStr}`);
    }

    if (readonly) return;

    await upsertData(
      ns,
      'candidates',
      candidates.map((s) => s.hostname)
    );
  });
}
