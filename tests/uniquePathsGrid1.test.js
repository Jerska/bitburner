export { name, slug, solve } from '../solvers/uniquePathsGrid1.js';
export const cases = [
  {
    name: 'empty',
    input: [0, 0],
    expected: 0,
  },
  {
    name: 'cell',
    input: [1, 1],
    expected: 1,
  },
  {
    name: 'column',
    input: [1, 2],
    expected: 1,
  },
  {
    name: 'row',
    input: [2, 1],
    expected: 1,
  },
  {
    name: '2-width-square',
    input: [2, 2],
    expected: 2,
  },
  {
    name: '3-width-square',
    input: [3, 3],
    expected: 6,
  },
  {
    name: '4x3-rectangle',
    input: [4, 3],
    expected: 10,
  },
];
