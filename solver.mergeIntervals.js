export const name = 'Merge Overlapping Intervals';
export const slug = 'mergeIntervals';

export function solve(intervals) {
  if (intervals.length === 0) return [];
  const sorted = intervals.sort(([min1], [min2]) => min1 - min2);
  const res = [];
  let [currMin, currMax] = [null, null];
  for (const [min, max] of sorted) {
    if (currMin === null) {
      currMin = min;
      currMax = max;
    }
    if (min > currMax) {
      res.push([currMin, currMax]);
      currMin = min;
      currMax = max;
    }
    if (currMax < max) {
      currMax = max;
    }
  }
  if (currMin !== null) {
    res.push([currMin, currMax]);
  }
  return res;
}

export function textSolve(lines) {
  const parsed = JSON.parse(lines[2]);
  const res = solve(parsed);
  return JSON.stringify(res);
}

export const tests = [
  {
    name: 'empty',
    input: [],
    expected: [],
  },
  {
    name: 'minimal',
    input: [[1, 2]],
    expected: [[1, 2]],
  },
  {
    name: '2-mergeable',
    input: [
      [1, 2],
      [2, 3],
    ],
    expected: [[1, 3]],
  },
  {
    name: '2-non-mergeable',
    input: [
      [1, 2],
      [3, 4],
    ],
    expected: [
      [1, 2],
      [3, 4],
    ],
  },
  {
    name: '3-with-2-mergeable',
    input: [
      [1, 2],
      [5, 6],
      [2, 4],
    ],
    expected: [
      [1, 4],
      [5, 6],
    ],
  },
  {
    name: '4-with-2-pairs',
    input: [
      [1, 3],
      [8, 10],
      [2, 6],
      [10, 16],
    ],
    expected: [
      [1, 6],
      [8, 16],
    ],
  },
];
