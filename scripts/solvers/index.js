import * as arrayJump from './arrayJump.js';
import * as ipAddresses from './ipAddresses.js';
import * as largestPrime from './largestPrime.js';
import * as mergeIntervals from './mergeIntervals.js';
import * as minPathSumTriangle from './minPathSumTriangle.js';
import * as sanitizeParentheses from './sanitizeParentheses.js';
import * as spiralizeMatrix from './spiralizeMatrix.js';
import * as stockTrader1 from './stockTrader1.js';
import * as stockTrader2 from './stockTrader2.js';
import * as stockTrader3 from './stockTrader3.js';
import * as stockTrader4 from './stockTrader4.js';
import * as subArrayMaxSum from './subArrayMaxSum.js';
import * as uniquePathsGrid1 from './uniquePathsGrid1.js';
import * as uniquePathsGrid2 from './uniquePathsGrid2.js';
import * as validMathExpressions from './validMathExpressions.js';
import * as waysToSum from './waysToSum.js';

export function getSolverFilename(slug) {
  return `${slug}.js`;
}

export function getSolverPath(slug) {
  return `scripts/solvers/${getSolverFilename(slug)}`;
}

export const solvers = [
  arrayJump,
  ipAddresses,
  largestPrime,
  mergeIntervals,
  minPathSumTriangle,
  sanitizeParentheses,
  spiralizeMatrix,
  stockTrader1,
  stockTrader2,
  stockTrader3,
  stockTrader4,
  subArrayMaxSum,
  uniquePathsGrid1,
  uniquePathsGrid2,
  validMathExpressions,
  waysToSum,
];
