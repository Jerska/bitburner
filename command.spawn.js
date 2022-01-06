/**
 * Description: spawn handles hacking, growing and weakening machines.
 *
 * Options:
 *   -d     Daemon mode: automatically cracks new machines every 100ms.
 */
const USAGE = 'spawn [-d]';

import { parseArgs } from './utils.args.js';
import { readData, upsertData } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getHosts, getServersMap } from './utils.servers.js';

const BASE_HOST = 'home';
const HOME_KEEP_RAM = 64;

const GROW_SCRIPT = 'script.grow.js';
const HACK_SCRIPT = 'script.hack.js';
const WEAKEN_SCRIPT = 'script.weaken.js';
const UTILS_DATA = 'utils.data.js';
const SCRIPT_RAM_USAGE = 1.8;

const WEAKEN_THREAD_SEC_DECREASE = 0.05;
const GROW_THREAD_SEC_INCREASE = 0.004;
const HACK_THREAD_SEC_INCREASE = 0.002;

const GROWTH_MARGIN_FACTOR = 0.1;

const MARGIN_BETWEEN_ACTIONS = 1000;

const DAEMON_RUN_EVERY = 4 * MARGIN_BETWEEN_ACTIONS;

function computeThreadAllowances(servers, candidates, ramAllowanceFactor) {
  const totalRam = servers.reduce((res, s) => {
    let availableRam = s.maxRam;
    if (s.hostname === BASE_HOST) availableRam -= 64;
    return res + Math.max(availableRam, 0);
  });
  let ramAvailable = totalRam * ramAllowanceFactor;
  const res = {};
  for (const candidate of candidates) {
    const ramAllowed = Math.floor(ramAvailable / 2);
    res[candidate] = Math.floor(ramAllowed / SCRIPT_RAM_USAGE);
    ramAvailable -= ramAllowed;
  }
  return res;
}

async function setupScripts(ns, hosts, { force = false } = {}) {
  for (const host of hosts) {
    if (force || !ns.fileExists(GROW_SCRIPT, host)) {
      await ns.scp(GROW_SCRIPT, BASE_HOST, host);
    }
    if (force || !ns.fileExists(WEAKEN_SCRIPT, host)) {
      await ns.scp(WEAKEN_SCRIPT, BASE_HOST, host);
    }
    if (force || !ns.fileExists(UTILS_DATA, host)) {
      await ns.scp(UTILS_DATA, BASE_HOST, host);
    }
    if (force || !ns.fileExists(HACK_SCRIPT, host)) {
      await ns.scp(HACK_SCRIPT, BASE_HOST, host);
    }
  }
}

class Executor {
  constructor() {
    this.serversMap = {};

    this.hackSortedServers = [];
    this.coresSortedServers = [];

    this.threadAllowances = {};
    this.threadUsed = {};
    this.threadResets = {};

    this.jobId = 0;

    this._initializeServersMap(serversMap);
  }

  configure(serversMap, threadAllowances) {
    // Servers
    for (const [host, s] of Object.entries(serversMap)) {
      if (!s.hasAdminRights || s.ramAvailable < SCRIPT_RAM_USAGE) continue;
      if (!this.serversMap[host]) {
        this.serversMap[host] = {
          hostname: host,
          growThreads: {},
          hackThreads: {},
          weakenThreads: {},
        };
      }
      const server = this.serversMap[host];
      server.cpuCores = s.cpuCores;
      server.maxRam = s.maxRam;
      server.ramAvailable = s.ramAvailable;
      if (server.hostname === BASE_HOST) {
        server.ramAvailable = Math.max(0, server.ramAvailable - HOME_KEEP_RAM);
      }

      server.threadAvailable = Math.floor(server.ramAvailable / SCRIPT_RAM_USAGE);
    }

    // Sorted lists
    this.hackSortedServers = Object.values(this.serversMap).sort((a, b) =>
      a.cpuCores === b.cpuCores ? a.ramAvailable - b.ramAvailable : a.cpuCores - b.cpuCores
    );
    this.coresSortedServers = Object.values(this.serversMap).sort((a, b) =>
      a.cpuCores === b.cpuCores ? a.ramAvailable - b.ramAvailable : b.cpuCores - a.cpuCores
    );

    // Thread allowances
    this.threadAllowances = threadAllowances;
  }

