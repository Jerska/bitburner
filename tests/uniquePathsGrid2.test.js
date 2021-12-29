export { name, slug, solve } from '../solvers/uniquePathsGrid2.js';
export const cases = [
  {
    name: 'empty',
    input: [],
    expected: 0,
  },
  {
    name: 'empty-row',
    input: [[]],
    expected: 0,
  },
  {
    name: 'cell-accessible',
    input: [[0]],
    expected: 1,
  },
  {
    name: 'cell-inaccessible',
    input: [[1]],
    expected: 0,
  },
  {
    name: '2-width-square-no-obstacle',
    input: [
      [0, 0],
      [0, 0],
    ],
    expected: 2,
  },
  {
    name: '2-width-square-one-obstacle',
    input: [
      [0, 1],
      [0, 0],
    ],
    expected: 1,
  },
  {
    name: '2-width-square-two-obstacles',
    input: [
      [0, 1],
      [1, 0],
    ],
    expected: 0,
  },
  {
    name: '3-width-square-one-obstacle',
    input: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    expected: 2,
  },
];
