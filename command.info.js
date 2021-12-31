/**
 * Description: info is used to update and store information.
 *   It supports 2 data types:
 *   * player
 *   * servers
 *
 * Those data types can be provided as a comma-separated list to the command.
 *
 * Options:
 *   -d     Daemon mode: automatically pulls every 100ms
 */
const USAGE = 'info [-d] [<comma-separated-types>]';

import { upsertData } from './utils.data.js';
import { parseArgs } from './utils.args.js';
import { createDaemonRunner } from './utils.daemon.js';

const DAEMON_RUN_EVERY = 100;
const DEFAULT_TYPES = ['player', 'servers'];
const BASE_HOST = 'home';

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { maxArgs: 1, USAGE });
  let types = args[0] ?? DEFAULT_TYPES;
  const isDaemon = opts.d;

  const runner = createDaemonRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async (log, logError) => {
    if (types.includes('player')) {
      const player = ns.getPlayer();
      await upsertData(ns, 'player', player);
    }

    if (types.includes('servers')) {
      const todo = [{ host: BASE_HOST, path: [] }];
      const servers = {};

      while (todo.length > 0) {
        const { host, path } = todo.shift();

        // Get server info
        const server = {
          ...ns.getServer(host),
          hackTime: ns.getHackTime(host),
          growTime: ns.getGrowTime(host),
          weakenTime: ns.getWeakenTime(host),
          path: path,
        };
        servers[host] = server;

        // Get next servers
        const next = ns.scan(host);
        for (const h of next) {
          if (todo.find(({ host }) => host === h)) continue;
          if (Object.keys(servers).includes(h)) continue;
          todo.push({ host: h, path: [...path, host] });
        }
      }
      await upsertData(ns, 'servers', servers);
    }
  });
}
