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
