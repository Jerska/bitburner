/**
 * Description: lf handles hacknet buying machines.
 *
 * Options:
 *   --rm   Removes files found.
 */
const USAGE = 'lf [--rm] [<patterns>]';

import { parseArgs } from './utils.args.js';
import { createRunner } from './utils.runner.js';
import { getHosts } from './utils.servers.js';

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { USAGE });
  const patterns = args;
  const rm = opts.rm;

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
          let suffix = '';
          if (rm) {
            suffix = ' [removed]';
            const success = ns.rm(f, host);
            if (!success) {
              logError(`Couldn't remove ${f} from ${host}`);
            }
          }
          log(`* File: ${f}${suffix}`);
        }
      }
      await ns.asleep(1);
    }
  });
}
