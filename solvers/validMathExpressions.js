export const name = 'Find All Valid Math Expressions';
export const slug = 'validMathExpressions';

function solveRec(res, input, target, pos = 0, expr = '', evaluated = 0, mulAcc = 1) {
  if (pos == input.length) {
    if (evaluated === target) {
      res.push(expr);
    }
    return;
  }

  let curr = 0;
  for (let i = pos; i < input.length; ++i) {
    if (i > pos && input[pos] === 0) break;
    curr = curr * 10 + input[i];
    if (expr.length === 0) {
      solveRec(res, input, target, i + 1, `${curr}`, evaluated + curr, curr);
    } else {
      solveRec(res, input, target, i + 1, `${expr}+${curr}`, evaluated + curr, curr);
      solveRec(res, input, target, i + 1, `${expr}-${curr}`, evaluated - curr, -curr);
      solveRec(res, input, target, i + 1, `${expr}*${curr}`, evaluated - mulAcc + mulAcc * curr, mulAcc * curr);
    }
  }
}

export function solve([input, target]) {
  const digits = input.split('').map(d => parseInt(d, 10));
  let res = [];
  solveRec(res, digits, target);
  res = res.sort();
  return res;
}

export function textSolve(lines) {
  const parsed = JSON.parse(`${lines[5].trim()}`);
  const res = solve(parsed);
  return String(res);
}
