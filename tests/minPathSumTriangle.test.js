export { name, slug, solve } from '../solvers/minPathSumTriangle.js';
export const cases = [
  {
    name: 'empty',
    input: [],
    expected: 0,
  },
  {
    name: 'minimal',
    input: [[1]],
    expected: 1,
  },
  {
    name: 'two-levels-left',
    input: [[1], [2, 3]],
    expected: 3,
  },
  {
    name: 'two-levels-right',
    input: [[1], [3, 2]],
    expected: 3,
  },
  {
    name: 'three-levels',
    input: [[1], [2, 1], [2, 1, 2]],
    expected: 3,
  },
];
