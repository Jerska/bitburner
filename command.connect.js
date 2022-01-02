/**
 * Description: co displays a command list to connect to a server.
 */
const USAGE = 'co <serverName>';

import { parseArgs } from './utils.args.js';
import { createRunner } from './utils.runner.js';
import { getServer, getConnectPath } from './utils.servers.js';

export async function main(ns) {
  ns.disableLog('ALL');

  const { args } = parseArgs(ns, { minArgs: 1, maxArgs: 1, USAGE });
  const host = args[0];

  const runner = createRunner(ns, false);
  await runner(async ({ log }) => {
    const server = getServer(ns, host);
    const cmds = getConnectPath(server).map((h) => `connect ${h}`);
    log('\n' + cmds.join('; '));
  });
}