  reset(candidate) {
    for (const server of Object.values(this.serversMap)) {
      server.weakenThreads[candidate] = 0;
      server.growThreads[candidate] = 0;
      server.hackThreads[candidate] = 0;
    }

    let nbResetShifts = 0;
    for (const { time, nbThreads } of this.threadResets[candidate]) {
      if (time > Date.now()) break;
      this.threadUsed[candidate] -= nbThreads;
      if (this.threadUsed[candidate] < 0) {
        ns.alert(`threadUsed[${candidate}] < 0`);
        ns.exit();
      }
      nbResetShifts += 1;
    }
    for (let i = 0; i < nbResetShifts; ++i) {
      this.threadResets[candidate].shift();
    }
  }

  addWeakenThread(host) {
    const server = this._findAvailableServer({ favorCores: true });
    if (!server) return 0;
    const threadAllowed = this.threadAllowances[host] - this.threadUseds[host];
    if (threadAllowed < 1) return 0;
    server.threadAvailable -= 1;
    server.weakenThreads[host] += 1;
    this.threadUseds[host] += 1;
    return server.cpuCores;
  }

  addGrowThread(host) {
    const server = this._findAvailableServer({ favorCores: true });
    if (!server) return 0;
    const threadAllowed = this.threadAllowances[host] - this.threadUseds[host];
    if (threadAllowed < 1) return 0;
    server.threadAvailable -= 1;
    server.growThreads[host] += 1;
    this.threadUseds[host] += 1;
    return server.cpuCores;
  }

  addHackThread(host) {
    const server = this._findAvailableServer({ favorCores: false });
    if (!server) return 0;
    const threadAllowed = this.threadAllowances[host] - this.threadUseds[host];
    if (threadAllowed < 1) return 0;
    server.threadAvailable -= 1;
    server.hackThreads[host] += 1;
    this.threadUseds[host] += 1;
    return 1;
  }

  schedule(host) {
    let totalNbThreads = 0;
    let targetTime = Math.round(Date.now() + ns.getWeakenTime(host));
    for (const [runHost, server] of Object.entries(this.serversMap)) {
      const nbThreads = server.hackThreads[host] ?? 0;
      if (nbThreads === 0) continue;
      totalNbThreads -= nbThreads;
      ns.exec(HACK_SCRIPT, runHost, nbThreads, host, targetTime, `spawn-${++this.jobId}`);
    }

    targetTime += MARGIN_BETWEEN_ACTIONS;
    for (const [runHost, server] of Object.entries(this.serversMap)) {
      const nbThreads = server.growThreads[host] ?? 0;
      if (nbThreads === 0) continue;
      totalNbThreads -= nbThreads;
      ns.exec(GROW_SCRIPT, runHost, nbThreads, host, targetTime, `spawn-${++this.jobId}`);
    }

    targetTime += MARGIN_BETWEEN_ACTIONS;
    for (const [runHost, server] of Object.entries(this.serversMap)) {
      const nbThreads = server.weakenThreads[host] ?? 0;
      if (nbThreads === 0) continue;
      totalNbThreads -= nbThreads;
      ns.exec(WEAKEN_SCRIPT, runHost, nbThreads, host, targetTime, `spawn-${++this.jobId}`);
    }

    targetTime += MARGIN_BETWEEN_ACTIONS;
    this.threadResets[host].push({ time: targetTime, nbThreads: totalNbThreads });
  }

  print(log, host, { verbose = false, toast = false, prefix = '' } = {}) {
    log(`${prefix}${prefix === '' ? '' : ' '}Jobs for ${host}`, opts);
    if (verbose) {
      for (const s of Object.values(this.serversMap)) {
        if (s.growThreads[host] + s.hackThreads[host] + s.weakenThreads[host] === 0) continue;
        // prettier-ignore
        log(`- ${s.hostname}: [w: ${s.weakenThreads[host]}, g: ${s.growThreads[host]}, h: ${s.hackThreads[host]}] on ${s.maxRam}`);
      }
    }
  }

  async saveState() {
    let maxTiming = 0;
    for (const resets of Object.values(this.threadResets)) {
      for (const { time } of resets) {
        maxTiming = Math.max(maxTiming, time);
      }
    }
    await upsertData(ns, 'hackState', { maxTiming });
  }

  _findAvailableServer({ favorCores }) {
    const sorted = favorCores ? this.coresSortedServers : this.hackSortedServers;
    return sorted.find((s) => s.threadAvailable > 0);
  }
}

