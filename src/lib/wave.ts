/**
 * wave.ts —— 第 1 幕「波绕过障碍物」实验
 *
 * 物理模型（全部建立在已建立的概念上，只有两件事需要「信任」）：
 *  1. Huygens 原理：波前上的每个点都可以看作新的子波源（我们已在前言中建立）。
 *  2. Babinet 原理：不透明障碍物 = 入射平面波 − 与障碍物同形状、同位置的「缝」。
 *
 * 于是，障碍物后方任意一点 P 的场 = 平面波 − 该缝贡献的菲涅耳衍射场。
 * 而菲涅耳衍射可以精确写成 Fresnel 积分之差（见 lib/fresnel.ts）：
 *     U(X,Y) = e^{ikY} − e^{ikY}·(1−i)/2·[ΔC + i·ΔS]
 * 其中 u = (x′−X)·√(2/(λY)) 在缝的两个边缘取值，ΔC、ΔS 为两边缘 Fresnel 积分之差。
 *
 * 这样做的价值：不需要逐点数值积分，任何 λ/d 比值下都能精确、快速地渲染。
 *
 * 渲染两种模式：
 *  - ripple    —— 波动动画：高度 h = Re(U·e^{−iωt})，随时间推进形成行进波；
 *  - intensity —— 时间平均强度 |U|²，即「探测器胶片」记录的东西（衍射斑的前身）。
 * 底部还有一条「探测器强度剖面」曲线。
 */

import { fresnel } from './fresnel';

export type WaveMode = 'ripple' | 'intensity';

export interface WaveParams {
  /** λ / d（d 固定为 1 个场景单位，代表「要看见的目标」） */
  lambdaRatio?: number;
  mode?: WaveMode;
  /** true 时近似「完全看不见」：纯平面波直行（对应可见光 / 目标极小时） */
  invisible?: boolean;
}

/** 场景坐标（场景单位，非像素） */
const SCENE = {
  xMin: -3.2,
  xMax: 3.2,
  yTop: -0.95,
  yBot: 3.95,
  barY: 0,
  barHalf: 0.5,
  barHeight: 0.16,
  detY: 3.35,
};

const GRID_W = 320;
const GRID_H = 380;
const FIELD_W = 640;
const FIELD_H = 670;
const PROFILE_H = 90;
const CANVAS_W = FIELD_W;
const CANVAS_H = FIELD_H + PROFILE_H;

