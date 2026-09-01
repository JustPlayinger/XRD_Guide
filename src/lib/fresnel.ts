/**
 * fresnel.ts —— Fresnel 积分 C(x) 与 S(x)
 *
 * 定义：C(x) = ∫₀ˣ cos(πt²/2) dt,  S(x) = ∫₀ˣ sin(πt²/2) dt
 *
 * 为什么需要它？菲涅耳（近场）衍射的解析解可以完全用这两个函数表示。
 * 本教程第 1 幕的「波绕过障碍物」实验，就是利用 Babinet 原理
 * （障碍物 = 平面波 − 与障碍物同形状的缝），把场写成了 Fresnel 积分的差，
 * 从而避免了逐点数值积分，任何 λ/d 下都能快速、精确地计算。
 *
 * 数值方法：
 *  |x| ≤ 2  —— 幂级数（每项都是递推），收敛很快；
 *  |x| > 2  —— 渐近级数 f(x)、g(x)（见 Abramowitz & Stegun 7.3.17–7.3.18）。
 */

/** 预计算阶乘表（0!..63!），幂级数递推用 */
const FACT: number[] = (() => {
  const a = new Array<number>(64);
  a[0] = 1;
  for (let i = 1; i < 64; i++) a[i] = a[i - 1] * i;
  return a;
})();

/** 奇数的双阶乘：(-1)!! = 1, 1!! = 1, 3!! = 3, 5!! = 15 ... */
function doubleFact(n: number): number {
  let v = 1;
  for (let i = n; i > 1; i -= 2) v *= i;
  return v;
}

export interface FresnelValue {
  C: number;
  S: number;
}

/** 计算 Fresnel 积分 C(x) 与 S(x)（对任意实数 x）。 */
export function fresnel(x: number): FresnelValue {
  const ax = Math.abs(x);
  let C: number;
  let S: number;

  if (ax <= 2.5) {
    // 幂级数：
    //   C(x) = x · Σ cₙ tⁿ,   cₙ = 1 / ((2n)!·(4n+1))
    //   S(x) = x³·(π/2) · Σ sₙ tⁿ,  sₙ = 1 / ((2n+1)!·(4n+3))
    //   t = −(π/2)²·x⁴
    const x4 = ax * ax * ax * ax;
    const t = -0.25 * Math.PI * Math.PI * x4;
    let sumC = 0;
    let sumS = 0;
    let tn = 1;
    for (let n = 0; n < 28; n++) {
      sumC += tn / (FACT[2 * n] * (4 * n + 1));
      sumS += tn / (FACT[2 * n + 1] * (4 * n + 3));
      tn *= t;
    }
    C = ax * sumC;
    S = ax * ax * ax * (Math.PI / 2) * sumS;
  } else {
    // 渐近展开（θ = πx²/2）：
    //   C(x) ≈ 1/2 + f(x)·sinθ − g(x)·cosθ
    //   S(x) ≈ 1/2 − f(x)·cosθ − g(x)·sinθ
    //   f(x) ≈ Σₙ (−1)ⁿ (4n−1)!! / (π^(2n+1) · x^(4n+1))
    //   g(x) ≈ Σₙ (−1)ⁿ (4n+1)!! / (π^(2n+2) · x^(4n+3))
    const theta = 0.5 * Math.PI * ax * ax;
    let f = 0;
    let g = 0;
    for (let n = 0; n < 6; n++) {
      const sign = n % 2 === 0 ? 1 : -1;
      f += (sign * doubleFact(4 * n - 1)) / Math.pow(Math.PI, 2 * n + 1) / Math.pow(ax, 4 * n + 1);
      g += (sign * doubleFact(4 * n + 1)) / Math.pow(Math.PI, 2 * n + 2) / Math.pow(ax, 4 * n + 3);
    }
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    C = 0.5 + f * sinT - g * cosT;
    S = 0.5 - f * cosT - g * sinT;
  }

  // C、S 都是奇函数
  if (x < 0) {
    C = -C;
    S = -S;
  }
  return { C, S };
}

