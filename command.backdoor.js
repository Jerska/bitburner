/**
 * Description: bd displays a command list to connect
 *   to the next server backdoorable and a backdoor command.
 *   Optionally accepts a server name to backdoor a specific server.
 */
const USAGE = 'co [<serverName>]';

import { parseArgs } from './utils.args.js';
import { readData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getServer, getServers } from './utils.servers.js';

function isBackdoorable(server, player) {
  if (server.backdoorInstalled) return false;
  if (server.purchasedByPlayer) return false;
  if (!server.hasAdminRights) return false;
  if (server.requiredHackingSkill > player.hacking) return false;
  return true;
}

export async function main(ns) {
  ns.disableLog('ALL');

  const { args } = parseArgs(ns, { minArgs: 0, maxArgs: 1, USAGE });
  const providedHost = args[0] ?? null;

  const runner = createRunner(ns, false);
  await runner(async ({ log, logError }) => {
    const player = readData(ns, 'player');

    let server;
    if (providedHost) {
      server = getServer(providedHost);
      if (server.backdoorInstalled) {
        logError('Server is already backdoored');
        return;
      }
      if (!isBackdoorable(server, player)) {
        logError('Server is not backdoorable.');
        return;
      }
    } else {
      server = servers.find((s) => isBackdoorable(s, player));
      if (!server) {
        log('No server backdoorable.');
        return;
      }
    }
    const cmds = [...getConnectPath(server).map((h) => `connect ${h}`), 'backdoor'];
    log('\n' + cmds.join('; '));
  });
}
