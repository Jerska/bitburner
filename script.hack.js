export async function main(ns) {
  const host = ns.args[0];
  const money = await ns.hack(host);
  if (money > 0) {
    ns.toast(`Hack: ${host} +${ns.nFormat(money, '0.0a')}$`, 'success');
  }
}
