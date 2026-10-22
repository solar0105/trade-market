import { el } from '../dom.js';

let timer = null;

export function toast(message, kind = 'ok') {
  const box = el('toast');
  box.textContent = message;
  box.className = `toast show ${kind}`;

  clearTimeout(timer);
  timer = setTimeout(() => { box.className = 'toast'; }, 2600);
}