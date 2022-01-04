import { escapeHTML, wait } from './utils.js';
import { solvers, getSolverPath, getSolverFilename } from '../lib.solvers.js';

const $contractInput = document.querySelector('#contract-input input');
const $loader = document.querySelector('#loader');
const $solutionContainer = document.querySelector('#solution-container');
const $contractName = document.querySelector('#contract-name');
const $error = document.querySelector('#error');
const $errorMessage = document.querySelector('#error-message');
const $errorInfo = document.querySelector('#error-info');
const $solutionValueContainer = document.querySelector('#solution-value-container');
const $solutionValue = document.querySelector('#solution-value');
const $copyMessage = document.querySelector('#copy-message');
const $file = document.querySelector('#file');

function shouldAutoAddToClipboard() {
  const params = new URLSearchParams(window.location.search);
  return params.get('autoAddToClipboard') !== null;
}

async function nextState(value) {
  let state = {};
  const pushState = (newState) => {
    state = { ...state, ...newState };
  };

  const lines = value
    .trim()
    .split('\n')
    .map((l) => l.replace(/ +$/, ''))
    .filter((l) => l !== '');
  pushState({ lines });
  if (lines.length < 1) {
    pushState({
      error: 'Invalid input',
      errorInfo: `You should copy the whole contract, from its title to its last line.`,
    });
    return state;
  }

  const name = lines.shift().trim();

  const solver = solvers.find((c) => c.name === name);
  if (solver === undefined) {
    pushState({
      error: 'Unknown contract',
      errorInfo: `
        ${escapeHTML(JSON.stringify(name))} is not a supported contract.<br />
        Supported contracts:
        <ul>
          ${solvers
            .map(({ name }) => name)
            .sort()
            .map((name) => `<li>${name}</li>`)
            .join('')}
        </ul>
      `,
    });
    return state;
  }

  pushState({ name, slug: solver.slug });

  let result;
  try {
    result = solver.textSolve(lines);
  } catch (e) {
    pushState({ error: e.message, errorInfo: e.stack });
    return state;
  }
  if (result === '') result = '""';
  pushState({ result });

  // Copy to clipboard
  if (result !== undefined && shouldAutoAddToClipboard()) {
    try {
      await navigator.clipboard.writeText(result);
      pushState({ copyMessage: '^ Result copied to clipboard.' });
    } catch (err) {
      pushState({
        copyMessage: '^ Copying to clipboard failed. Check the console for more info.',
      });
      console.error(err);
    }
  }

  return state;
}

async function handleNewInput(value) {
  // Hide container & show loader
  $solutionContainer.style.display = 'none';
  $loader.style.display = 'block';

  await wait(10);

  // Get next state
  const state = await nextState(value);

  // Display info
  $contractName.innerText = state.name;
  $contractName.style.display = state.name ? 'block' : 'none';

  $error.style.display = state.error ? 'block' : 'none';
  $errorMessage.innerText = state.error;
  $errorInfo.innerHTML = state.errorInfo;
  $errorInfo.style.display = state.errorInfo ? 'block' : 'none';

  $solutionValue.innerText = state.result;
  $solutionValueContainer.style.display = state.result !== undefined ? 'block' : 'none';

  $copyMessage.innerText = state.copyMessage;
  $copyMessage.style.display = state.copyMessage ? 'block' : 'none';

  $file.innerText = getSolverFilename(state.slug);
  $file.href = getSolverPath(state.slug);

  await wait(200);

  // Show container and hide loader
  $loader.style.display = 'none';
  $solutionContainer.style.display = 'block';
}

// Bind input
$contractInput.value = '';
$contractInput.addEventListener('change', (e) => {
  val = e.target.value;
  e.target.value = '';
  handleNewInput(val);
});
$contractInput.addEventListener('paste', (e) => {
  e.preventDefault();
  handleNewInput(e.clipboardData.getData('text/plain'));
});

// Expose solvers in window
window.solvers = solvers;
