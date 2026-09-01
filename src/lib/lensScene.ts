/**
 * lensScene.ts —— 第 2 幕「透镜的缺席」
 *
 * 上半：可见光（玻璃 n≈1.5），透镜把两个散射中心 P₁、P₂ 各自聚成屏上的像点。
 * 下半：X 射线（n 由滑块控制）。n≈1 时没有透镜，两束波在屏上混成一片弥散光斑；
 *       把 n 拉到 1.5，假设的透镜能把像「救回来」——现实里 X 射线永远停在 n≈1。
 *
 * 诚实标注：这里用「波前圆心在透镜处切换」的几何近似画聚焦，不做真实的折射计算；
 * 透镜成像用傍轴近似（每个物点对应一个像点）。「相位对齐 → 像点变亮」这条物理是对的。
 */

const W = 640;
const H = 760;

const PANEL_TOP_Y = 22;
const PANEL_H = 318;
const PANEL_BOT_Y = 402;

const OBJ_X = 100;
const LENS_X = 342;
const SCR_X = 566;
const DY = 56; // 散射中心偏离面板中心的距离
const LENS_THRESHOLD = 1.28; // n 超过这个值才出现透镜
const RING_SPACING = 44; // 相邻波前圆环的间距（像素）
const RING_SPEED = 95; // 波前扩散速度（像素/秒）

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
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

interface Pt {
  x: number;
  y: number;
}

