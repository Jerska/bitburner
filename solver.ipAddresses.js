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

export const tests = [
  {
    name: 'empty',
    input: '',
    expected: [],
  },
  {
    name: 'not-enough',
    input: '123',
    expected: [],
  },
  {
    name: 'barely-enough',
    input: '1234',
    expected: ['1.2.3.4'],
  },
  {
    name: '5-chars-options',
    input: '12345',
    expected: ['12.3.4.5', '1.23.4.5', '1.2.34.5', '1.2.3.45'],
  },
  {
    name: 'with-zero',
    input: '120345',
    expected: ['120.3.4.5', '1.203.4.5', '1.20.34.5', '1.20.3.45'],
  },
];
