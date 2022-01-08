/**
 * Description: candidates lists and saves the best candidates servers.
 *   Optionally specify the list of candidates to save.
 *
 * Options:
 *   -d     Daemon mode: automatically refreshes candidates every 10s
 *   -w     Watch mode: like daemon mode, but prints to terminal output
 *   -r			Read-only: do not override the global candidates list.
 */
const USAGE = 'candidates [-d][-r][-w] [<amount>]';

import { parseArgs } from './utils.args.js';
import { readData, upsertData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getServers } from './utils.servers.js';

const DEFAULT_CANDIDATES = 40;
const DAEMON_RUN_EVERY = 10 * 1000;
const WATCH_RUN_EVERY = 1 * 1000;

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { minArgs: 0, maxArgs: 1, USAGE });
  const nbCandidates = args[0] ? parseInt(args[0], 10) : DEFAULT_CANDIDATES;
  const isDaemon = opts.d;
  const isWatchMode = opts.w;
  const readonly = opts.r;

  if (isDaemon && isWatchMode) {
    ns.tprint('-d & -w are incompatible, choose one or the other');
    return;
  }

  const runner = createRunner(ns, isDaemon, {
    daemonPrintTerminal: isWatchMode,
    sleepDuration: isWatchMode ? WATCH_RUN_EVERY : DAEMON_RUN_EVERY,
  });
  await runner(async ({ log }) => {
    const player = readData(ns, 'player');
    let candidates = getServers(ns);
    candidates = candidates.filter((server) => {
      if (server.purchasedByPlayer) return false;
      if (server.requiredHackingSkill > player.hacking) return false;
      if (server.moneyMax < 1) return false;
      if (!server.hasAdminRights) return false;
      return true;
    });
    candidates = candidates.sort((a, b) => {
      const aScore = (a.moneyMax * a.serverGrowth) / a.minDifficulty;
      const bScore = (b.moneyMax * b.serverGrowth) / b.minDifficulty;
      return bScore - aScore;
    });
    candidates = candidates.slice(0, nbCandidates);

    log(`Top ${nbCandidates} hack candidates`);
    for (const server of candidates) {
      const moneyAvailableStr = ns.nFormat(server.moneyAvailable, '0.00a');
      const moneyMaxStr = ns.nFormat(server.moneyMax, '0.00a');
      const moneyPercStr = ns.nFormat((server.moneyAvailable * 100) / server.moneyMax, '0.0');
      const weakenTimeS = ns.nFormat(Math.round(server.weakenTime / 1000), '0.0');
      const hackDiff = Math.round(server.hackDifficulty);
      const hackDiffFromMin = Math.round(server.hackDifficulty - server.minDifficulty);
      const score = (server.moneyMax * server.serverGrowth) / server.minDifficulty;
      const scoreStr = ns.nFormat(score, '0a');
      log(
        '* ' +
          [
            server.hostname,
            `${moneyAvailableStr}/${moneyMaxStr} (${moneyPercStr}%)`,
            [
              `ws: ${weakenTimeS}s`,
              `diff: ${hackDiff}(+${hackDiffFromMin})`,
              `gr: ${server.serverGrowth}`,
              `score: ${scoreStr}`,
            ].join(', '),
          ].join(' - ')
      );
    }

    if (readonly) return;

    await upsertData(
      ns,
      'candidates',
      candidates.map((s) => s.hostname)
    );
  });
}
