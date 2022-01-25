/**
 * Description: info is used to update and store information.
 *   It supports 2 data types:
 *   * player
 *   * servers
 *
 * Those data types can be provided as a comma-separated list to the command.
 *
 * Options:
 *   -d     Daemon mode: automatically pulls every 500ms
 */
const USAGE = 'info [-d] [<comma-separated-types>]';

import { upsertData } from './utils.data.js';
import { parseArgs } from './utils.args.js';
import { createRunner } from './utils.runner.js';
import { getServersMap } from './utils.servers.js';

const DAEMON_RUN_EVERY = 500;
const DEFAULT_TYPES = ['player', 'servers'];
const BASE_HOST = 'home';

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  let types = args[0]?.split(',') ?? DEFAULT_TYPES;
  const isDaemon = opts.d;

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log }) => {
    if (types.includes('player')) {
      const player = ns.getPlayer();
      await upsertData(ns, 'player', player);
      log('Refreshed player data');
    }

    if (types.includes('servers')) {
      const todo = [{ host: BASE_HOST, path: [] }];
      const servers = {};
      const previousServersMap = getServersMap(ns) ?? {};

      while (todo.length > 0) {
        const { host, path } = todo.shift();
        const prevServer = previousServersMap[host] ?? {};
        const prevMinWeakenTime = prevServer.minWeakenTime ?? 0;
        const prevMinGrowTime = prevServer.minGrowTime ?? 0;
        const prevMinHackTime = prevServer.minHackTime ?? 0;

        // Get server info
        const ramAvailable = baseServer.maxRam - baseServer.ramUsed;
        const baseServer = ns.getServer(host);
        const weakenTime = ns.getWeakenTime(host);
        const minWeakenTime = Math.min(prevMinWeakenTime, weakenTime);
        const growTime = ns.getGrowTime(host);
        const minGrowTime = Math.min(prevMinGrowTime, growTime);
        const hackTime = ns.getHackTime(host);
        const minHackTime = Math.min(prevMinHackTime, hackTime);

        servers[host] = {
          ...baseServer,
          ramAvailable,
          weakenTime,
          minWeakenTime,
          growTime,
          minGrowTime,
          hackTime,
          minHackTime,
          path,
        };

        // Get next servers
        const next = ns.scan(host);
        for (const h of next) {
          if (todo.find(({ host }) => host === h)) continue;
          if (Object.keys(servers).includes(h)) continue;
          todo.push({ host: h, path: [...path, host] });
        }
      }
      await upsertData(ns, 'servers', servers);
      log(`Refreshed servers data (${Object.keys(servers).length} servers)`);
    }
  });
}
