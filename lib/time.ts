/** Wall-clock read, kept out of render paths (see react-hooks/purity). Call from effects and event handlers only. */
export function nowMs(): number {
  return Date.now();
}
