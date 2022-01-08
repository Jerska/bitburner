const WAIT_TIME = 10;

export async function main(ns) {
  ns.disableLog('ALL');
  ns.enableLog('weaken');

  const targetHost = ns.args[0];
  const startAt = parseInt(ns.args[1], 10);

  ns.print(`Waiting ${Math.round((startAt - Date.now()) / 1000)}s`);
  while (Date.now() < startAt) {
    await ns.asleep(WAIT_TIME);
  }

  await ns.weaken(targetHost);
}
