import { readDataRetry } from './utils.data.js';

const LOG_RATIO = 0.001;

const DURATION_MARGIN = 250; // Amount of ms of delay to allow
const HACKING_LEVEL_MARGIN = 0.04; // Prevent hacking if hacking level grew too much

export async function main(ns) {
  ns.disableLog('ALL');
  ns.enableLog('hack');

  const targetHost = ns.args[0];
  const finishAt = parseInt(ns.args[1], 10);

  const { hacking: initHackingLevel } = await readDataRetry(ns, 'player');

  let estimatedFinishAt = Date.now() + ns.getHackTime(targetHost);
  while (estimatedFinishAt < finishAt) {
    await ns.asleep(50);
    estimatedFinishAt = Date.now() + ns.getHackTime(targetHost);
  }

  const { hacking: currentHackingLevel, money: playerMoney } = await readDataRetry(ns, 'player');
  if (currentHackingLevel >= (1 + HACKING_LEVEL_MARGIN) * initHackingLevel) {
    // prettier-ignore
    ns.toast(`Preventing hack because current hacking level (${currentHackingLevel}) is greater than ${1 + HACKING_LEVEL_MARGIN} * initial hacking level (${initialHackingLevel})`, 'warning');
    return;
  }

  if (estimatedFinishAt > finishAt + DURATION_MARGIN) {
    // prettier-ignore
    ns.print(`Preventing hack because it ran too late: +${estimatedFinishAt - finishAt}ms`);
    return;
  }

  const money = await ns.hack(targetHost);
  if (money > 0 && money > playerMoney * LOG_RATIO) {
    ns.toast(`Hack: ${targetHost} +${ns.nFormat(money, '0.0a')}$`, 'success');
  }
}
