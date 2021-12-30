export { name, slug, solve } from '../solvers/ipAddresses.js';
export const cases = [
  {
    name: 'empty',
    input: '',
    expected: [],
  },
  {
    name: 'not-enough',
    input: '123',
    expected: [],
  },
  {
    name: 'barely-enough',
    input: '1234',
    expected: ['1.2.3.4'],
  },
  {
    name: '5-chars-options',
    input: '12345',
    expected: ['12.3.4.5', '1.23.4.5', '1.2.34.5', '1.2.3.45'],
  },
  {
    name: 'with-zero',
    input: '120345',
    expected: ['120.3.4.5', '1.203.4.5', '1.20.34.5', '1.20.3.45'],
  },
];
