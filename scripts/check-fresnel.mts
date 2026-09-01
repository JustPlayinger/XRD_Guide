// 校验 src/lib/fresnel.ts 的数值实现：
//  1) 与独立实现的 Simpson 数值积分对照（从 0 积分到 x）
//  2) 与已知标准值对照（C(1), S(1), C(2), S(2), C(1.5), S(1.5)）
import { fresnel } from '../src/lib/fresnel.ts';

function simpsonC(x: number, n = 400000): number {
  const h = x / n;
  let sum = 0.5 * (1 + Math.cos((Math.PI / 2) * x * x));
  for (let i = 1; i < n; i++) {
    const t = i * h;
    const f = Math.cos((Math.PI / 2) * t * t);
    sum += (i % 2 === 1 ? 4 : 2) * f;
  }
  return (h / 3) * sum;
}

function simpsonS(x: number, n = 400000): number {
  const h = x / n;
  let sum = 0.5 * (0 + Math.sin((Math.PI / 2) * x * x));
  for (let i = 1; i < n; i++) {
    const t = i * h;
    const f = Math.sin((Math.PI / 2) * t * t);
    sum += (i % 2 === 1 ? 4 : 2) * f;
  }
  return (h / 3) * sum;
}

// 标准值（NIST / Wolfram Alpha）
const known: Array<[number, number, number]> = [
  [0.5, 0.4923442259, 0.0647324329],
  [1.0, 0.7798934004, 0.4382591474],
  [1.5, 0.4452611760, 0.6975049602],
  [2.0, 0.4882534061, 0.3434156784],
  [2.5, 0.4574130096, 0.6191817537],
  [3.0, 0.6057207893, 0.4963129989],
];

let ok = true;
for (const [x, cRef, sRef] of known) {
  const { C, S } = fresnel(x);
  const dc = Math.abs(C - cRef);
  const ds = Math.abs(S - sRef);
  const pass = dc < 1e-6 && ds < 1e-6;
  if (!pass) ok = false;
  console.log(
    `x=${x}  C=${C.toFixed(9)} (ref ${cRef}, Δ=${dc.toExponential(2)})  ` +
      `S=${S.toFixed(9)} (ref ${sRef}, Δ=${ds.toExponential(2)})  ${pass ? 'OK' : 'FAIL'}`,
  );
}

// 与 Simpson 数值积分对照（覆盖级数/渐近两条路径 + 负数对称性）
for (const x of [-3.7, -2.5, -1.9, -1.2, -0.6, 0, 0.6, 1.2, 1.9, 2.5, 3.7, 6.0]) {
  const { C, S } = fresnel(x);
  const cRef = simpsonC(x);
  const sRef = simpsonS(x);
  const dc = Math.abs(C - cRef);
  const ds = Math.abs(S - sRef);
  if (dc > 2e-5 || ds > 2e-5) {
    ok = false;
    console.log(`MISMATCH x=${x}  ΔC=${dc.toExponential(2)} ΔS=${ds.toExponential(2)}`);
  }
}
console.log(ok ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(ok ? 0 : 1);
