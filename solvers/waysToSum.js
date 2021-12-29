export const name = 'Total Ways to Sum';
export const slug = 'waysToSum';

function waysToSum(input, max, cache = {}) {
  if ((cache[input] ?? {})[max]) return cache[input][max];
  if (input === 0) return 1;
  let res = 0;
  for (let i = Math.min(max, input); i >= 1; --i) {
    res += waysToSum(input - i, i, cache);
  }
  cache[input] ??= {};
  cache[input][max] = res;
  return res;
}

export function solve(input) {
  return waysToSum(input, input) - 1;
}

export function textSolve(lines) {
  const input = lines.slice(-1)[0].replace(/^.*can the number ([0-9]+) be written.*$/, '$1');
  const parsed = parseInt(input, 10);
  const res = solve(parsed);
  return res;
}

