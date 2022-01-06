import { readData } from './utils.data.js';

const DURATION_MARGIN = 50; // Amount of ms of delay to allow
const HACKING_LEVEL_MARGIN = 0.04; // Prevent growing if hacking level grew too much

export async function main(ns) {
  const targetHost = ns.args[0];
  const finishAt = parseInt(ns.args[1], 10);

  const { hacking: initHackingLevel } = readData(ns, 'player');

  let estimatedFinishAt = Date.now() + ns.getGrowTime(targetHost);
  while (estimatedFinishAt < finishAt) {
    ns.asleep(10);
    estimatedFinishAt = Date.now() + ns.getGrowTime(targetHost);
  }

  const { hacking: currentHackingLevel } = ns.readData('player');
  if (currentHackingLevel >= (1 + HACKING_LEVEL_MARGIN) * initHackingLevel) {
    // prettier-ignore
    ns.toast(`Preventing grow because current hacking level (${currentHackingLevel}) is greater than ${1 + HACKING_LEVEL_MARGIN} * initial hacking level (${initialHackingLevel})`, 'warning');
    return;
  }

  if (estimatedFinishAt > finishAt + DURATION_MARGIN) {
    // prettier-ignore
    ns.toast(`Preventing grow because it ran too late: +${estimatedFinishAt - finishAt}ms`, 'warning');
    return;
  }

  await ns.grow(targetHost);
}
