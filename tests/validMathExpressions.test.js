export { name, slug, solve } from '../solvers/validMathExpressions.js';
export const cases = [
  {
    name: 'zero',
    input: ['0', 0],
    expected: ['0'],
  },
  {
    name: 'two-zeroes',
    input: ['00', 0],
    expected: ['0*0', '0+0', '0-0'],
  },
  {
    name: 'one',
    input: ['1', 1],
    expected: ['1'],
  },
  {
    name: '1-input-no-solution',
    input: ['1', 2],
    expected: [],
  },
  {
    name: '2-inputs-1-sum-solution',
    input: ['11', 2],
    expected: ['1+1'],
  },
  {
    name: '2-inputs-1-sub-solution',
    input: ['21', 1],
    expected: ['2-1'],
  },
  {
    name: '2-inputs-1-mul-solution',
    input: ['12', 2],
    expected: ['1*2'],
  },
  {
    name: '3-inputs-1-middle-0',
    input: ['101', 1],
    expected: ['1*0+1', '1+0*1', '1-0*1'],
  },
  {
    name: '4-inputs-2-middle-0',
    input: ['1001', 1],
    expected: ['1*0*0+1', '1*0+0+1', '1*0-0+1', '1+0*0*1', '1+0+0*1', '1+0-0*1', '1-0*0*1', '1-0+0*1', '1-0-0*1', '10*0+1'],
  },
  {
    name: '3-inputs-2-solutions',
    input: ['123', 6],
    expected: ['1*2*3', '1+2+3'],
  },
  {
    name: '3-inputs-1-solution',
    input: ['123', 0],
    expected: ['1+2-3'],
  },
  {
    name: '3-inputs-2-solution-middle-0',
    input: ['105', 5],
    expected: ['1*0+5', '10-5'],
  },
];
