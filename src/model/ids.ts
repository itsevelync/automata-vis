const ID_RE = /^[A-Za-z][A-Za-z0-9]*$/;

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

export function nextStateId(ids: Iterable<string>): string {
  const taken = new Set(ids);
  let index = 0;
  while (taken.has(`q${index}`)) index += 1;
  return `q${index}`;
}
