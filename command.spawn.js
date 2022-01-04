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
const MAX_HACK_THREADS = 256;
const HOME_KEEP_RAM = 128;

const BASE_HOST = 'home';
const GROW_SCRIPT = 'script.grow.js';
const HACK_SCRIPT = 'script.hack.js';
const WEAKEN_SCRIPT = 'script.weaken.js';
const UTILS_DATA = 'utils.data.js';

let i = 0;

async function wait(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
async function setupScripts(ns, serversMap, { force = false } = {}) {
  for (const host of Object.keys(serversMap)) {
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

class ServerAllocator {
  constructor(serversMap) {
    this.serversMap = {};
    this.updateServers(serversMap);

    // Bind methods
    this.hasThreadsAvailable = this.hasThreadsAvailable.bind(this);
    this.updateServers = this.updateServers.bind(this);
    this.addGrowJob = this.addGrowJob.bind(this);
    this.addHackJob = this.addHackJob.bind(this);
    this.addWeakenJob = this.addWeakenJob.bind(this);
    this.ceil = this.ceil.bind(this);
    this.reset = this.reset.bind(this);
    this.print = this.print.bind(this);
  }

  hasThreadsAvailable() {
    return Object.values(this.serversMap).some((s) => s.threadsAvailable > 0);
  }

  updateServers(serversMap) {
    // Add unknown servers to serversMap
    for (const s of Object.values(serversMap)) {
      if (!s.hasAdminRights || s.ramAvailable < SCRIPT_RAM) continue;
      if (!this.serversMap[s.hostname]) {
        this.serversMap[s.hostname] = {
          hostname: s.hostname,
          growJobs: {},
          hackJobs: {},
          weakenJobs: {},
        };
      }
      const server = this.serversMap[s.hostname];
      server.cpuCores = s.cpuCores;
      server.maxRam = s.maxRam;
      server.ramAvailable = s.ramAvailable;
      if (server.hostname === BASE_HOST) {
        server.ramAvailable = Math.max(0, server.ramAvailable - HOME_KEEP_RAM);
      }

      server.threadsAvailable = Math.floor(server.ramAvailable / SCRIPT_RAM);
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
    if (!server || server.threadsAvailable < 1) return false;
    server.threadsAvailable -= 1 / server.cpuCores;
    server.growJobs[host] += 1 / server.cpuCores;
    return true;
  }

  addHackJob(host) {
    const server = this._findAvailableServer({ favorCores: false });
    if (!server || server.threadsAvailable < 1) return false;
    server.threadsAvailable -= 1;
    server.hackJobs[host] += 1;
    return true;
  }

  addWeakenJob(host) {
    const server = this._findAvailableServer({ favorCores: true });
    if (!server || server.threadsAvailable < 1) return false;
    server.threadsAvailable -= 1 / server.cpuCores;
    server.weakenJobs[host] += 1 / server.cpuCores;
    return true;
  }

  ceil(host) {
    for (const s of Object.values(this.serversMap)) {
      s.growJobs[host] = Math.ceil(s.growJobs[host]);
      s.hackJobs[host] = Math.ceil(s.hackJobs[host]);
      s.weakenJobs[host] = Math.ceil(s.weakenJobs[host]);
    }
  }

  reset(host) {
    for (const s of Object.values(this.serversMap)) {
      s.growJobs[host] = 0;
      s.hackJobs[host] = 0;
      s.weakenJobs[host] = 0;
    }
  }

  print(log, host) {
    log(`* Jobs for ${host}`);
    for (const s of Object.values(this.serversMap)) {
      if (s.growJobs[host] + s.hackJobs[host] + s.weakenJobs[host] === 0) continue;
      log(
        `  - ${s.hostname}: [w: ${s.weakenJobs[host]}, g: ${s.growJobs[host]}, h: ${s.hackJobs[host]}] on ${s.maxRam}`
      );
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

  run(ns, log, logError, host) {
    if (this.running[host]) return;
    this.running[host] = true;

    this.allocator.reset(host);

    const server = this.serversMap[host];
    if (!server) {
      logError(`Couldn't find candidate server ${host}.`);
      this.running[host] = false;
      return;
    }

    if (!this.allocator.hasThreadsAvailable()) {
      log(`No available machine to run a new thread for ${host}`);
      this.running[host] = false;
      return;
    }

    let nbTotalGrowThreads = 0;
    let nbTotalHackThreads = 0;
    let nbTotalWeakenThreads = 0;

    {
      // Weaken to minimum
      let nbWeakenThreads = 0;
      const weakenMinimum = server.hackDifficulty - server.minDifficulty;
      while (true) {
        const weakenSec = ns.weakenAnalyze(nbWeakenThreads);
        if (weakenSec >= weakenMinimum) break;
        if (!this.allocator.addWeakenJob(host)) break;
        nbWeakenThreads += 1;
      }
      nbTotalWeakenThreads += nbWeakenThreads;
    }

    // Grow to max target
    {
      let nbWeakenThreads = 0;
      let nbGrowThreads = 0;
      const targetMoney = server.moneyMax * MONEY_UP_TARGET;
      const targetGrowRatio = Math.max(targetMoney / (server.moneyAvailable + 1), 1);
      const targetGrowThreads = ns.growthAnalyze(host, targetGrowRatio);
      while (true) {
        const growSec = ns.growthAnalyzeSecurity(nbGrowThreads);
        const weakenSec = ns.weakenAnalyze(nbWeakenThreads);
        if (growSec > weakenSec) {
          if (!this.allocator.addWeakenJob(host)) break;
          nbWeakenThreads += 1;
        }
        if (nbGrowThreads >= targetGrowThreads) break;
        if (!this.allocator.addGrowJob(host)) break;
        nbGrowThreads += 1;
      }
      nbTotalWeakenThreads += nbWeakenThreads;
      nbTotalGrowThreads += nbGrowThreads;
    }

    // Hack
    {
      let nbWeakenThreads = 0;
      let nbHackThreads = 0;
      const lowTargetMoney = server.moneyMax * MONEY_LOW_TARGET;
      const hackChance = ns.hackAnalyzeChance(host);
      const targetMoney = server.moneyAvailable - lowTargetMoney;
      const targetHackThreads = ns.hackAnalyzeThreads(host, targetMoney) / hackChance;
      while (true) {
        const hackSec = ns.hackAnalyzeSecurity(nbHackThreads);
        const weakenSec = ns.weakenAnalyze(nbWeakenThreads);
        if (hackSec > weakenSec) {
          if (!this.allocator.addWeakenJob(host)) break;
          nbWeakenThreads += 1;
        }
        if (nbHackThreads >= targetHackThreads) break;
        if (!this.allocator.addHackJob(host)) break;
        nbHackThreads += NB_HACKS_PER_GROW;
      }
      nbTotalWeakenThreads += nbWeakenThreads;
      nbTotalHackThreads += nbHackThreads;
    }

    const logValues = `[w: ${nbTotalWeakenThreads}, g: ${nbTotalGrowThreads}, h: ${nbTotalHackThreads}]`;
    const durationS = Math.round(server.weakenTime / 1000);
    log(`Scheduling ${host} with ${logValues} (duration = ${durationS}s)`);
    this.allocator.print(log, host);
    this.allocator.ceil(host);

    // Weaken
    {
      for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
        const nbWeakenThreads = server.weakenJobs[host] ?? 0;
        if (nbWeakenThreads === 0) continue;
        ns.exec(WEAKEN_SCRIPT, runHost, nbWeakenThreads, host, ++i);
      }
    }

    // Grow
    {
      for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
        const nbGrowThreads = server.growJobs[host] ?? 0;
        if (nbGrowThreads === 0) continue;
        ns.exec(GROW_SCRIPT, runHost, nbGrowThreads, host, ++i);
      }
    }

    // Hack
    {
      const hackTime = ns.getHackTime(host);

      // Directly
      for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
        let nbHackThreads = server.hackJobs[host] ?? 0;
        if (nbHackThreads === 0) continue;
        while (nbHackThreads > 0) {
          const nbThreads = Math.min(nbHackThreads, MAX_HACK_THREADS);
          ns.exec(HACK_SCRIPT, runHost, nbThreads, host, ++i);
          nbHackThreads -= nbThreads;
        }
      }

      // Second round
      setTimeout(() => {
        for (const [runHost, server] of Object.entries(this.allocator.serversMap)) {
          let nbHackThreads = server.hackJobs[host] ?? 0;
          if (nbHackThreads === 0) continue;
          while (nbHackThreads > 0) {
            const nbThreads = Math.min(nbHackThreads, MAX_HACK_THREADS);
            ns.exec(HACK_SCRIPT, runHost, nbThreads, host, ++i);
            nbHackThreads -= nbThreads;
          }
        }
      }, Math.ceil(hackTime * 1.1));
    }

    setTimeout(() => {
      this.running[host] = false;
      this.allocator.reset(host);
    }, Math.ceil(server.weakenTime * 1.01));
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

  let serversMap = getServersMap(ns);
  await setupScripts(ns, serversMap, { force: true });
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

    serversMap = getServersMap(ns);
    allocator.updateServers(serversMap);
    await setupScripts(ns, serversMap);

    for (const host of candidates) {
      candidateManager.run(ns, log, logError, host);
    }
  });

  await candidateManager.wait();
}
