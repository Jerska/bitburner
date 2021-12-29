import { getMaxGain } from './stockTrader4.js';

export const name = 'Algorithmic Stock Trader II';
export const slug = 'stockTrader2';

export function solve(input) {
  return getMaxGain(input, Infinity);
}

export function textSolve(lines) {
  const input = lines[2].trim();
  const parsed = JSON.parse(`[${input}]`);
  const res = solve(parsed);
  return res;
}
