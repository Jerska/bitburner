export const name = 'Unique Paths in a Grid I';
export const slug = 'uniquePathsGrid1';

export function solve([height, width]) {
  const size = width * height;
  if (size === 0) return 0;
  const tmp = new Array(size).fill(0);
  tmp[0] = 1;
  for (let i = 0; i < width; ++i) {
    for (let j = 0; j < height; ++j) {
      if (i > 0) tmp[(i * height) + j] += tmp[((i - 1) * height) + j];
      if (j > 0) tmp[(i * height) + j] += tmp[(i * height) + (j - 1)];
    }
  }
  return tmp[size- 1];
}

export function textSolve(lines) {
  const input = lines.slice(-1)[0].trim();
  const parsed = JSON.parse(input);
  const res = solve(parsed);
  return res;
}
