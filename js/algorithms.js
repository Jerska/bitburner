import { solvers } from '../solvers/index.js';

const $algorithms = document.querySelector('#algorithms');
const $tests = document.querySelector('#tests');

solvers.sort((a, b) => b.name < a.name).forEach(({ slug, name }) => {
  const $li = document.createElement('li');
  $li.innerText = `${name}: `;
  const $a = document.createElement('a');
  $a.href = `solvers/${slug}.js`;
  $a.innerText = `${slug}.js`;
  $li.appendChild($a);
  $algorithms.appendChild($li);
});
