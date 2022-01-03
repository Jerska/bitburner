/**
 * Description: spawn handles hacking, growing and weakening machines.
 *
 * Options:
 *   -d     Daemon mode: automatically cracks new machines every 100ms.
 */
const USAGE = 'spawn [-d]';

import { parseArgs } from './utils.args.js';
import { readData, upsertData, NO_DATA } from './utils.data.js';
import { createRunner } from './utils.runner.js';
import { getServersMap } from './utils.servers.js';

const DAEMON_RUN_EVERY = 1000;
const MONEY_UP_TARGET = 1;
const MONEY_LOW_TARGET = 0.2;
const NB_HACKS_PER_GROW = 2;
const SCRIPT_RAM = 1.8;

const BASE_HOST = 'home';
const GROW_SCRIPT = 'script.grow.js';
const HACK_SCRIPT = 'script.hack.js';
const WEAKEN_SCRIPT = 'script.weaken.js';

const TARGET_GROWTH_RATE = MONEY_UP_TARGET / MONEY_LOW_TARGET;

async function wait(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
async function setupScripts(serversMap, { force = false } = {}) {
  for (const host of Object.keys(serversMap)) {
    if (force || !ns.fileExists(GROW_SCRIPT, host)) {
      await ns.scp(GROW_SCRIPT, BASE_HOST, host);
    }
    if (force || !ns.fileExists(HACK_SCRIPT, host)) {
      await ns.scp(HACK_SCRIPT, BASE_HOST, host);
    }
    if (force || !ns.fileExists(WEAKEN_SCRIPT, host)) {
      await ns.scp(WEAKEN_SCRIPT, BASE_HOST, host);
    }
  }
}

class ServerAllocator {
  constructor(serversMap) {
    this.serversMap = {};
    this.updateServers(serversMap);

    // Bind methods
    this.updateServers = this.updateServers.bind(this);
    this.addGrowJob = this.addGrowJob.bind(this);
    this.addHackJob = this.addHackJob.bind(this);
    this.addWeakenJob = this.addWeakenJob.bind(this);
    this.reset = this.reset.bind(this);
  }

  updateServers(serversMap) {
    // Add unknown servers to serversMap
    for (const s of Object.values(serversMap)) {
      if (!s.hasAdminRights || s.ramAvailable < SCRIPT_RAM) continue;
      if (!this.serversMap[s.hostname]) {
        this.serversMap[s.hostname] = {
          hostname: s.hostname,
          threadsAvailable: Math.floor(s.ramAvailable / SCRIPT_RAM),
          growJobs: {},
          hackJobs: {},
          weakenJobs: {},
        };
      }
      const server = this.serversMap[s.hostname];
      server.cpuCores = s.cpuCores;
      server.ramAvailable = s.ramAvailable;
      server.threadsAvailable ??= Math.floor(s.ramAvailable / SCRIPT_RAM);
    }

    // Sorted lists
    this.hackSortedServers = Object.values(this.serversMap).sort((a, b) =>
      a.cpuCores === b.cpuCores ? a.ramAvailable - b.ramAvailable : a.cpuCores - b.cpuCores
    );
    this.coresSortedServers = Object.values(this.serversMap).sort((a, b) =>
      a.cpuCores === b.cpuCores ? a.ramAvailable - b.ramAvailable : b.cpuCores - a.cpuCores
    );
  }

  addGrowJob(host) {
    const server = this._findAvailableServer({ favorCores: true });
    if (!server || server.threadsAvailable === 0) return false;
    server.threadsAvailable -= 1;
    server.growJobs[host] += 1;
    return true;
  }

  addHackJob(host) {
    const server = this._findAvailableServer({ favorCores: false });
    if (!server || server.threadsAvailable === 0) return false;
    server.threadsAvailable -= 1;
    server.hackJobs[host] += 1;
    return true;
  }

  addWeakenJob(host) {
    const server = this._findAvailableServer({ favorCores: true });
    if (!server || server.threadsAvailable === 0) return false;
    server.threadsAvailable -= 1;
    server.weakenJobs[host] += 1;
    return true;
  }

  removeHackJob(host) {
    for (const s of this.servers) {
      if (s.hackJobs[host]) {
        s.hackJobs[host] -= 1;
      }
    }
  }

  reset(host) {
    for (const s of Object.values(this.serversMap)) {
      s.growJobs[host] = 0;
      s.hackJobs[host] = 0;
      s.weakenJobs[host] = 0;
    }
  }

  _findAvailableServer({ favorCores }) {
    const sorted = favorCores ? this.coresSortedServers : this.hackSortedServers;
    return sorted.find((s) => s.threadsAvailable > 0);
  }
}

class CandidateManager {
  constructor(allocator, serversMap) {
    this.allocator = allocator;
    this.serversMap = serversMap;

    this.running = {};

    // Bind
    this.run = this.run.bind(this);
  }

  async run(host) {
    if (this.running[host]) return;

    this.running[host] = true;

    const server = this.serversMap[host];
    if (!server) {
      logError(`Couldn't find candidate server ${host}.`);
      return;
    }

    if (availableThreads === 0) {
      log('No available machine to run a new thread');
      return;
    }

    await setupScripts(this.serversMap);

    {
      const optimalGrowThreads = Math.ceil(ns.growthAnalyze(host, TARGET_GROWTH_RATE));
      const moneyTarget = (MONEY_UP_TARGET - MONEY_LOW_TARGET) * server.moneyMax;
      const moneyPerGrowThread = moneyTarget / optimalGrowThreads;
      const moneyPerHackThread = ns.hackAnalyze(host);
      const hackChance = ns.hackAnalyzeChance(host);
      let nbGrowThreads = 1;
      let nbHackThreads = 1;
      let nbWeakenThreads = 1;
      const growSec = () => ns.growthAnalyzeSecurity(nbGrowThreads);
      const hackSec = () => ns.hackAnalyzeSecurity(nbHackThreads);
      const weakenSec = () => ns.weakenAnalyze(nbWeakenThreads);
      while (true) {
        if (growSec() + hackSec() > weakenSec()) {
          if (!allocator.addWeakenJob(host)) break;
          nbWeakenThreads += 1;
        }
        if (moneyPerHackThread * nbHackThreads * hackChance > moneyPerGrowThread * nbGrowThreads) {
          if (!allocator.addGrowJob(host)) break;
          nbGrowThreads += 1;
        }
        if (moneyPerHackThread * nbHackThreads * NB_HACKS_PER_GROW > moneyTarget) break;
        if (!allocator.addHackJob(host)) break;
        nbHackThreads += NB_HACKS_PER_GROW;
      }
    }

    // Weaken
    {
      for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
        const nbWeakenThreads = server.weakenJobs[host] ?? 0;
        if (nbWeakenThreads === 0) continue;
        ns.exec(WEAKEN_SCRIPT, runHost, nbWeakenThreads, host);
      }
    }

    // Grow
    {
      for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
        const nbGrowThreads = server.growJobs[host] ?? 0;
        if (nbGrowThreads === 0) continue;
        ns.exec(GROW_SCRIPT, runHost, nbGrowThreads, host);
      }
    }

    // Hack
    {
      const hackTime = ns.getHackTime(host);

      // Directly
      for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
        const nbHackThreads = server.hackJobs[host] ?? 0;
        if (nbHackThreads === 0) continue;
        ns.exec(HACK_SCRIPT, runHost, nbHackThreads, host);
      }

      // Second round
      setTimeout(() => {
        for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
          const nbHackThreads = server.hackJobs[host] ?? 0;
          if (nbHackThreads === 0) continue;
          ns.exec(HACK_SCRIPT, runHost, nbHackThreads, host);
        }
      }, Math.ceil(hackTime * 1.1));
    }

    setTimeout(() => {
      this.running[host] = false;
      this.allocator.reset(host);
    }, Math.ceil(server.growTime * 1.01));
  }

  async wait() {
    while (Object.values(this.running).some((e) => Boolean(e))) {
      await wait(1);
    }
  }
}

export async function main(ns) {
  ns.disableLog('ALL');

  const { opts } = parseArgs(ns, { maxArgs: 0, USAGE });
  const isDaemon = opts.d;

  const serversMap = getServersMap(ns, { withoutHome: true });
  await setupScripts(serversMap, { force: true });
  const allocator = new ServerAllocator(serversMap);
  const candidateManager = new CandidateManager(allocator, serversMap);

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log, logError }) => {
    const candidates = readData(ns, 'candidates');
    if (candidates === NO_DATA) {
      logError(`Couldn't read candidates data.`);
      return;
    }
    log(`Spawning with ${candidates.length} candidates.`);

    serversMap = getServersMap(ns, { withoutHome: true });
    candidateManager.updateServers(serversMap);

    for (const host of candidates) {
      await candidateManager.run(host);
    }
  });

  await candidateManager.wait();
}
