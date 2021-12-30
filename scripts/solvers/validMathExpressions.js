export const name = 'Find All Valid Math Expressions';
export const slug = 'validMathExpressions';

function solveRec(res, input, target, pos = 0, expr = '', evaluated = 0, mul = 1) {
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
    // prettier-ignore
    if (expr.length === 0) {
      solveRec(res, input, target, i + 1, `${curr}`, evaluated + curr, curr);
    } else {
      solveRec(res, input, target, i + 1, `${expr}+${curr}`, evaluated + curr, curr);
      solveRec(res, input, target, i + 1, `${expr}-${curr}`, evaluated - curr, -curr);
      solveRec(res, input, target, i + 1, `${expr}*${curr}`, evaluated - mul + mul * curr, mul * curr);
    }
  }
}

export function solve([input, target]) {
  const digits = input.split('').map((d) => parseInt(d, 10));
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

export const tests = [
  {
    name: 'zero',
    input: ['0', 0],
    expected: ['0'],
  },
  {
    name: 'two-zeroes',
    input: ['00', 0],
    expected: ['0*0', '0+0', '0-0'],
  },
  {
    name: 'one',
    input: ['1', 1],
    expected: ['1'],
  },
  {
    name: '1-input-no-solution',
    input: ['1', 2],
    expected: [],
  },
  {
    name: '2-inputs-1-sum-solution',
    input: ['11', 2],
    expected: ['1+1'],
  },
  {
    name: '2-inputs-1-sub-solution',
    input: ['21', 1],
    expected: ['2-1'],
  },
  {
    name: '2-inputs-1-mul-solution',
    input: ['12', 2],
    expected: ['1*2'],
  },
  {
    name: '3-inputs-1-middle-0',
    input: ['101', 1],
    expected: ['1*0+1', '1+0*1', '1-0*1'],
  },
  {
    name: '4-inputs-2-middle-0',
    input: ['1001', 1],
    expected: [
      '1*0*0+1',
      '1*0+0+1',
      '1*0-0+1',
      '1+0*0*1',
      '1+0+0*1',
      '1+0-0*1',
      '1-0*0*1',
      '1-0+0*1',
      '1-0-0*1',
      '10*0+1',
    ],
  },
  {
    name: '3-inputs-2-solutions',
    input: ['123', 6],
    expected: ['1*2*3', '1+2+3'],
  },
  {
    name: '3-inputs-1-solution',
    input: ['123', 0],
    expected: ['1+2-3'],
  },
  {
    name: '3-inputs-2-solution-middle-0',
    input: ['105', 5],
    expected: ['1*0+5', '10-5'],
  },
];
