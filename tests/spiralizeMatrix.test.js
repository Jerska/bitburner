export { name, slug, solve } from '../solvers/spiralizeMatrix.js';
export const cases = [
  {
    name: 'empty',
    input: [],
    expected: [],
  },
  {
    name: '1-row',
    input: [
      [1, 2, 3]
    ],
    expected: [1, 2, 3],
  },
  {
    name: '1-column',
    input: [
      [1],
      [2],
      [3],
    ],
    expected: [1, 2, 3],
  },
  {
    name: '3-wide-square',
    input: [
      [1, 2, 3],
      [8, 9, 4],
      [7, 6, 5],
    ],
    expected: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    name: '4-wide-3-high-rectangle',
    input: [
      [ 1, 2, 3, 4],
      [10,11,12, 5],
      [ 9, 8, 7, 6],
    ],
    expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
];
