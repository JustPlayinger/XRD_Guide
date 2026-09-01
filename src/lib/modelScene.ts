/**
 * modelScene.ts —— 第 8 幕「从密度到坐标」
 *
 * 两种模式：
 *  - 'rfree'   R-work / R-free 曲线 vs 模型自由度。R-work 一路降（过拟合），
 *              R-free（留出的 5% 验证衍射斑）先降后升——机器学习的验证集逻辑。
 *  - 'bias'    模型偏倚实验：用「正确振幅 × 错误模型的相位」重建密度，
 *              结果长出错误模型的特征（分子置换的原罪）。
 *
 * 诚实标注：R 曲线是合成示意，不是真实精修数据；偏倚实验的分子是 2D 图案，
 * 数学（振幅×相位重建）与真实情况一致。
 */

import { fft2d, realToComplex, complexToReal } from './fft';

const W = 640;
const H = 760;

export type ModelMode = 'rfree' | 'bias';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function rwork(p: number): number {
  return 0.42 * Math.exp(-p / 20) + 0.06;
}
function rfree(p: number): number {
  return 0.5 * Math.exp(-p / 22) + 0.1 + 0.32 * Math.pow(p / 100, 2);
}

// ---- 偏倚实验的图像 ----
const N = 256;

function makeImg(fn: (x: number, y: number) => number): Float64Array {
  const img = new Float64Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      img[y * N + x] = fn(x, y);
    }
  }
  const out = new Float64Array(img);
  for (let pass = 0; pass < 2; pass++) {
    const src = new Float64Array(out);
    for (let y = 1; y < N - 1; y++) {
      for (let x = 1; x < N - 1; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) s += src[(y + dy) * N + (x + dx)];
        }
        out[y * N + x] = s / 9;
      }
    }
  }
  return out;
}

function trueMolecule(): Float64Array {
  return makeImg((x, y) => {
    const blobs: Array<[number, number, number]> = [
      [96, 96, 26],
      [132, 108, 22],
      [150, 140, 24],
      [132, 170, 22],
      [100, 178, 20],
      [112, 120, 14],
      [120, 150, 10],
    ];
    let v = 0;
    for (const [bx, by, r] of blobs) {
      v += Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / (2 * r * r));
    }
    return Math.min(1, v);
  });
}

function wrongModel(): Float64Array {
  return makeImg((x, y) => {
    const d = Math.hypot(x - 128, y - 128);
    return 1 / (1 + Math.exp((d - 42) / 3));
  });
}

