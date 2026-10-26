let listener = null;

export function setToastListener(fn) {
  listener = fn;
}

export function toast(message, kind = 'ok') {
  if (listener) listener({ message, kind, id: Date.now() });
}
