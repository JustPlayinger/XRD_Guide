/**
 * resolutionScene.ts —— 第 7 幕「分辨率」
 *
 * 概念：电子密度图 = 把所有衍射斑「加」回图像（傅里叶合成）。
 * 分辨率 = 参与合成的最高空间频率 |s| ≤ 1/d_min 的截止线。
 *
 * 交互：滑块改 d_min（6→1 Å）。截断越低，图像越糊；截断越高，越锐利。
 * 同时展示衍射图里的截止圆，以及硬截断产生的傅里叶涟漪（假密度）——第一个真正的「隐患」。
 *
 * 诚实标注：分子是程序生成的 2D 高斯原子云，不是真实蛋白；傅里叶合成的数学与真实一致，
 * 用的是硬截断（实际精修常用软权重，涟漪会轻一些）。
 */

import { fft2d, realToComplex, complexToReal, fftshift, ifftshift } from './fft';

const N = 256;
const W = 640;
const H = 760;

const PANEL_X = 20;
const PANEL_Y = 40;
const PANEL = 290;
const PHYS_LEN = 34; // 图像对应的物理尺寸（Å）

/** 生成一个"小蛋白"样的 2D 原子云（高斯点） */
function buildMolecule(): Float64Array {
  const img = new Float64Array(N * N);
  // 原子坐标（px，中心附近），模拟主链 + 侧链
  const atoms: Array<[number, number]> = [
    [120, 90],
    [146, 108],
    [168, 132],
    [180, 160],
    [178, 190],
    [162, 214],
    [138, 228],
    [112, 230],
    [94, 210],
    [90, 184],
    [104, 160],
    [130, 152],
    [152, 178],
    [120, 120],
  ];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let v = 0;
      for (const [ax, ay] of atoms) {
        const d2 = (x - ax) ** 2 + (y - ay) ** 2;
        v += Math.exp(-d2 / (2 * 2.6 * 2.6));
      }
      img[y * N + x] = Math.min(1, v * 0.55);
    }
  }
  return img;
}

function makeBuf(): Float64Array {
  return new Float64Array(2 * N * N);
}

export class ResolutionScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private spectrum = makeBuf(); // 移位后的频谱
  private recon = new Float64Array(N * N);
  private dMin = 2.5;
  private img = buildMolecule();

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
    this.precompute();
    this.applyMask();
  }

  private precompute(): void {
    realToComplex(this.img, this.spectrum, N);
    fft2d(this.spectrum, N, false);
    fftshift(this.spectrum, N);
  }

  setResolution(dMin: number): void {
    this.dMin = Math.max(1.0, Math.min(6.0, dMin));
    this.applyMask();
  }

  private applyMask(): void {
    const R = PHYS_LEN / this.dMin; // 截止半径（网格单位）
    const masked = makeBuf();
    masked.set(this.spectrum);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - N / 2;
        const dy = y - N / 2;
        if (Math.hypot(dx, dy) > R) {
          const i = y * N + x;
          masked[2 * i] = 0;
          masked[2 * i + 1] = 0;
        }
      }
    }
    ifftshift(masked, N);
    fft2d(masked, N, true);
    for (let i = 0; i < N * N; i++) masked[2 * i] /= N * N;
    complexToReal(masked, this.recon, N, 're');
    // 线性拉伸
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < N * N; i++) {
      if (this.recon[i] < lo) lo = this.recon[i];
      if (this.recon[i] > hi) hi = this.recon[i];
    }
    const span = hi - lo || 1;
    for (let i = 0; i < N * N; i++) this.recon[i] = (this.recon[i] - lo) / span;
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

    // 左：重建密度
    const tile = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = Math.max(0, Math.min(1, this.recon[i]));
      const idx = i * 4;
      const b = Math.pow(v, 0.6) * 255;
      tile.data[idx] = 10 + b * 0.25;
      tile.data[idx + 1] = 22 + b * 0.5;
      tile.data[idx + 2] = 40 + b;
      tile.data[idx + 3] = 255;
    }
    ctx.putImageData(tile, PANEL_X, PANEL_Y);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(PANEL_X, PANEL_Y, PANEL, PANEL);
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(`重建密度 · d_min = ${this.dMin.toFixed(1)} Å`, PANEL_X + 6, PANEL_Y - 8);

    // 右：衍射图（log 强度）+ 截止圆
    const x2 = PANEL_X + PANEL + 30;
    const tile2 = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const re = this.spectrum[2 * i];
        const im = this.spectrum[2 * i + 1];
        const mag = Math.log10(1 + Math.hypot(re, im));
        const v = Math.max(0, Math.min(1, mag / 5.5));
        const idx = (y * N + x) * 4;
        const b = v * 255;
        tile2.data[idx] = 18 + b * 0.45;
        tile2.data[idx + 1] = 26 + b * 0.6;
        tile2.data[idx + 2] = 44 + b;
        tile2.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(tile2, x2, PANEL_Y);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(x2, PANEL_Y, PANEL, PANEL);
    ctx.fillStyle = '#9aa3ad';
    ctx.fillText('衍射图（log 强度）', x2 + 6, PANEL_Y - 8);

    // 截止圆
    const R = (PHYS_LEN / this.dMin) * (PANEL / N);
    ctx.strokeStyle = '#e8b04b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(x2 + PANEL / 2, PANEL_Y + PANEL / 2, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(232,176,75,0.95)';
    ctx.fillText(`截止 |s| ≤ 1/${this.dMin.toFixed(1)} Å`, x2 + 6, PANEL_Y + PANEL + 18);

    this.mctx.drawImage(this.off, 0, 0);
  }
}
