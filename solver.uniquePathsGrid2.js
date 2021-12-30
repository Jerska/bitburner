export const name = 'Unique Paths in a Grid II';
export const slug = 'uniquePathsGrid2';

export function solve(grid) {
  if (grid.length === 0) return 0;
  if (grid[0].length === 0) return 0;
  if (grid[0].length === 1) return grid[0].some((v) => v === 1) ? 0 : 1;

  // Copy grid but swap 0 & 1s
  grid = grid.map((row) => row.map((v) => (v === 1 ? 0 : 1)));

  const width = grid[0].length;
  const height = grid.length;

  grid[0][0] = grid[0][0] === 0 ? 0 : 1;
  for (let i = 0; i < height; ++i) {
    for (let j = 0; j < width; ++j) {
      if (grid[i][j] === 0) continue;
      if (i !== 0 || j !== 0) grid[i][j] = 0;
      if (i > 0) grid[i][j] += grid[i - 1][j];
      if (j > 0) grid[i][j] += grid[i][j - 1];
    }
  }

  return grid[height - 1][width - 1];
}

export function textSolve(lines) {
  const subLines = lines.slice(2, -3).map((l) => l.trim().slice(0, -1));
  const parsed = subLines.map((l) => JSON.parse(`[${l}]`));
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
    name: 'empty-row',
    input: [[]],
    expected: 0,
  },
  {
    name: 'cell-accessible',
    input: [[0]],
    expected: 1,
  },
  {
    name: 'cell-inaccessible',
    input: [[1]],
    expected: 0,
  },
  {
    name: '2-width-square-no-obstacle',
    input: [
      [0, 0],
      [0, 0],
    ],
    expected: 2,
  },
  {
    name: '2-width-square-one-obstacle',
    input: [
      [0, 1],
      [0, 0],
    ],
    expected: 1,
  },
  {
    name: '2-width-square-two-obstacles',
    input: [
      [0, 1],
      [1, 0],
    ],
    expected: 0,
  },
  {
    name: '3-width-square-one-obstacle',
    input: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    expected: 2,
  },
];
