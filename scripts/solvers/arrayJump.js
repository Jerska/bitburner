export const name = 'Array Jumping Game';
export const slug = 'arrayJump';

export function solve(input) {
  const target = input.length - 1;
  let maxReachable = 0;
  for (let i = 0; i <= maxReachable && i < input.length; ++i) {
    maxReachable = Math.max(maxReachable, i + input[i]);
  }
  return maxReachable >= target;
}

export function textSolve(lines) {
  const input = lines[2].trim();
  const parsed = JSON.parse(`[${input}]`);
  const res = solve(parsed);
  return res ? '1' : '0';
}

export const tests = [
  {
    name: 'empty',
    input: [0],
    expected: true,
  },
  {
    name: 'minimal-valid',
    input: [1, 0],
    expected: true,
  },
  {
    name: 'minimal-invalid',
    input: [0, 1],
    expected: false,
  },
  {
    name: 'three-length-invalid',
    input: [1, 0, 1],
    expected: false,
  },
  {
    name: 'three-length-valid',
    input: [2, 0, 0],
    expected: true,
  },
  {
    name: 'longer-than-one-invalid',
    input: [2, 0, 0, 1],
    expected: false,
  },
  {
    name: 'longer-than-one-valid',
    input: [2, 0, 1, 0],
    expected: true,
  },
];