export async function main(ns) {
  ns.disableLog('ALL');

  const { args, opts } = parseArgs(ns, { minArgs: 0, maxArgs: 2, USAGE });
  const isDaemon = opts.d;

  const targetMoneyRatio = parseFloat(args[0] ?? '0.05');
  const ramAllowanceFactor = parseFloat(args[1] ?? '1.00');

  const executor = new Executor();

  const hosts = getHosts(ns);
  let previousServersLength = hosts.length;
  await setupScripts(ns, hosts, { force: true });

  const { maxTiming: previousMaxTiming = 0 } = readData(ns, 'hackState') ?? {};

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log, logError, stop }) => {
    if (previousMaxTiming > Date.now()) {
      // prettier-ignore
      logError(`Jobs from previous spawn might still be running (maxTiming = ${previousMaxTiming})\nRun \`ka\` first, then re-run spawn`, { alert: true });
      stop();
    }

    const serversMap = getServersMap(ns);
    const servers = Object.values(serversMap);
    const candidates = readData(ns, 'candidates');

    const threadAllowances = computeThreadAllowances(servers, candidates, ramAllowanceFactor);

    if (servers.length !== previousServersLength) {
      previousServersLength = servers.length;
      await setupScripts(ns, getServersMap(ns));
    }

    executor.configure(serversMap, threadAllowances);

    for (const candidate of candidates) {
      const server = serversMap[candidate];

      executor.reset(candidate);

      // First weaken to min and grow the server to max
      if (server.moneyAvailable < (1 - targetMoneyRatio) * server.moneyMax) {
        let secToWeaken = server.hackDifficulty - server.minDifficulty;

        // Weaken to min difficulty
        while (secToWeaken > 0) {
          const nbCores = executor.addWeakenThread(candidate);
          if (nbCores === 0) break;
          secToWeaken -= WEAKEN_THREAD_SEC_DECREASE * nbCores;
        }

        // Grow to 105% (a bit of wiggle room)
        const targetGrowthAmount = (1.05 * server.moneyMax) / (server.moneyAvailable + 1);
        let growThreadsToAdd = Math.ceil(ns.growthAnalyze(candidate, targetGrowthAmount + 0.05));
        while (growThreadsToAdd > 0) {
          if (secToWeaken > 0) {
            const nbCores = executor.addWeakenThread(candidate);
            if (nbCores === 0) break;
            secToWeaken -= WEAKEN_THREAD_SEC_DECREASE * nbCores;
          }
          const nbCores = executor.addGrowThread(candidate);
          if (nbCores === 0) break;
          growThreadsToAdd -= nbCores;
          secToWeaken += GROW_THREAD_SEC_INCREASE * nbCores;
        }

        executor.log(log, candidate, { toast: true, prefix: 'Hack: initializing: ' });
      } else {
        const targetHackAmount = server.moneyMax * targetMoneyRatio;
        const targetGrowthAmount = (1 + GROWTH_MARGIN_FACTOR) / (1 - targetMoneyRatio);
        let hackThreadsToAdd = Math.floor(ns.hackAnalyzeThreads(candidate, targetHackAmount));
        let growThreadsToAdd = Math.ceil(ns.growthAnalyze(candidate, targetGrowthAmount + 0.05));
        const hackSecIncrease = hackThreadsToAdd * HACK_THREAD_SEC_INCREASE;
        const growSecIncrease = growThreadsToAdd * GROW_THREAD_SEC_INCREASE;
        const secIncrease = hackSecIncrease + growSecIncrease;
        let weakenThreadsToAdd = Math.ceil(secIncrease / WEAKEN_THREAD_SEC_DECREASE);
        let stop = false;
        while (weakenThreadsToAdd > 0) {
          const nbCores = executor.addWeakenThread(candidate);
          if (nbCores === 0) {
            stop = true;
            break;
          }
          weakenThreadsToAdd -= nbCores;
        }
        while (!stop && growThreadsToAdd > 0) {
          const nbCores = executor.addGrowThread(candidate);
          if (nbCores === 0) {
            stop = true;
            break;
          }
          growThreadsToAdd -= nbCores;
        }
        while (!stop && hackThreadsToAdd > 0) {
          const couldHack = executor.addHackThread(candidate);
          if (!couldHack) break;
          --hackThreadsToAdd;
        }
      }

      executor.schedule(candidate);
      executor.print(log, candidate);
    }

    await executor.saveState();
  });
}
