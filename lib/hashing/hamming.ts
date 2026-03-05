export function hammingDistanceHex(left: string, right: string) {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (a.length !== b.length || !a.length) {
    return Number.POSITIVE_INFINITY;
  }

  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    const nibbleA = Number.parseInt(a[i], 16);
    const nibbleB = Number.parseInt(b[i], 16);
    if (Number.isNaN(nibbleA) || Number.isNaN(nibbleB)) {
      return Number.POSITIVE_INFINITY;
    }
    let x = nibbleA ^ nibbleB;
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}
