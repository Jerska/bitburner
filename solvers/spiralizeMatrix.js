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
  const input = `[${lines.slice(3,-15).trim().map(l => l.trim()).join(',')}]`
  const parsed = JSON.parse(input);
  const res = solve(parsed);
  if (res.length === 0) return "";
  return res.join(',');
}
