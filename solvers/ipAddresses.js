export const name = 'Generate IP Addresses';
export const slug = 'ipAddresses';

export function solve(input, res = [], stack = [], current = 0, leadingZero = false) {
  if (input.length === 0) {
    if (stack.length !== 3) return res;
    res.push(`${stack.join('.')}.${current}`);
    return res;
  }
  const digit = parseInt(input[0], 10);
  if (!leadingZero) {
    const newCurr = current * 10 + digit;
    if (newCurr <= 255) {
      solve(input.slice(1), res, stack, newCurr, false);
    }
  }
  if (current === 0) return res;
  if (stack.length === 4) return res;
  solve(input.slice(1), res, [...stack, current], digit, digit === 0);
  return res;
}

export function textSolve(lines) {
  const input = lines[2].trim();
  const res = solve(input);
  return res.join('');
}
