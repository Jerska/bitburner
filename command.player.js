/**
 * Description: player gives player information.
 */
const USAGE = 'player';

import { parseArgs } from './utils.args.js';
import { readData } from './utils.data.js';
import { createRunner } from './utils.runner.js';

export async function main(ns) {
  ns.disableLog('ALL');

  parseArgs(ns, { minArgs: 0, maxArgs: 0, USAGE });

  const runner = createRunner(ns, false);
  await runner(async ({ log, logError }) => {
    const player = readData(ns, 'player');
    if (!player) {
      logError(`Couldn't read player data`);
      return;
    }
    log(JSON.stringify(player, null, 2));
  });
}
