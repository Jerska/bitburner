export const name = 'Minimum Path Sum in a Triangle';
export const slug = 'minPathSumTriangle';

export function solve(input, level = 0, id = 0) {
  if (input.length === 0) return 0;
  const val = input[level][id];
  if (level >= input.length - 1) return val;
  return val + Math.min(solve(input, level + 1, id), solve(input, level + 1, id + 1));
}

export function textSolve(lines) {
  const input = lines.slice(2, -8).join('');
  const parsed = JSON.parse(input);
  const res = solve(parsed);
  return res;
}

export const tests = [
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
