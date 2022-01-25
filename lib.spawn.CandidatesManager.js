const BASE_HOST = 'home';

const GROW_SCRIPT = 'script.grow.js';
const HACK_SCRIPT = 'script.hack.js';
const WEAKEN_SCRIPT = 'script.weaken.js';
const UTILS_DATA = 'utils.data.js';
const SCRIPT_RAM_USAGE = 1.8;

const MIN_THREADS_RATIO = 0.01;

export class CandidatesManager {
  constructor(debug, ramAllowanceFactor) {
    this.debug = debug;
    this.ramAllowanceFactor = ramAllowanceFactor;

    this.totalThreadsAvailable = 0;
    this.candidates = {};
  }

  async update(ns, candidates, servers) {
    this._computeTotalThreadsAvailable(servers);
    for (const candidate of candidates) {
      if (this.candidates[candidate] === undefined) {
        await this._setupScripts(ns);
      }
      this.candidates[candidate] ??= {};
    }
    this._computeThreadAllowances();
  }

  _computeTotalThreadsAvailable(servers) {
    let res = 0;
    for (const server of Object.values(servers)) {
      let serverAllowedRam = server.maxRam * this.ramAllowanceFactor;
      if (server.hostname === BASE_HOST) {
        serverAllowedRam = Math.max(serverAllowedRam - 64, 0);
      }
      res += Math.floor(serverAllowedRam / SCRIPT_RAM_USAGE);
    }
    this.totalThreadsAvailable = res;
    this.debug.addMain('totalThreadsAvailable', res);
  }

  _computeThreadAllowances() {
    const candidates = Object.keys(this.candidates);

    // Reset thread allowances
    for (const candidate of candidates) {
      this.candidates[candidate].threadsAllowed = 0;
    }

    // Setup
    let nbThreadsRemaining = this.totalThreadsAvailable;
    const addThreads = (candidate, requestedThreads) => {
      const newThreads = Math.min(nbThreadsRemaining, requestedThreads);
      this.candidates[candidate].threadsAllowed += newThreads;
      nbThreadsRemaining -= newThreads;
    };

    // Give MIN_THREADS_PER_CANDIDATE_RATIO to each candidate
    const minNbThreadsCandidate = Math.floor(this.totalThreadsAvailable * MIN_THREADS_RATIO);
    for (const candidate of candidates) {
      addThreads(candidate, minNbThreadsCandidate);
    }

    // Give 1/2 of the remaining threads to the first candidate, then 1/4, 1/8, etc. to the next ones
    for (const candidate of candidates) {
      addThreads(candidate, Math.floor(nbThreadsRemaining / 2));
    }

    // Give remaining threads to the first candidate
    if (nbThreadsRemaining > 0 && candidates.length > 0) {
      addThreads(candidates[0], nbThreadsRemaining);
    }

    // Debug
    for (const candidate of candidates) {
      const { threadsAllowed } = this.candidates[candidate];
      this.debug.addCandidate(candidate, { threadsAllowed });
    }
  }

  async _setupScripts(ns, host) {
    if (!ns.fileExists(GROW_SCRIPT, host)) {
      await ns.scp(GROW_SCRIPT, BASE_HOST, host);
    }
    if (!ns.fileExists(WEAKEN_SCRIPT, host)) {
      await ns.scp(WEAKEN_SCRIPT, BASE_HOST, host);
    }
    if (!ns.fileExists(UTILS_DATA, host)) {
      await ns.scp(UTILS_DATA, BASE_HOST, host);
    }
    if (!ns.fileExists(HACK_SCRIPT, host)) {
      await ns.scp(HACK_SCRIPT, BASE_HOST, host);
    }
  }
}
