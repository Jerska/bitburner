export { name, slug, solve } from '../solvers/largestPrime.js';
export const cases = [
  {
    name: 'zero',
    input: 0,
    expected: 0,
  },
  {
    name: 'one',
    input: 1,
    expected: 1,
  },
  {
    name: 'two',
    input: 2,
    expected: 2,
  },
  {
    name: 'larger-than-two',
    input: 7,
    expected: 7,
  },
  {
    name: '2-prime-factors',
    input: 14,
    expected: 7,
  },
  {
    name: '3-prime-factors',
    input: 42,
    expected: 7,
  },
];
