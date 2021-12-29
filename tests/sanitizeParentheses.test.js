export { name, slug, solve } from '../solvers/sanitizeParentheses.js';
export const cases = [
  {
    name: 'empty',
    input: '',
    expected: [''],
  },
  {
    name: 'opening-paren',
    input: '(',
    expected: [''],
  },
  {
    name: 'closing-paren',
    input: ')',
    expected: [''],
  },
  {
    name: 'other-char',
    input: 'a',
    expected: ['a'],
  },
  {
    name: 'valid-couple',
    input: '()',
    expected: ['()'],
  },
  {
    name: 'valid-couple-char-before',
    input: 'a()',
    expected: ['a()'],
  },
  {
    name: 'valid-couple-char-inside',
    input: '(a)',
    expected: ['(a)'],
  },
  {
    name: 'valid-couple-char-after',
    input: '()a',
    expected: ['()a'],
  },
  {
    name: 'double-couple',
    input: '(())',
    expected: ['(())'],
  },
  {
    name: 'invalid-double-couple',
    input: '(())(',
    expected: ['(())'],
  },
  {
    name: 'multiple-solutions',
    input: '()())()',
    expected: ['()()()', '(())()']
  },
  {
    name: 'multiple-solutions-with-char',
    input: '(a)())()',
    expected: ['(a)()()', '(a())()'],
  }
];
