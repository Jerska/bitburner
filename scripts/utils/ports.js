export const NO_PORT_DATA = 'NULL PORT DATA';

export const VERSION_PORT = 1;

export function peekPort(ns, port) {
  return ns.peek(port);
}

export function upsertPort(ns, port, data) {
  const hadData = ns.peek(port) === NO_PORT_DATA;
  ns.write(port, data);
  if (hadData) ns.read(port);
}
