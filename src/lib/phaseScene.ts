/**
 * phaseScene.ts —— 第 6 幕「相位问题」
 *
 * 实验（Oppenheim & Lim 经典交换实验）：
 *   图 A（圆环）与图 B（哑铃）分别做 2D FFT。
 *   交换：A 的振幅 × B 的相位，逆变换 → 结果长得像 B（相位是赢家）。
 *   反向：B 的振幅 × A 的相位 → 结果长得像 A。
 *
 * 结论：结构信息几乎全在相位里，而我们恰好只测到振幅的平方（强度）。
 * 用的是第 5 幕铺垫的「|F|² 才是探测器读数」。
 *
 * 诚实标注：两幅图是程序生成的 2D 图案，不是真实蛋白；交换实验的数学和真实情况一致。
 */

import { fft2d, realToComplex, complexToReal } from './fft';

const N = 256;
const W = 640;
const H = 760;
const PANEL = 280;

function makeBuf(): Float64Array {
  return new Float64Array(2 * N * N);
}

/** 生成圆环图案（0..1） */
function buildRing(): Float64Array {
  const img = new Float64Array(N * N);
  const cx = N / 2;
  const cy = N / 2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const r = 58;
      const w = 16;
      const v = 1 / (1 + Math.exp((Math.abs(d - r) - w / 2) / 4));
      img[y * N + x] = v * 0.9 + 0.05;
    }
  }
  return blur(img);
}

/** 生成哑铃图案（两个圆 + 连接条），可旋转 */
function buildDumbbell(angleDeg: number): Float64Array {
  const img = new Float64Array(N * N);
  const cx = N / 2;
  const cy = N / 2;
  const c = Math.cos((angleDeg * Math.PI) / 180);
  const s = Math.sin((angleDeg * Math.PI) / 180);
  const dots: Array<[number, number, number]> = [
    [-55, 0, 30],
    [55, 0, 30],
  ];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const lx = dx * c + dy * s;
      const ly = -dx * s + dy * c;
      let v = 0;
      for (const [ox, oy, r] of dots) {
        const d = Math.hypot(lx - ox, ly - oy);
        v = Math.max(v, 1 / (1 + Math.exp((d - r) / 3)));
      }
      if (Math.abs(ly) < 10 && Math.abs(lx) < 58) v = Math.max(v, 0.85);
      img[y * N + x] = v * 0.9 + 0.05;
    }
  }
  return blur(img);
}

/** 3×3 box blur（让图案平滑） */
function blur(img: Float64Array): Float64Array {
  const out = new Float64Array(img);
  for (let pass = 0; pass < 2; pass++) {
    const src = new Float64Array(out);
    for (let y = 1; y < N - 1; y++) {
      for (let x = 1; x < N - 1; x++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) sum += src[(y + dy) * N + (x + dx)];
        }
        out[y * N + x] = sum / 9;
      }
    }
  }
  return out;
}

/** 提取振幅与相位 */
function ampPhase(buf: Float64Array): { amp: Float64Array; phase: Float64Array } {
  const amp = new Float64Array(N * N);
  const phase = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) {
    const re = buf[2 * i];
    const im = buf[2 * i + 1];
    amp[i] = Math.hypot(re, im);
    phase[i] = Math.atan2(im, re);
  }
  return { amp, phase };
}

/** 用 amp 的振幅 + phase 的相位重建图像 */
function exchange(amp: Float64Array, phase: Float64Array): Float64Array {
  const buf = makeBuf();
  for (let i = 0; i < N * N; i++) {
    buf[2 * i] = amp[i] * Math.cos(phase[i]);
    buf[2 * i + 1] = amp[i] * Math.sin(phase[i]);
  }
  fft2d(buf, N, true);
  for (let i = 0; i < N * N; i++) buf[2 * i] /= N * N;
  const re = new Float64Array(N * N);
  complexToReal(buf, re, N, 're');
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < N * N; i++) {
    if (re[i] < lo) lo = re[i];
    if (re[i] > hi) hi = re[i];
  }
  const span = hi - lo || 1;
  for (let i = 0; i < N * N; i++) re[i] = (re[i] - lo) / span;
  return re;
}

export class PhaseScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private imgA = buildRing();
  private imgB = buildDumbbell(0);
  private resAB: Float64Array = new Float64Array(N * N);
  private resBA: Float64Array = new Float64Array(N * N);

  constructor(canvas: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    this.mctx = canvas.getContext('2d')!;
    this.mctx.scale(dpr, dpr);
    this.off = document.createElement('canvas');
    this.off.width = W;
    this.off.height = H;
    this.octx = this.off.getContext('2d')!;
    this.compute();
    this.render();
  }

  private compute(): void {
    const bufA = makeBuf();
    const bufB = makeBuf();
    realToComplex(this.imgA, bufA, N);
    realToComplex(this.imgB, bufB, N);
    fft2d(bufA, N, false);
    fft2d(bufB, N, false);
    const a = ampPhase(bufA);
    const b = ampPhase(bufB);
    this.resAB = exchange(a.amp, b.phase);
    this.resBA = exchange(b.amp, a.phase);
  }

  /** 换一组图案重新做实验 */
  rerun(): void {
    const angle = Math.floor(Math.random() * 360);
    this.imgB = buildDumbbell(angle);
    this.compute();
    this.render();
  }

  start(): void {}
  pause(): void {}
  destroy(): void {}

  private render(): void {
    const ctx = this.octx;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a1320';
    ctx.fillRect(0, 0, W, H);

    const drawImage = (img: Float64Array, x: number, y: number, label: string): void => {
      const tile = ctx.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const v = Math.max(0, Math.min(1, img[i])) * 255;
        const idx = i * 4;
        tile.data[idx] = 12 + v * 0.5;
        tile.data[idx + 1] = 20 + v * 0.75;
        tile.data[idx + 2] = 34 + v;
        tile.data[idx + 3] = 255;
      }
      ctx.putImageData(tile, x, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, PANEL, PANEL);
      ctx.fillStyle = '#9aa3ad';
      ctx.font = '12px ui-monospace, Consolas, monospace';
      ctx.fillText(label, x + 6, y - 6);
    };

    const gap = 40;
    const x0 = 20;
    const y0 = 46;
    drawImage(this.imgA, x0, y0, '图 A（圆环）');
    drawImage(this.imgB, x0 + PANEL + gap, y0, '图 B（哑铃）');
    drawImage(this.resAB, x0, y0 + PANEL + 60, 'A 振幅 × B 相位 → 像 B');
    drawImage(this.resBA, x0 + PANEL + gap, y0 + PANEL + 60, 'B 振幅 × A 相位 → 像 A');

    this.mctx.drawImage(this.off, 0, 0);
  }
}
