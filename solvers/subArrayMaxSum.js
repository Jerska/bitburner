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
