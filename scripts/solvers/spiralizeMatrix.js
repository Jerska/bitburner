export const name = 'Spiralize Matrix';
export const slug = 'spiralizeMatrix';

export function solve(input) {
  if (input.length === 0) return [];
  const res = [];
  let minX = 0;
  let maxX = input[0].length - 1;
  let minY = 0;
  let maxY = input.length - 1;
  const shouldStop = () => minX > maxX || minY > maxY;
  while (true) {
    if (shouldStop()) return res;
    for (let x = minX; x <= maxX; ++x) {
      res.push(input[minY][x]);
    }
    minY++;
    if (shouldStop()) return res;
    for (let y = minY; y <= maxY; ++y) {
      res.push(input[y][maxX]);
    }
    maxX--;
    if (shouldStop()) return res;
    for (let x = maxX; x >= minX; --x) {
      res.push(input[maxY][x]);
    }
    maxY--;
    if (shouldStop()) return res;
    for (let y = maxY; y >= minY; --y) {
      res.push(input[y][minX]);
    }
    minX++;
  }
}

export function textSolve(lines) {
  const subLines = lines
    .slice(3, -15)
    .trim()
    .map((l) => l.trim());
  const input = `[${subLines.join(',')}]`;
  const parsed = JSON.parse(input);
  const res = solve(parsed);
  if (res.length === 0) return '';
  return res.join(',');
}

export const tests = [
  {
    name: 'empty',
    input: [],
    expected: [],
  },
  {
    name: '1-row',
    input: [[1, 2, 3]],
    expected: [1, 2, 3],
  },
  {
    name: '1-column',
    input: [[1], [2], [3]],
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
      [1, 2, 3, 4],
      [10, 11, 12, 5],
      [9, 8, 7, 6],
    ],
    expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
];