export class ModelScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private mode: ModelMode = 'rfree';
  private p = 20;
  private imgTrue = trueMolecule();
  private imgWrong = wrongModel();
  private biased = new Float64Array(N * N);

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
    this.computeBias();
    this.render();
  }

  private computeBias(): void {
    const bufA = new Float64Array(2 * N * N);
    const bufB = new Float64Array(2 * N * N);
    realToComplex(this.imgTrue, bufA, N);
    realToComplex(this.imgWrong, bufB, N);
    fft2d(bufA, N, false);
    fft2d(bufB, N, false);
    const ampA = new Float64Array(N * N);
    const phB = new Float64Array(N * N);
    for (let i = 0; i < N * N; i++) {
      ampA[i] = Math.hypot(bufA[2 * i], bufA[2 * i + 1]);
      phB[i] = Math.atan2(bufB[2 * i + 1], bufB[2 * i]);
    }
    const out = new Float64Array(2 * N * N);
    for (let i = 0; i < N * N; i++) {
      out[2 * i] = ampA[i] * Math.cos(phB[i]);
      out[2 * i + 1] = ampA[i] * Math.sin(phB[i]);
    }
    fft2d(out, N, true);
    for (let i = 0; i < N * N; i++) out[2 * i] /= N * N;
    complexToReal(out, this.biased, N, 're');
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < N * N; i++) {
      if (this.biased[i] < lo) lo = this.biased[i];
      if (this.biased[i] > hi) hi = this.biased[i];
    }
    const span = hi - lo || 1;
    for (let i = 0; i < N * N; i++) this.biased[i] = (this.biased[i] - lo) / span;
  }

  setMode(m: ModelMode): void {
    this.mode = m;
    this.render();
  }

  setFreedom(p: number): void {
    this.p = clamp(Math.round(p), 1, 100);
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
    if (this.mode === 'rfree') this.drawRfree(ctx);
    else this.drawBias(ctx);
    this.mctx.drawImage(this.off, 0, 0);
  }

  private drawRfree(ctx: CanvasRenderingContext2D): void {
    const X0 = 60;
    const X1 = W - 40;
    const Y0 = 120;
    const Y1 = 660;
    const xOf = (p: number): number => X0 + (p / 100) * (X1 - X0);
    const yOf = (r: number): number => Y1 - (r / 0.55) * (Y1 - Y0);

    ctx.fillStyle = '#0d1624';
    ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '13px ui-monospace, Consolas, monospace';
    ctx.fillText('R 值 vs 模型自由度（更多原子 / 更多水 / 更多 B 因子…）', 20, 34);
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('R-free = 留出 5% 的衍射斑，永远不参与拟合（验证集）', 20, 58);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i <= 5; i++) {
      const y = Y0 + ((Y1 - Y0) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(X0, y);
      ctx.lineTo(X1, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(170,200,215,0.5)';
    ctx.font = '10px ui-monospace, Consolas, monospace';
    for (let i = 0; i <= 5; i++) {
      const r = (0.55 * i) / 5;
      ctx.fillText(r.toFixed(2), 12, Y1 - (r / 0.55) * (Y1 - Y0) + 4);
    }

    const drawCurve = (fn: (p: number) => number, color: string): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let p = 1; p <= 100; p++) {
        const x = xOf(p);
        const y = yOf(fn(p));
        if (p === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    drawCurve(rfree, '#6cc4c9');
    drawCurve(rwork, '#e8b04b');

    const px = xOf(this.p);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(px, Y0 - 8);
    ctx.lineTo(px, Y1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6cc4c9';
    ctx.beginPath();
    ctx.arc(px, yOf(rfree(this.p)), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b04b';
    ctx.beginPath();
    ctx.arc(px, yOf(rwork(this.p)), 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6cc4c9';
    ctx.fillText(`R-free = ${rfree(this.p).toFixed(3)}`, 20, 700);
    ctx.fillStyle = '#e8b04b';
    ctx.fillText(`R-work = ${rwork(this.p).toFixed(3)}`, 20, 722);
    ctx.fillStyle = 'rgba(232,176,75,0.9)';
    ctx.fillText(`差距 = ${(rfree(this.p) - rwork(this.p)).toFixed(3)}（越小越好）`, W - 250, 700);
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.fillText('R-work 只会降（过拟合）；R-free 先降后升', W - 280, 722);
    ctx.fillStyle = '#e8b04b';
    ctx.fillText('R-work', 12, 100);
    ctx.fillStyle = '#6cc4c9';
    ctx.fillText('R-free', 80, 100);
  }

  private drawBias(ctx: CanvasRenderingContext2D): void {
    const panel = 190;
    const drawImage = (img: Float64Array, x: number, y: number, label: string, color = false): void => {
      const tile = ctx.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const v = Math.max(0, Math.min(1, img[i])) * 255;
        const idx = i * 4;
        tile.data[idx] = color ? 10 + v * 0.3 : 12 + v * 0.5;
        tile.data[idx + 1] = color ? 26 + v * 0.8 : 20 + v * 0.75;
        tile.data[idx + 2] = color ? 40 + v : 34 + v;
        tile.data[idx + 3] = 255;
      }
      const mini = document.createElement('canvas');
      mini.width = N;
      mini.height = N;
      const mctx = mini.getContext('2d')!;
      mctx.putImageData(tile, 0, 0);
      ctx.drawImage(mini, x, y, panel, panel);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(x, y, panel, panel);
      ctx.fillStyle = '#9aa3ad';
      ctx.font = '12px ui-monospace, Consolas, monospace';
      ctx.fillText(label, x + 6, y - 8);
    };

    drawImage(this.imgTrue, 30, 40, '真实分子（正确相位可得）');
    drawImage(this.imgWrong, 30 + panel + 30, 40, '错误模型（当相位来源）');
    drawImage(this.biased, 30, 40 + panel + 60, '正确振幅 × 错误相位 → 假密度', true);

    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.font = '13px ui-monospace, Consolas, monospace';
    ctx.fillText('注意第三格：密度里长出了错误模型才有的「圆」，', 30, 40 + panel + 60 + panel + 22);
    ctx.fillText('但它看起来和真密度一样可信。这就是模型偏倚。', 30, 40 + panel + 60 + panel + 44);
    ctx.fillStyle = 'rgba(232,176,75,0.9)';
    ctx.fillText('破法：omit map——把可疑区域从模型里扣掉再算相位', 30, 40 + panel + 60 + panel + 68);
  }
}
