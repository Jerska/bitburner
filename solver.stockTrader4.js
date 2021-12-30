export const name = 'Algorithmic Stock Trader IV';
export const slug = 'stockTrader4';

function createProfitCache(nbOperations, length) {
  return new Array(2)
    .fill(undefined)
    .map(() =>
      new Array(nbOperations)
        .fill(undefined)
        .map(() => new Array(length).fill(undefined).map(() => new Array(length).fill(null)))
    );
}

function getProfitCacheValue(profitCache, mul, nbOperations, start, end) {
  return profitCache[(mul + 1) / 2][nbOperations - 1][start][end];
}

function setProfitCacheValue(profitCache, mul, nbOperations, start, end, val) {
  profitCache[(mul + 1) / 2][nbOperations - 1][start][end] = val;
}

function getMaxGainRec(input, nbOperations, profitCache, start, end, mul) {
  if (nbOperations === 0) return 0;
  if (end <= start) return 0;

  const profitCacheValue = getProfitCacheValue(profitCache, mul, nbOperations, start, end);
  if (profitCacheValue !== null) return profitCacheValue;

  let res = 0;
  for (let i = start; i <= end; ++i) {
    for (let j = i + 1; j <= end; ++j) {
      const currProfit = (input[j] - input[i]) * mul;
      let subProfit = Math.max(
        getMaxGainRec(input, nbOperations - 1, profitCache, i + 1, j - 1, -mul),
        getMaxGainRec(input, nbOperations - 1, profitCache, j + 1, end, mul)
      );
      res = Math.max(res, currProfit + subProfit);
    }
  }

  setProfitCacheValue(profitCache, mul, nbOperations, start, end, res);
  return res;
}

export function getMaxGain(input, nbOperations) {
  nbOperations = Math.min(nbOperations, Math.ceil(input.length));
  const profitCache = createProfitCache(nbOperations, input.length);
  return getMaxGainRec(input, nbOperations, profitCache, 0, input.length - 1, 1);
}

export function solve([nbOperations, input]) {
  const res = getMaxGain(input, nbOperations);
  return res;
}

export function textSolve(lines) {
  const input = lines[2].trim();
  const parsed = JSON.parse(input);
  const res = solve(parsed);
  return res;
}

export const tests = [
  {
    name: 'empty',
    input: [1, []],
    expected: 0,
  },
  {
    name: 'no-operation',
    input: [0, [1, 2]],
    expected: 0,
  },
  {
    name: 'one-operation-benefit',
    input: [1, [2, 4]],
    expected: 2,
  },
  {
    name: 'one-operation-no-benefit',
    input: [1, [4, 2]],
    expected: 0,
  },
  {
    name: 'one-operation-multiple-choices',
    input: [1, [2, 3, 4]],
    expected: 2,
  },
  {
    name: 'two-operations-only-one-available',
    input: [2, [4, 2, 4, 2]],
    expected: 2,
  },
  {
    name: 'two-operations-two-sequential',
    input: [2, [2, 5, 2, 4]],
    expected: 5,
  },
  {
    name: 'two-operations-two-interlocked',
    input: [2, [2, 4, 2, 5]],
    expected: 5,
  },
  {
    name: 'three-operations-all-sequential',
    input: [3, [1, 7, 2, 6, 3, 5]],
    expected: 12,
  },
  {
    name: 'three-operations-all-interlocked',
    input: [3, [1, 6, 3, 5, 2, 7]],
    expected: 12,
  },
  {
    name: 'inf-operations-complex',
    // prettier-ignore
    input: [ Infinity, [ 71, 81, 198, 102, 196, 163, 165, 111, 25, 187, 35, 50, 49, 175, 189, 131, 53, 167, 76, 58, 81, 145 ] ],
    expected: 741,
  },
];
