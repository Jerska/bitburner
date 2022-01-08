import { readDataRetry } from './utils.data.js';

const LOG_RATIO = 0.001;
const WAIT_TIME = 10;

export async function main(ns) {
  ns.disableLog('ALL');
  ns.enableLog('hack');

  const targetHost = ns.args[0];
  const startAt = parseInt(ns.args[1], 10);

  ns.print(`Waiting ${Math.round((startAt - Date.now()) / 1000)}s`);
  while (Date.now() < startAt) {
    await ns.asleep(WAIT_TIME);
  }

  const money = await ns.hack(targetHost);

  const player = await readDataRetry(ns, 'player');
  if (money > 0 && money > player.money * LOG_RATIO) {
    ns.toast(`Hack: ${targetHost} +${ns.nFormat(money, '0.0a')}$`, 'success');
  }
}
