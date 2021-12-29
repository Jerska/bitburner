export { name, slug, solve } from '../solvers/mergeIntervals.js';
export const cases = [
  {
    name: 'empty',
    input: [],
    expected: [],
  },
  {
    name: 'minimal',
    input: [[1, 2]],
    expected: [[1, 2]],
  },
  {
    name: '2-mergeable',
    input: [[1, 2], [2, 3]],
    expected: [[1, 3]],
  },
  {
    name: '2-non-mergeable',
    input: [[1, 2], [3, 4]],
    expected: [[1, 2], [3, 4]],
  },
  {
    name: '3-with-2-mergeable',
    input: [[1, 2], [5, 6], [2, 4]],
    expected: [[1, 4], [5, 6]],
  },
  {
    name: '4-with-2-pairs',
    input: [[1, 3], [8, 10], [2, 6], [10, 16]],
    expected: [[1, 6], [8, 16]],
  },
];
