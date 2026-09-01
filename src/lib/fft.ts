/**
 * fft.ts —— 自写快速傅里叶变换（Cooley-Tukey，radix-2）
 *
 * 数据格式：交错复数 Float64Array：[re₀, im₀, re₁, im₁, ...]。
 * 长度（点数）必须是 2 的幂。
 *
 * 这个文件是第 6 幕（相位问题）、第 7 幕（分辨率）、第 8 幕（模型偏倚）的计算内核。
 * 逆变换不归一化，使用时记得除以总点数。
 */

export type ComplexArray = Float64Array;

function swapPair(a: ComplexArray, i: number, j: number): void {
  const tr = a[2 * i];
  const ti = a[2 * i + 1];
  a[2 * i] = a[2 * j];
  a[2 * i + 1] = a[2 * j + 1];
  a[2 * j] = tr;
  a[2 * j + 1] = ti;
}

/** 一维就地 FFT / 逆 FFT。n = a.length/2，必须为 2 的幂。 */
export function fft1d(a: ComplexArray, inverse: boolean): void {
  const n = a.length / 2;
  if (n <= 1) return;

  // 位反转重排
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) swapPair(a, i, j);
  }

  // 蝶形运算
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((2 * Math.PI) / len) * (inverse ? 1 : -1);
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const i1 = i + k;
        const i2 = i + k + half;
        const ar = a[2 * i1];
        const ai = a[2 * i1 + 1];
        const br = a[2 * i2];
        const bi = a[2 * i2 + 1];
        const tr = br * curRe - bi * curIm;
        const ti = br * curIm + bi * curRe;
        a[2 * i1] = ar + tr;
        a[2 * i1 + 1] = ai + ti;
        a[2 * i2] = ar - tr;
        a[2 * i2 + 1] = ai - ti;
        const nr = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nr;
      }
    }
  }
}

/** 二维 FFT / 逆 FFT。data 为 N×N 交错复数（行主序），N 必须为 2 的幂。 */
export function fft2d(data: ComplexArray, n: number, inverse: boolean): void {
  const row = new Float64Array(2 * n);
  for (let y = 0; y < n; y++) {
    const base = y * n;
    for (let x = 0; x < n; x++) {
      row[2 * x] = data[2 * (base + x)];
      row[2 * x + 1] = data[2 * (base + x) + 1];
    }
    fft1d(row, inverse);
    for (let x = 0; x < n; x++) {
      data[2 * (base + x)] = row[2 * x];
      data[2 * (base + x) + 1] = row[2 * x + 1];
    }
  }

  const col = new Float64Array(2 * n);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      col[2 * y] = data[2 * (y * n + x)];
      col[2 * y + 1] = data[2 * (y * n + x) + 1];
    }
    fft1d(col, inverse);
    for (let y = 0; y < n; y++) {
      data[2 * (y * n + x)] = col[2 * y];
      data[2 * (y * n + x) + 1] = col[2 * y + 1];
    }
  }
}

/** 把实数 N×N 图像装入交错复数数组 */
export function realToComplex(src: Float64Array, out: ComplexArray, n: number): void {
  for (let i = 0; i < n * n; i++) {
    out[2 * i] = src[i];
    out[2 * i + 1] = 0;
  }
}

/** 从交错复数数组取出实数部（或模）成 N×N 图像 */
export function complexToReal(src: ComplexArray, out: Float64Array, n: number, mode: 're' | 'abs'): void {
  for (let i = 0; i < n * n; i++) {
    out[i] = mode === 're' ? src[2 * i] : Math.hypot(src[2 * i], src[2 * i + 1]);
  }
}

/** 频谱平移：把低频（原点）移到图像中心 */
export function fftshift(data: ComplexArray, n: number): void {
  const half = n >> 1;
  const tmp = new Float64Array(2 * n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const sy = (y + half) % n;
      const sx = (x + half) % n;
      const s = 2 * (sy * n + sx);
      const d = 2 * (y * n + x);
      tmp[d] = data[s];
      tmp[d + 1] = data[s + 1];
    }
  }
  data.set(tmp);
}

/** 逆频谱平移 */
export function ifftshift(data: ComplexArray, n: number): void {
  fftshift(data, n);
}
