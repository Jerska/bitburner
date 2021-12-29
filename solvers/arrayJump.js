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
