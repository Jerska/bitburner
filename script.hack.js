import { readData } from './utils.data.js';

const LOG_RATIO = 0.001;

export async function main(ns) {
  const host = ns.args[0];
  const money = await ns.hack(host);
  const player = readData(ns, 'player');
  if (money > 0 && money > player.money * LOG_RATIO) {
    ns.toast(`Hack: ${host} +${ns.nFormat(money, '0.0a')}$`, 'success');
  }
}
