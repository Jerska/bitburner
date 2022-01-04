/**
 * Description: ka kills all hacking scripts on all servers.
 */
const USAGE = 'ka';

import { parseArgs } from './utils.args.js';
import { createRunner } from './utils.runner.js';
import { getServersMap } from './utils.servers.js';

const SCRIPTS = ['script.hack.js', 'script.grow.js', 'script.weaken.js'];

export async function main(ns) {
  ns.disableLog('ALL');

  parseArgs(ns, { maxArgs: 0, USAGE });

  const runner = createRunner(ns, false);
  await runner(async ({ log }) => {
    for (const host of getHosts(ns)) {
      let nbKilled = 0;
      let nbThreadsKilled = 0;
      for (const p of ns.ps(host)) {
        if (!SCRIPTS.includes(p.filename)) continue;
        ns.kill(p.filename, host, ...p.args);
        ++nbKilled;
        nbThreadsKilled += p.threads;
      }
      if (nbKilled > 0) {
        log(`* Killed ${host}: ${nbKilled} (${nbThreadsKilled} threads)`);
      }
    }
  });
}
