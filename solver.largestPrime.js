export const name = 'Find Largest Prime Factor';
export const slug = 'largestPrime';

function findLargestDivisor(n, currentLargestDivisor) {
  for (let i = currentLargestDivisor; i < n; ++i) {
    if (n % i === 0) {
      return i;
    }
  }
  return n;
}

export function solve(n) {
  if (n < 2) return n;
  let largestDivisor = 2;
  while (n > 1) {
    largestDivisor = findLargestDivisor(n, largestDivisor);
    n = Math.round(n / largestDivisor);
  }
  return largestDivisor;
}

export function textSolve(lines) {
  const nStr = lines[1].replace(/^.*[^0-9]([0-9]+)\?.*$/, '$1');
  const n = parseInt(nStr, 10);
  const res = solve(n);
  return String(res);
}

export const tests = [
  {
    name: 'zero',
    input: 0,
    expected: 0,
  },
  {
    name: 'one',
    input: 1,
    expected: 1,
  },
  {
    name: 'two',
    input: 2,
    expected: 2,
  },
  {
    name: 'larger-than-two',
    input: 7,
    expected: 7,
  },
  {
    name: '2-prime-factors',
    input: 14,
    expected: 7,
  },
  {
    name: '3-prime-factors',
    input: 42,
    expected: 7,
  },
];
