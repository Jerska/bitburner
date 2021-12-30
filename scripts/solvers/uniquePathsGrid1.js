export const name = 'Unique Paths in a Grid I';
export const slug = 'uniquePathsGrid1';

export function solve([height, width]) {
  const size = width * height;
  if (size === 0) return 0;
  const tmp = new Array(size).fill(0);
  tmp[0] = 1;
  for (let i = 0; i < width; ++i) {
    for (let j = 0; j < height; ++j) {
      if (i > 0) tmp[i * height + j] += tmp[(i - 1) * height + j];
      if (j > 0) tmp[i * height + j] += tmp[i * height + (j - 1)];
    }
  }
  return tmp[size - 1];
}

export function textSolve(lines) {
  const input = lines.slice(-1)[0].trim();
  const parsed = JSON.parse(input);
  const res = solve(parsed);
  return res;
}

export const tests = [
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
