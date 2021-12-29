import { getMaxGain } from './stockTrader4.js';

export const name = 'Algorithmic Stock Trader I';
export const slug = 'stockTrader1';

export function solve(input) {
  return getMaxGain(input, 1);
}

export function textSolve(lines) {
  const input = lines[2].trim();
  const parsed = JSON.parse(`[${input}]`);
  const res = solve(parsed);
  return res;
}
