import * as arrayJump from './solver.arrayJump.js';
import * as ipAddresses from './solver.ipAddresses.js';
import * as largestPrime from './solver.largestPrime.js';
import * as mergeIntervals from './solver.mergeIntervals.js';
import * as minPathSumTriangle from './solver.minPathSumTriangle.js';
import * as sanitizeParentheses from './solver.sanitizeParentheses.js';
import * as spiralizeMatrix from './solver.spiralizeMatrix.js';
import * as stockTrader1 from './solver.stockTrader1.js';
import * as stockTrader2 from './solver.stockTrader2.js';
import * as stockTrader3 from './solver.stockTrader3.js';
import * as stockTrader4 from './solver.stockTrader4.js';
import * as subArrayMaxSum from './solver.subArrayMaxSum.js';
import * as uniquePathsGrid1 from './solver.uniquePathsGrid1.js';
import * as uniquePathsGrid2 from './solver.uniquePathsGrid2.js';
import * as validMathExpressions from './solver.validMathExpressions.js';
import * as waysToSum from './solver.waysToSum.js';

export function getSolverFilename(slug) {
  return `${slug}.js`;
}

export function getSolverPath(slug) {
  return `./solver.${getSolverFilename(slug)}`;
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
