/**
 * Description: crack handles cracking machines.
 *
 * Options:
 *   -d     Daemon mode: automatically cracks new machines every minute.
 */
const USAGE = 'crack [-d]';

import { parseArgs } from './utils.args.js';
import { getServersMap } from './utils.servers.js';
import { createRunner } from './utils.runner.js';

const DAEMON_RUN_EVERY = 60 * 1000;

export async function main(ns) {
  ns.disableLog('ALL');

  const { opts } = parseArgs(ns, { maxArgs: 0, USAGE });
  const isDaemon = opts.d;

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log }) => {
    const canCrackSSH = ns.fileExists('BruteSSH.exe');
    const canCrackFTP = ns.fileExists('FTPCrack.exe');
    const canCrackHTTP = ns.fileExists('HTTPWorm.exe');
    const canCrackSQL = ns.fileExists('SQLInject.exe');
    const canCrackSMTP = ns.fileExists('relaySMTP.exe');
    const numPortsOpened = canCrackSSH + canCrackFTP + canCrackHTTP + canCrackSQL + canCrackSMTP;

    for (const [host, server] of Object.entries(getServersMap(ns, { withoutHome: true }))) {
      if (server.purchasedByPlayer) continue;

      if (canCrackSSH && !server.sshPortOpen) {
        ns.brutessh(host);
        log(`* ${host}: SSH opened`);
      }
      if (canCrackFTP && !server.ftpPortOpen) {
        ns.ftpcrack(host);
        log(`* ${host}: FTP opened`);
      }
      if (canCrackHTTP && !server.httpPortOpen) {
        ns.httpworm(host);
        log(`* ${host}: HTTP opened`);
      }
      if (canCrackSQL && !server.sqlPortOpen) {
        ns.sqlinject(host);
        log(`* ${host}: SQL opened`);
      }
      if (canCrackSMTP && !server.smtpPortOpen) {
        ns.relaysmtp(host);
        log(`* ${host}: SMTP opened`);
      }

      if (!server.hasAdminRights && numPortsOpened >= server.numOpenPortsRequired) {
        ns.nuke(host);
        log(`* ${host}: NUKEd: got root access`);
      }

      await ns.asleep(1); // Wait to avoid getting stuck
    }
  });
}
