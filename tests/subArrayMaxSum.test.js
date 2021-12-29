export { name, slug, solve } from '../solvers/subArrayMaxSum.js';
export const cases = [
  {
    name: 'empty',
    input: [],
    expected: 0,
  },
  {
    name: 'minimal',
    input: [1],
    expected: 1,
  },
  {
    name: 'minimal-negative',
    input: [-1],
    expected: -1,
  },
  {
    name: '3-summable',
    input: [1, 2, 3],
    expected: 6,
  },
  {
    name: '3-non-summable-mostly-positives',
    input: [1, -2, 3],
    expected: 3,
  },
  {
    name: '3-non-summable-mostly-negatives',
    input: [-1, 2, -3],
    expected: 2,
  },
  {
    name: '4-with-2-summable',
    input: [-1, 2, 3, -4],
    expected: 5,
  },
  {
    name: '4-non-summable',
    input: [1, -2, -3, 4],
    expected: 4,
  },
];