/** 构造一个颜色查找表（把 [0,1] 亮度映射成一段色带） */
function buildLUT(stops: Array<[number, [number, number, number]]>): Uint8ClampedArray {
  const out = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let seg = 0;
    while (seg < stops.length - 2 && t > stops[seg + 1][0]) seg++;
    const [t0, c0] = stops[seg];
    const [t1, c1] = stops[seg + 1];
    const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
    out[i * 3] = c0[0] + (c1[0] - c0[0]) * f;
    out[i * 3 + 1] = c0[1] + (c1[1] - c0[1]) * f;
    out[i * 3 + 2] = c0[2] + (c1[2] - c0[2]) * f;
  }
  return out;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class DiffractionScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private frameImg: ImageData;
  private staticImg: ImageData | null = null;

  private re: Float32Array;
  private im: Float32Array;
  private amp: Float32Array;
  private ph: Float32Array;
  private profile: Float32Array;
  private profileMax = 1;

  private lambdaRatio = 0.6;
  private mode: WaveMode = 'ripple';
  private invisible = false;
  private time = 0;
  private running = false;
  private rafId = 0;
  private lastTs = 0;
  private dirty = true;

  private lutRipple = buildLUT([
    [0, [7, 18, 31]],
    [0.3, [15, 60, 82]],
    [0.62, [36, 122, 142]],
    [1, [170, 238, 228]],
  ]);
  private lutIntensity = buildLUT([
    [0, [7, 18, 31]],
    [0.45, [24, 78, 108]],
    [0.75, [192, 140, 54]],
    [1, [255, 224, 138]],
  ]);

  constructor(canvas: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    this.mctx = canvas.getContext('2d')!;
    this.mctx.scale(dpr, dpr);

    this.off = document.createElement('canvas');
    this.off.width = CANVAS_W;
    this.off.height = CANVAS_H;
    this.octx = this.off.getContext('2d')!;
    this.frameImg = this.octx.createImageData(FIELD_W, FIELD_H);

    const n = GRID_W * GRID_H;
    this.re = new Float32Array(n);
    this.im = new Float32Array(n);
    this.amp = new Float32Array(n);
    this.ph = new Float32Array(n);
    this.profile = new Float32Array(GRID_W);

    this.recompute();
  }

  setParams(p: WaveParams): void {
    if (p.lambdaRatio !== undefined) this.lambdaRatio = p.lambdaRatio;
    if (p.mode !== undefined) this.mode = p.mode;
    if (p.invisible !== undefined) this.invisible = p.invisible;
    this.recompute();
  }

  /** 依据当前 λ/d 重新计算整个复数场（仅参数变化时需要，代价约几毫秒） */
  private recompute(): void {
    const d = 2 * SCENE.barHalf;
    const lambda = this.lambdaRatio * d;
    const k = (2 * Math.PI) / lambda;
    let profMax = 0;

    for (let j = 0; j < GRID_H; j++) {
      const Y = SCENE.yTop + (j / (GRID_H - 1)) * (SCENE.yBot - SCENE.yTop);
      const ky = k * Y;
      const ekyR = Math.cos(ky);
      const ekyI = Math.sin(ky);
      for (let i = 0; i < GRID_W; i++) {
        const X = SCENE.xMin + (i / (GRID_W - 1)) * (SCENE.xMax - SCENE.xMin);
        const idx = j * GRID_W + i;
        let r: number;
        let m: number;
        if (this.invisible || Y < 0.02) {
          // 上游只有入射平面波；「完全看不见」时全程也只有它
          r = ekyR;
          m = ekyI;
        } else {
          // Babinet：障碍物场 = 平面波 − 与障碍物同宽的缝的菲涅耳衍射
          const sq = Math.sqrt(2 / (lambda * Y));
          const u2 = (SCENE.barHalf - X) * sq;
          const u1 = (-SCENE.barHalf - X) * sq;
          const f2 = fresnel(u2);
          const f1 = fresnel(u1);
          const dC = f2.C - f1.C;
          const dS = f2.S - f1.S;
          const FRe = (dC + dS) / 2; // (1−i)/2·(ΔC + iΔS)
          const FIm = (dS - dC) / 2;
          const barRe = ekyR * FRe - ekyI * FIm; // e^{ikY}·F
          const barIm = ekyR * FIm + ekyI * FRe;
          r = ekyR - barRe;
          m = ekyI - barIm;
        }
        this.re[idx] = r;
        this.im[idx] = m;
        this.amp[idx] = Math.sqrt(r * r + m * m);
        this.ph[idx] = Math.atan2(m, r);
      }
    }

    // 探测器线处的强度剖面
    const detRow = Math.min(
      GRID_H - 1,
      Math.round(((SCENE.detY - SCENE.yTop) / (SCENE.yBot - SCENE.yTop)) * (GRID_H - 1)),
    );
    for (let i = 0; i < GRID_W; i++) {
      const a = this.amp[detRow * GRID_W + i];
      const I = a * a;
      this.profile[i] = I;
      if (I > profMax) profMax = I;
    }
    this.profileMax = Math.max(1, profMax);
    this.dirty = true;
    this.staticImg = null;
  }

  /** 每帧渲染：把场景画到离屏画布，再整幅拷贝到显示画布（支持 HiDPI） */
  private render(dt: number): void {
    const ctx = this.octx;
    this.time += dt;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0a1320';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (this.mode === 'ripple') {
      this.drawRipple(ctx);
    } else {
      if (this.dirty || !this.staticImg) {
        this.staticImg = this.buildIntensityImage();
        this.dirty = false;
      }
      ctx.putImageData(this.staticImg, 0, 0);
    }

    this.drawOverlays(ctx);
    this.drawProfile(ctx);
    this.mctx.drawImage(this.off, 0, 0);
  }

  /** 波动动画模式：每个像素读缓存的复数场，随相位滚动行进波 */
  private drawRipple(ctx: CanvasRenderingContext2D): void {
    const lambda = this.lambdaRatio * (2 * SCENE.barHalf);
    const phase = this.time * (Math.PI / lambda);
    const img = this.frameImg;
    const px = img.data;
    const lut = this.lutRipple;
    for (let py = 0; py < FIELD_H; py++) {
      const row = Math.floor((py * GRID_H) / FIELD_H) * GRID_W;
      const out = py * FIELD_W * 4;
      for (let i = 0; i < FIELD_W; i++) {
        const idx = row + Math.floor((i * GRID_W) / FIELD_W);
        const A = this.amp[idx];
        const wave = 0.5 + 0.5 * Math.cos(this.ph[idx] - phase);
        const bright = Math.min(1, A) * (0.3 + 0.7 * wave);
        const li = (bright * 255) | 0;
        const k = out + i * 4;
        px[k] = lut[li * 3];
        px[k + 1] = lut[li * 3 + 1];
        px[k + 2] = lut[li * 3 + 2];
        px[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /** 时间平均强度模式：I = |U|²（探测器实际记录的东西），静态 */
  private buildIntensityImage(): ImageData {
    const img = this.octx.createImageData(FIELD_W, FIELD_H);
    const px = img.data;
    const lut = this.lutIntensity;
    for (let py = 0; py < FIELD_H; py++) {
      const row = Math.floor((py * GRID_H) / FIELD_H) * GRID_W;
      const out = py * FIELD_W * 4;
      for (let i = 0; i < FIELD_W; i++) {
        const idx = row + Math.floor((i * GRID_W) / FIELD_W);
        const I = this.amp[idx] * this.amp[idx];
        const li = (Math.min(1, I) * 255) | 0;
        const k = out + i * 4;
        px[k] = lut[li * 3];
        px[k + 1] = lut[li * 3 + 1];
        px[k + 2] = lut[li * 3 + 2];
        px[k + 3] = 255;
      }
    }
    return img;
  }

  /** 绘制障碍物、探测器线等教学标注 */
  private drawOverlays(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(170,200,215,0.75)';
    ctx.font = '12px ui-monospace, "Cascadia Code", Consolas, monospace';
    ctx.fillText('入射平面波 ↓', 12, 22);

    // 障碍物（目标）
    const x0 = this.sceneToPxX(-SCENE.barHalf);
    const x1 = this.sceneToPxX(SCENE.barHalf);
    const y0 = this.sceneToPxY(SCENE.barY);
    const y1 = this.sceneToPxY(SCENE.barY + SCENE.barHeight);
    ctx.save();
    ctx.shadowColor = 'rgba(232,176,75,0.85)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#e8b04b';
    roundRectPath(ctx, x0, y0, x1 - x0, y1 - y0, 4);
    ctx.fill();
    ctx.restore();

    // 探测器线
    const dy = this.sceneToPxY(SCENE.detY);
    ctx.strokeStyle = 'rgba(232,176,75,0.5)';
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(0, dy);
    ctx.lineTo(FIELD_W, dy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(232,176,75,0.85)';
    ctx.fillText('探测器', 12, dy - 8);
  }

  /** 底部剖面：探测器沿线的时间平均强度曲线 */
  private drawProfile(ctx: CanvasRenderingContext2D): void {
    const top = FIELD_H;
    ctx.fillStyle = '#0d1624';
    ctx.fillRect(0, top, FIELD_W, PROFILE_H);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const yy = top + (PROFILE_H * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(FIELD_W, yy);
      ctx.stroke();
    }

    const yOf = (v: number): number => top + PROFILE_H * (1 - 0.82 * v) - PROFILE_H * 0.05;

    ctx.beginPath();
    for (let i = 0; i < GRID_W; i++) {
      const v = Math.min(1, this.profile[i] / this.profileMax);
      const x = (i / (GRID_W - 1)) * FIELD_W;
      if (i === 0) ctx.moveTo(x, yOf(v));
      else ctx.lineTo(x, yOf(v));
    }
    ctx.lineTo(FIELD_W, top + PROFILE_H);
    ctx.lineTo(0, top + PROFILE_H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(108,196,201,0.16)';
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < GRID_W; i++) {
      const v = Math.min(1, this.profile[i] / this.profileMax);
      const x = (i / (GRID_W - 1)) * FIELD_W;
      if (i === 0) ctx.moveTo(x, yOf(v));
      else ctx.lineTo(x, yOf(v));
    }
    ctx.strokeStyle = 'rgba(108,196,201,0.95)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.font = '11px ui-monospace, "Cascadia Code", Consolas, monospace';
    ctx.fillText('探测器记录到的强度 |U|²（衍射斑的前身）', 10, top + 16);
    ctx.fillText(`峰值 ${this.profileMax.toFixed(2)}`, FIELD_W - 120, top + 16);
  }

  private sceneToPxX(x: number): number {
    return ((x - SCENE.xMin) / (SCENE.xMax - SCENE.xMin)) * FIELD_W;
  }

  private sceneToPxY(y: number): number {
    return ((y - SCENE.yTop) / (SCENE.yBot - SCENE.yTop)) * FIELD_H;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = performance.now();
    const loop = (ts: number): void => {
      if (!this.running) return;
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      this.render(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  destroy(): void {
    this.pause();
  }
}

