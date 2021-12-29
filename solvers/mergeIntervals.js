export const name = 'Merge Overlapping Intervals';
export const slug = 'mergeIntervals';

export function solve(intervals) {
  if (intervals.length === 0) return [];
  const sorted = intervals.sort(([min1, ], [min2, ]) => min1 - min2);
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
