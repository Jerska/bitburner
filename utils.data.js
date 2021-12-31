/**
 * Data storage helpers.
 * It uses a mix of ports & files to share data for free accross all machines.
 * Data is primarily written to a port for consumption by other machines.
 * It is also persisted to disk to allow feeding back the port if necessary.
 */
export const NO_DATA = undefined;

const DATA_TYPES = ['version', 'player', 'servers'];

const NO_FILE_DATA = '';
const NO_PORT_DATA = 'NULL PORT DATA';
const MAX_PORTS = 20;

function getFile(type) {
  return `data.${type}.txt`;
}

function getPort(type) {
  const res = DATA_TYPES.indexOf(type) + 1;
  if (res === 0) {
    throw new Error(`Unknown data type: ${JSON.stringify(type)}`);
  }
  if (res > MAX_PORTS) {
    throw new Error(`Too many ports used: ${JSON.stringify(type)}`);
  }
  return res;
}

export function readData(ns, type) {
  if (!DATA_TYPES.includes(type)) throw new Error(`readData: unknown type ${type}`);

  // Get data from port
  let portData = ns.peek(getPort(type));
  if (portData !== NO_PORT_DATA) return JSON.parse(portData);

  // Fallback: get data from file
  const file = getFile(type);
  const fileBody = ns.read(file);
  if (fileBody !== NO_FILE_DATA) return JSON.parse(fileBody);

  // Nothing
  return NO_DATA;
}

export async function upsertData(ns, type, data) {
  if (!DATA_TYPES.includes(type)) throw new Error(`readData: unknown type ${type}`);

  const port = getPort(type);
  const hadData = ns.peek(port) !== NO_PORT_DATA;
  const body = JSON.stringify(data);

  // Write to port
  await ns.writePort(port, body);

  // Pop from port if it had data before
  if (hadData) {
    ns.readPort(port);
  }

  // Persist to disk
  await ns.write(getFile(type), body, 'w');
}
