/**
 * Description: hn handles hacknet buying machines.
 *
 * Options:
 *   -d     Daemon mode: automatically buys next Hacknet upgrades every second.
 */
const USAGE = 'hn [-d]';

import { parseArgs } from './utils.args.js';
import { readData } from './utils.data.js';
import { createRunner } from './utils.runner.js';

const MAX_LEVEL = 200;
const MAX_RAM = 64;
const MAX_CORES = 16;
const GAIN_PER_LEVEL = 1.5;
const DAEMON_RUN_EVERY = 1000;

function computeProduction(level, ram, cores, mult = 1) {
  const levelMult = level * GAIN_PER_LEVEL;
  const ramMult = Math.pow(1.035, ram - 1);
  const coresMult = (cores + 5) / 6;
  return levelMult * ramMult * coresMult * mult;
}

export async function main(ns) {
  ns.disableLog('ALL');

  const { opts } = parseArgs(ns, { maxArgs: 0, USAGE });
  const isDaemon = opts.d;

  const runner = createRunner(ns, isDaemon, { sleepDuration: DAEMON_RUN_EVERY });
  await runner(async ({ log, logError }) => {
    const player = readData(ns, 'player');
    const moneyToSpend = (player.money * (1 / Math.log2(player.money + 1))) / 50;

    // Buy node
    if (ns.hacknet.getPurchaseNodeCost() <= moneyToSpend) {
      ns.hacknet.purchaseNode();
      log('Bought new node');
      return;
    }

    // Get best operation to do on all nodes
    const potentialOperations = [];
    const addPotential = (idx, type, level, ram, cores, production) => {
      const cost = ns.hacknet[`get${type}UpgradeCost`](idx, 1);
      if (cost > moneyToSpend) return;
      const mul = player.hacknet_node_money_mult;
      const increase = computeProduction(level, ram, cores, mul) - production;
      const time = cost / increase;
      potentialOperations.push({ idx, type, increase, cost, time });
    };
    const count = ns.hacknet.numNodes();
    for (let i = 0; i < count; ++i) {
      const { level, ram, cores, production } = ns.hacknet.getNodeStats(i);
      if (level < MAX_LEVEL) {
        addPotential(i, 'Level', level + 1, ram, cores, production);
      }
      if (ram < MAX_RAM) {
        addPotential(i, 'Ram', level, ram * 2, cores, production);
      }
      if (cores < MAX_CORES) {
        addPotential(i, 'Core', level, ram, cores + 1, production);
      }
    }
    if (potentialOperations.length === 0) {
      log('No potential operation');
      return;
    }
    const operation = potentialOperations.sort((a, b) => a.time - b.time)[0];
    ns.hacknet[`upgrade${operation.type}`](operation.idx, 1);
    const msg1 = `Upgraded ${operation.type} for ${ns.nFormat(operation.cost, '0.0a')}`;
    const msg2 = `extra = ${ns.nFormat(operation.increase, '0.0a')} - time = ${operation.time}s`;
    log(`${msg1} (${msg2})`);
  });
}
