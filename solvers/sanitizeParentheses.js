export const name = 'Sanitize Parentheses in Expression';
export const slug = 'sanitizeParentheses';

function findAll(input, pos = 0, curr = "", currentAmount = 0) {
  if (currentAmount < 0) return [];
  if (pos === input.length) {
    if (currentAmount !== 0) return [];
    return [curr];
  }
  let newAmount = currentAmount;
  if (input[pos] === '(') ++newAmount;
  if (input[pos] === ')') --newAmount;
  return [
    ...findAll(input, pos + 1, curr + input[pos], newAmount),
    ...(input[pos] === '(' ? findAll(input, pos + 1, curr, currentAmount) : []),
    ...(input[pos] === ')' ? findAll(input, pos + 1, curr, currentAmount) : []),
  ]
}

export function solve(input) {
  const all = findAll(input);
  const maxLen = Math.max(...all.map(e => e.length));
  const res = all
    .filter(e => e.length === maxLen) // Keep longest strings
    .filter((e, i, arr) => arr.indexOf(e) === i); // Keep unique
  return res;
}

export function textSolve(lines) {
  const input = lines[2].trim();
  const res = solve(input);
  return res.join(',');
}

