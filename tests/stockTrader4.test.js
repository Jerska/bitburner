export { name, slug, solve } from '../solvers/stockTrader4.js';
export const cases = [
  {
    name: 'empty',
    input: [1, []],
    expected: 0,
  },
  {
    name: 'no-operation',
    input: [0, [1, 2]],
    expected: 0,
  },
  {
    name: 'one-operation-benefit',
    input: [1, [2, 4]],
    expected: 2,
  },
  {
    name: 'one-operation-no-benefit',
    input: [1, [4, 2]],
    expected: 0,
  },
  {
    name: 'one-operation-multiple-choices',
    input: [1, [2, 3, 4]],
    expected: 2,
  },
  {
    name: 'two-operations-only-one-available',
    input: [2, [4, 2, 4, 2]],
    expected: 2,
  },
  {
    name: 'two-operations-two-sequential',
    input: [2, [2, 5, 2, 4]],
    expected: 5,
  },
  {
    name: 'two-operations-two-interlocked',
    input: [2, [2, 4, 2, 5]],
    expected: 5,
  },
  {
    name: 'three-operations-all-sequential',
    input: [3, [1, 7, 2, 6, 3, 5]],
    expected: 12,
  },
  {
    name: 'three-operations-all-interlocked',
    input: [3, [1, 6, 3, 5, 2, 7]],
    expected: 12,
  },
  {
    name: 'inf-operations-complex',
    input: [Infinity, [71,81,198,102,196,163,165,111,25,187,35,50,49,175,189,131,53,167,76,58,81,145]],
    expected: 741,
  },
];