export class LensScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private n = 1.0;
  private time = 0;
  private running = false;
  private rafId = 0;
  private lastTs = 0;

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
    this.render(0);
  }

  setN(n: number): void {
    this.n = clamp(n, 1.0, 1.5);
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

  private render(dt: number): void {
    this.time += dt;
    const ctx = this.octx;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a1320';
    ctx.fillRect(0, 0, W, H);

    // 上半：可见光，固定 n≈1.5
    this.drawPanel(ctx, PANEL_TOP_Y, '可见光 · 玻璃 n≈1.5', 1.5);
    // 下半：X 射线，n 由滑块决定
    const lensOn = this.n >= LENS_THRESHOLD;
    const label = lensOn
      ? `X 射线（假设）· n=${this.n.toFixed(2)} → 有透镜`
      : `X 射线 · n=${this.n.toFixed(2)} → 没有透镜`;
    this.drawPanel(ctx, PANEL_BOT_Y, label, this.n);

    this.mctx.drawImage(this.off, 0, 0);
  }

    private drawPanel(ctx: CanvasRenderingContext2D, y0: number, title: string, n: number): void {
    const y1 = y0 + PANEL_H;
    const cy = (y0 + y1) / 2;
    const lensOn = n >= LENS_THRESHOLD;

    // 面板底
    ctx.fillStyle = '#0d1624';
    roundRectPath(ctx, 8, y0, W - 16, PANEL_H, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(title, 20, y0 + 22);

    const P1: Pt = { x: OBJ_X, y: cy - DY };
    const P2: Pt = { x: OBJ_X, y: cy + DY };

    // 波前（P1 青、P2 琥珀）
    this.drawWaves(ctx, P1, y0, lensOn, '#6cc4c9');
    this.drawWaves(ctx, P2, y0, lensOn, '#e8b04b');

    // 分子：两个散射中心
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(P1.x, P1.y);
    ctx.lineTo(P2.x, P2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    this.drawSource(ctx, P1, '#6cc4c9');
    this.drawSource(ctx, P2, '#e8b04b');
    ctx.fillStyle = 'rgba(170,200,215,0.65)';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText('P₁', P1.x - 36, P1.y - 6);
    ctx.fillText('P₂', P2.x - 36, P2.y + 14);

    // 光路参考线（虚线）
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    for (const [P, color] of [
      [P1, '#6cc4c9'],
      [P2, '#e8b04b'],
    ] as Array<[Pt, string]>) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      if (lensOn) {
        ctx.moveTo(P.x, P.y);
        ctx.lineTo(LENS_X, P.y);
        ctx.lineTo(SCR_X, P.y);
      } else {
        ctx.moveTo(P.x, P.y);
        ctx.lineTo(SCR_X, P.y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    // 透镜
    if (lensOn) this.drawLens(ctx, LENS_X, cy, n);

    // 屏
    ctx.strokeStyle = 'rgba(232,176,75,0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(SCR_X, y0 + 8);
    ctx.lineTo(SCR_X, y1 - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // 屏上的像 / 弥散
    if (lensOn) {
      this.drawImageDot(ctx, SCR_X, cy - DY, '#6cc4c9');
      this.drawImageDot(ctx, SCR_X, cy + DY, '#e8b04b');
      ctx.fillStyle = 'rgba(170,200,215,0.7)';
      ctx.fillText('像点：P₁ 与 P₂ 各自聚拢', SCR_X - 172, y1 - 12);
    } else {
      this.drawBlur(ctx, SCR_X, cy);
      ctx.fillStyle = 'rgba(170,200,215,0.7)';
      ctx.fillText('屏上只有一片弥散的光', SCR_X - 156, y1 - 12);
    }
  }

  /** 波前：从源向外扩散；有透镜时经过透镜后改为向像点收拢 */
  private drawWaves(
    ctx: CanvasRenderingContext2D,
    P: Pt,
    y0: number,
    lensOn: boolean,
    color: string,
  ): void {
    const dL = LENS_X - P.x; // 源到透镜
    const dI = SCR_X - LENS_X; // 透镜到像点
    const maxR = lensOn ? dL + dI : SCR_X - P.x + 60;
    const I: Pt = { x: SCR_X, y: P.y };
    const nRings = Math.ceil(maxR / RING_SPACING) + 2;

    for (let k = 0; k < nRings; k++) {
      const r = (this.time * RING_SPEED + k * RING_SPACING) % maxR;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1.5;
      if (!lensOn || r < dL) {
        // 源 → 透镜（或一直扩散到屏）
        ctx.beginPath();
        ctx.rect(P.x - 2, y0 - 2, lensOn ? LENS_X - P.x + 4 : SCR_X - P.x + 4, PANEL_H + 4);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(P.x, P.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // 透镜 → 像点（收拢）
        const rr = dL + dI - r;
        ctx.beginPath();
        ctx.rect(LENS_X - 2, y0 - 2, SCR_X - LENS_X + 4, PANEL_H + 4);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(I.x, I.y, Math.max(1, rr), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawSource(ctx: CanvasRenderingContext2D, p: Pt, color: string): void {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawLens(ctx: CanvasRenderingContext2D, x: number, cy: number, n: number): void {
    const a = clamp((n - LENS_THRESHOLD) / 0.22, 0, 1);
    const top = cy - DY - 30;
    const bottom = cy + DY + 30;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#e8b04b';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(232,176,75,0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.quadraticCurveTo(x - 20, cy, x, bottom);
    ctx.quadraticCurveTo(x + 20, cy, x, top);
    ctx.stroke();
    ctx.restore();
    if (a > 0.5) {
      ctx.fillStyle = 'rgba(232,176,75,0.9)';
      ctx.font = '11px ui-monospace, Consolas, monospace';
      ctx.fillText('透镜', x - 32, top - 8);
    }
  }

  private drawImageDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.4, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  /** 无透镜时屏上的弥散光斑：两团重叠的大光晕 + 轻微闪烁 */
  private drawBlur(ctx: CanvasRenderingContext2D, x: number, cy: number): void {
    const flicker = 0.22 + 0.06 * Math.sin(this.time * 2.4);
    for (const dy of [-DY, DY]) {
      const g = ctx.createRadialGradient(x, cy + dy, 0, x, cy + dy, 82);
      g.addColorStop(0, `rgba(150,180,195,${flicker})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, cy + dy, 82, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // __LENS_PART2__
}
