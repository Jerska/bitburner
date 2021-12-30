function buildError(message, usage = null) {
  let err = message;
  if (usage !== null) {
    err = `${err}\nUsage:\n${usage}`;
  }
  return new Error(err);
}

function buildNbArgsError(min, max, usage = null) {}

export function parseArgs(ns, { minArgs = 0, maxArgs = null, usage = null }) {
  const opts = {};
  const args = [];
  for (const arg of ns.args) {
    if (arg.startsWith('--') && arg.length > 2) {
      opts[arg.slice(2)] = true;
      continue;
    }
    if (arg.startsWith('-') && arg.length > 1) {
      opts[arg.slice(1)] = true;
      continue;
    }
    if (maxArgs !== null && args.length >= maxArgs) {
      throw buildNbArgsError(minArgs, maxArgs, usage);
    }
    args.push(arg);
  }
  if (args.length < minArgs) {
    throw buildNbArgsError(minArgs, maxArgs, usage);
  }
  return { args, opts };
}
