/**
 * Description: server reads information about a server.
 */
const USAGE = 'server <serverName>';

import { parseArgs } from './utils.args.js';
import { createRunner } from './utils.runner.js';
import { getServer } from './utils.servers.js';

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { minArgs: 1, maxArgs: 1, USAGE });
  const host = args[0];

  const runner = createRunner(ns, false);
  await runner(async ({ log, logError }) => {
    const server = getServer(ns, host);
    if (!server) {
      logError(`Unknown host ${host}`);
      return;
    }
    log(JSON.stringify(server, null, 2));
  });
}
