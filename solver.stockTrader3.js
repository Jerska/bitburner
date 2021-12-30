import { getMaxGain } from './solver.stockTrader4.js';

export const name = 'Algorithmic Stock Trader III';
export const slug = 'stockTrader3';

export function solve(input) {
  return getMaxGain(input, 2);
}

export function textSolve(lines) {
  const input = lines[2].trim();
  const parsed = JSON.parse(`[${input}]`);
  const res = solve(parsed);
  return res;
}

export const tests = [
  // See stockTrader4.js
];
