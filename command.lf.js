/**
 * Description: lf handles hacknet buying machines.
 *
 * Options:
 *   -d     Daemon mode: automatically buys next Hacknet upgrades every second.
 */
const USAGE = 'lf [<pattern>]';

import { parseArgs } from './utils.args.js';
import { createRunner } from './utils.runner.js';
import { getHosts } from './utils.servers.js';

export async function main(ns) {
  ns.disableLog('ALL');

  const { args } = parseArgs(ns, { maxArgs: 1, USAGE });
  const patterns = args[0] ? args[0].split(',') : [];

  const runner = createRunner(ns, false);
  await runner(async ({ log }) => {
    for (const host of getHosts(ns, { withoutHome: true })) {
      let files = ns.ls(host);
      if (patterns.length > 0) {
        files = files.filter((f) => patterns.some((p) => f.includes(p)));
      }
      if (files.length > 0) {
        log(`Host: ${host}`);
        for (const f of files) {
          log(`* File: ${f}`);
        }
      }
      await ns.asleep(1);
    }
  });
}
