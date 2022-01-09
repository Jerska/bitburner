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

const TRIGGER_RECOVER_FACTOR = 3; // If the money gets ever under 4x hack amount, stop what we're doing and try recovering
const GROWTH_MARGIN_FACTOR = 2;
const WEAKEN_MARGIN_FACTOR = 1.2;

const MIN_THREADS_PER_CANDIDATE_RATIO = 0.01;

const TIMING_MARGIN = 200;
const DAEMON_RUN_EVERY = 1000;

function computeThreadAllowances(servers, candidates, ramAllowanceFactor) {
  // Compute total amount of threads available
  let totalNbThreadsAllowed = 0;
  for (const server of servers) {
    let serverAllowedRam = server.maxRam * ramAllowanceFactor;
    if (server.hostname === BASE_HOST) {
      serverAllowedRam = Math.max(serverAllowedRam - 64, 0);
    }
    totalNbThreadsAllowed += Math.floor(serverAllowedRam / SCRIPT_RAM_USAGE);
  }

  const res = candidates.reduce((res, c) => ({ ...res, [c]: 0 }), {});
  let nbThreadsRemaining = totalNbThreadsAllowed;

  // Give MIN_THREADS_PER_CANDIDATE_RATIO to each candidate
  const minNbThreadsCandidate = Math.floor(totalNbThreadsAllowed, MIN_THREADS_PER_CANDIDATE_RATIO);
  for (const candidate of candidates) {
    res[candidate] += Math.min(nbThreadsRemaining, minNbThreadsCandidate);
    nbThreadsRemaining -= res[candidate];
  }

  // Give 1/2 of the remaining threads to the first candidate, then 1/4, 1/8, etc. to the next ones
  for (const candidate of candidates) {
    res[candidate] += Math.floor(nbThreadsRemaining / 2);
    nbThreadsRemaining -= res[candidate];
  }

  // Give remaining threads to the first candidate
  if (nbThreadsRemaining > 0 && candidates.length > 0) {
    res[candidates[0]] += nbThreadsRemaining;
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

    this.jobId = 0;
  }

  configure(serversMap, threadAllowances) {
    // Servers
    for (const [host, s] of Object.entries(serversMap)) {
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
  }

  allocate(candidate, { weakenThreads = 0, growThreads = 0, hackThreads = 0 }) {
    while (weakenThreads > 0) {
      const nbCores = this._addWeakenThread(candidate);
      if (nbCores === 0) return;
      weakenThreads -= 1; // FIXME: handle cores
    }
    while (growThreads > 0) {
      const nbCores = this._addGrowThread(candidate);
      if (nbCores === 0) return;
      growThreads -= 1; // FIXME: handle cores
    }
    while (hackThreads > 0) {
      const couldHack = this._addHackThread(candidate);
      if (!couldHack) return;
      --hackThreads;
    }
  }

  schedule(ns, candidate, weakenTime) {
    let totalNbThreads = 0;
    const stepTime = Math.floor(weakenTime / 4);
    const growStart = Date.now() + stepTime - TIMING_MARGIN;
    const hackStart = Date.now() + 3 * stepTime - 2 * TIMING_MARGIN;

    for (const [runHost, server] of Object.entries(this.serversMap)) {
      const nbThreads = server.hackThreads[candidate] ?? 0;
      if (nbThreads === 0) continue;
      totalNbThreads += nbThreads;
      ns.exec(HACK_SCRIPT, runHost, nbThreads, candidate, hackStart, `spawn-${++this.jobId}`);
    }

    for (const [runHost, server] of Object.entries(this.serversMap)) {
      const nbThreads = server.growThreads[candidate] ?? 0;
      if (nbThreads === 0) continue;
      totalNbThreads += nbThreads;
      ns.exec(GROW_SCRIPT, runHost, nbThreads, candidate, growStart, `spawn-${++this.jobId}`);
    }

    for (const [runHost, server] of Object.entries(this.serversMap)) {
      const nbThreads = server.weakenThreads[candidate] ?? 0;
      if (nbThreads === 0) continue;
      totalNbThreads += nbThreads;
      ns.exec(WEAKEN_SCRIPT, runHost, nbThreads, candidate, Date.now(), `spawn-${++this.jobId}`);
    }

    return totalNbThreads;
  }

  print(ns, log, host, { verbose = false, toast = null, prefix = '' } = {}) {
    const duration = Math.round(ns.getWeakenTime(host) / 1000);
    const detailed = [];
    let weakenThreads = 0;
    let growThreads = 0;
    let hackThreads = 0;
    for (const s of Object.values(this.serversMap)) {
      if (s.growThreads[host] + s.hackThreads[host] + s.weakenThreads[host] === 0) continue;
      // prettier-ignore
      detailed.push(`- ${s.hostname}: [w: ${s.weakenThreads[host]}, g: ${s.growThreads[host]}, h: ${s.hackThreads[host]}] on ${s.maxRam}GB`);
      weakenThreads += s.weakenThreads[host];
      growThreads += s.growThreads[host];
      hackThreads += s.hackThreads[host];
    }

    // prettier-ignore
    log(`${prefix}${prefix === '' ? '' : ' '}Jobs for ${host} [w: ${weakenThreads}, g: ${growThreads}, h: ${hackThreads}] in ${duration}s`, { toast });
    if (verbose) {
      for (const row of detailed) {
        log(row);
      }
    }
  }

  _addWeakenThread(candidate) {
    const server = this._findAvailableServer({ favorCores: true });
    if (!server) return 0;
    const threadAllowed = this.threadAllowances[candidate] - this.threadUsed[candidate];
    if (threadAllowed < 1) return 0;
    server.threadAvailable -= 1;
    server.weakenThreads[candidate] += 1;
    this.threadUsed[candidate] += 1;
    return server.cpuCores;
  }

  _addGrowThread(candidate) {
    const server = this._findAvailableServer({ favorCores: true });
    if (!server) return 0;
    const threadAllowed = this.threadAllowances[candidate] - this.threadUsed[candidate];
    if (threadAllowed < 1) return 0;
    server.threadAvailable -= 1;
    server.growThreads[candidate] += 1;
    this.threadUsed[candidate] += 1;
    return server.cpuCores;
  }

  _addHackThread(candidate) {
    const server = this._findAvailableServer({ favorCores: false });
    if (!server) return 0;
    const threadAllowed = this.threadAllowances[candidate] - this.threadUsed[candidate];
    if (threadAllowed < 1) return 0;
    server.threadAvailable -= 1;
    server.hackThreads[candidate] += 1;
    this.threadUsed[candidate] += 1;
    return 1;
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

  const targetMoneyRatio = parseFloat(args[0] ?? '0.20');
  const ramAllowanceFactor = parseFloat(args[1] ?? '1.00');

  const executor = new Executor();

  const hosts = getHosts(ns);
  await setupScripts(ns, hosts, { force: true });

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ firstRun, log, logError, stop }) => {
    let state = readData(ns, 'hackState') ?? {};
    state.waitUntil ??= {};

    const serversMap = getServersMap(ns, { adminOnly: true });
    const servers = Object.values(serversMap);
    const candidates = readData(ns, 'candidates');

    const threadAllowances = computeThreadAllowances(servers, candidates, ramAllowanceFactor);
    executor.configure(serversMap, threadAllowances);
    const minWeakenTimes = {};

    await setupScripts(ns, Object.keys(serversMap));

    for (const candidate of candidates) {
      if (state.waitUntil && (state.waitUntil[candidate] ?? 0) > Date.now()) continue;
      if (threadAllowances[candidate] < 3) continue;

      const server = serversMap[candidate];

      executor.reset(candidate);

      // First weaken to min and grow the server to max
      const recoverThreshold = TRIGGER_RECOVER_FACTOR * targetMoneyRatio * server.moneyMax;
      if (server.moneyAvailable < recoverThreshold) {
        // Grow to 105% (a bit of wiggle room)
        const targetGrowthAmount = (1.05 * server.moneyMax) / (server.moneyAvailable + 1);
        const growThreads = Math.ceil(ns.growthAnalyze(candidate, targetGrowthAmount + 0.05));
        const growSecIncrease = growThreads * GROW_THREAD_SEC_INCREASE;

        // Weaken to min difficulty + enough to cover for grow
        const secToWeaken = server.hackDifficulty - server.minDifficulty + growSecIncrease;
        const weakenThreads = Math.ceil(secToWeaken / WEAKEN_THREAD_SEC_DECREASE);

        const weakenTime = ns.getWeakenTime(candidate);
        minWeakenTimes[candidates] = weakenTime;

        executor.allocate(candidate, { weakenThreads, growThreads });
        executor.print(ns, log, candidate, { toast: 'warning', prefix: 'Hack: recovering:' });
        executor.schedule(ns, candidate, weakenTime);

        state.waitUntil[candidate] = Date.now() + weakenTime + TIMING_MARGIN;
      } else {
        // Compute how to get N% and restore it in 1 weaken duration
        const targetHackAmount = server.moneyMax * targetMoneyRatio;
        const targetGrowthAmount = GROWTH_MARGIN_FACTOR / (1 - targetMoneyRatio);
        const hackThreads = Math.floor(ns.hackAnalyzeThreads(candidate, targetHackAmount));
        const theoricalGrowThreads = Math.ceil(ns.growthAnalyze(candidate, targetGrowthAmount));
        const growThreads = theoricalGrowThreads * GROWTH_MARGIN_FACTOR;
        const hackSecIncrease = hackThreads * HACK_THREAD_SEC_INCREASE;
        const growSecIncrease = growThreads * GROW_THREAD_SEC_INCREASE;
        const secIncrease = hackSecIncrease + growSecIncrease;
        const theoricalWeakenThreads = Math.ceil(secIncrease / WEAKEN_THREAD_SEC_DECREASE);
        const weakenThreads = theoricalWeakenThreads * WEAKEN_MARGIN_FACTOR;

        const currWeakenTime = ns.getWeakenTime(candidate);
        const weakenTime = Math.min(minWeakenTimes[candidate] ?? Infinity, currWeakenTime);
        minWeakenTimes[candidate] = weakenTime;

        const nbThreadsPerBatch = hackThreads + growThreads + weakenThreads;
        const nbTotalThreads = threadAllowances[candidate];
        const maxNbBatches = Math.floor(weakenTime / DAEMON_RUN_EVERY);
        const nbBatches = Math.min(maxNbBatches, Math.floor(nbTotalThreads / nbThreadsPerBatch));
        if (nbBatches === 0) continue;

        const timeUntilNextRun = Math.ceil(weakenTime / nbBatches);

        executor.allocate(candidate, { weakenThreads, growThreads, hackThreads });
        executor.print(ns, log, candidate);
        const nbThreadsAllocated = executor.schedule(ns, candidate, weakenTime);

        // prettier-ignore
        log(`Scheduling batch for ${candidate}: ${nbThreadsAllocated}, next batch in: ${timeUntilNextRun}ms`);

        state.waitUntil[candidate] = Date.now() + timeUntilNextRun;
      }
    }

    await upsertData(ns, 'hackState', state);
  });
}
