export { name, slug, solve } from '../solvers/arrayJump.js';
export const cases = [
  {
    name: 'empty',
    input: [0],
    expected: true,
  },
  {
    name: 'minimal-valid',
    input: [1,0],
    expected: true,
  },
  {
    name: 'minimal-invalid',
    input: [0,1],
    expected: false,
  },
  {
    name: 'three-length-invalid',
    input: [1,0,1],
    expected: false,
  },
  {
    name: 'three-length-valid',
    input: [2,0,0],
    expected: true,
  },
  {
    name: 'longer-than-one-invalid',
    input: [2,0,0,1],
    expected: false,
  },
  {
    name: 'longer-than-one-valid',
    input: [2,0,1,0],
    expected: true,
  },
];
