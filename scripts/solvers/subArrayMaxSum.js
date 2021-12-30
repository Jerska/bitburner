export const name = 'Subarray with Maximum Sum';
export const slug = 'subArraySum';

export function solve(input) {
  if (input.length < 1) return 0;
  let max = -Infinity;
  let curr = 0;
  for (const n of input) {
    curr += n;
    if (curr > max) {
      max = curr;
    }
    if (curr < 0) {
      curr = 0;
    }
  }
  return max;
}

export function textSolve(lines) {
  const parsed = JSON.parse(`[${lines[2].trim()}]`);
  const res = solve(parsed);
  return String(res);
}

export const tests = [
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
