import { wait } from './utils.js';
import { tests } from '../tests/index.js';

const $output = document.querySelector('#output');
const $loader = document.querySelector('#loader');
const $files = document.querySelector('#files');

function showFiles() {
  tests.sort((a, b) => b.name < a.name).forEach(({ slug, name }) => {
    const $li = document.createElement('li');
    $li.innerText = `${name}: `;
    const $a = document.createElement('a');
    $a.href = `solvers/${slug}.js`;
    $a.innerText = `${slug}.js`;
    $li.appendChild($a);
    $files.appendChild($li);
  });
}

function logger(type, ...args) {
  args = args.map(e => {
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e;
    return JSON.stringify(e);
  });
  const $p = document.createElement('p');
  if (type === 'error') {
    $p.classList.add('error-container');
  }
  $p.innerText = args.join(' ');
  $output.appendChild($p);
}

function log(...args) {
  console.log(...args);
  logger('log', ...args);
}

function logError(...args) {
  console.error(...args);
  logger('error', ...args);
}

async function runTests() {
  let passed = 0;
  let total = 0;

  log('Running test suite');

  for (const { name, cases, solve } of tests) {
    log(`* Testing: ${name}`)
    await wait(1);

    let cases_passed = 0;
    const cases_total = cases.length;

    let id = 0;
    for (const { name, input, expected } of cases) {
      const displayName = `${name ?? ++id}`;
      let result;

      try {
        result = solve(input);
      } catch (e) {
        logError(`  ${displayName}`)
        logError(e);
        continue;
      }

      if (result === expected) {
        cases_passed += 1;
      } else if (Array.isArray(result) && JSON.stringify(result) === JSON.stringify(expected)) {
        cases_passed += 1;
      } else {
        logError(`  ${displayName}`)
        logError('  Error');
        logError('  - input:    ', input);
        logError('  - result:   ', result);
        logError('  - expected: ', expected);
      }
    }

    log(`* Tested:  ${name}: ${cases_passed}/${cases_total}`);
    passed += cases_passed;
    total += cases_total;
  }

  log(`Test suite complete: ${passed}/${total}`);
  $loader.style.display = 'none';
}

runTests();
showFiles();
