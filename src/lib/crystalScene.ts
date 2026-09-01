/**
 * crystalScene.ts —— 第 4 幕「为什么非要晶体」
 *
 * 三种模式（随步骤切换）：
 *  - 'array'      N 个点排成一列：N↑ → 衍射峰变锐、强度 ∝ N²（单分子太弱）
 *  - 'bragg'      晶面镜面反射：2d·sinθ = nλ
 *  - 'reciprocal' 实空间晶格 ↔ 倒易点阵联动（长短反比、方向垂直）
 *
 * 诚实标注：
 *  - array 模式用的是 1D 光栅公式 I(q)=|Σ e^{iq·x_j}|²，真实晶体是 3D；
 *  - bragg 模式是镜面近似（布拉格把衍射看成镜面反射是经典模型）；
 *  - reciprocal 模式是 2D 倒易，真实晶体在 3D，但「长短反比/方向垂直」的规律一致。
 */

const W = 640;
const H = 760;
const DEG = Math.PI / 180;

export type CrystalMode = 'array' | 'bragg' | 'reciprocal';

export interface CrystalParams {
  mode: CrystalMode;
  /** array 模式：点数 */
  n: number;
  /** array 模式：点间距（场景单位） */
  d: number;
  /** bragg 模式：晶面间距 */
  bd: number;
  /** bragg 模式：入射角（度） */
  thetaDeg: number;
  /** bragg 模式：波长 */
  lambda: number;
  /** reciprocal 模式：基矢长度与夹角（度） */
  aLen: number;
  bLen: number;
  angDeg: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export class CrystalScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private p: CrystalParams = {
    mode: 'array',
    n: 3,
    d: 1.0,
    bd: 1.0,
    thetaDeg: 30,
    lambda: 1.0,
    aLen: 1.4,
    bLen: 1.0,
    angDeg: 78,
  };
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

  setParams(p: Partial<CrystalParams>): void {
    if (p.mode !== undefined) this.p.mode = p.mode;
    if (p.n !== undefined) this.p.n = clamp(Math.round(p.n), 1, 50);
    if (p.d !== undefined) this.p.d = clamp(p.d, 0.5, 3.0);
    if (p.bd !== undefined) this.p.bd = clamp(p.bd, 0.5, 3.0);
    if (p.thetaDeg !== undefined) this.p.thetaDeg = clamp(p.thetaDeg, 5, 80);
    if (p.lambda !== undefined) this.p.lambda = clamp(p.lambda, 0.3, 3.0);
    if (p.aLen !== undefined) this.p.aLen = clamp(p.aLen, 0.8, 4.0);
    if (p.bLen !== undefined) this.p.bLen = clamp(p.bLen, 0.8, 4.0);
    if (p.angDeg !== undefined) this.p.angDeg = clamp(p.angDeg, 40, 140);
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

    if (this.p.mode === 'array') this.drawArray(ctx);
    else if (this.p.mode === 'bragg') this.drawBragg(ctx);
    else this.drawReciprocal(ctx);

    this.mctx.drawImage(this.off, 0, 0);
  }

  /** N 个点排成一列：衍射峰随 N 变锐、变强 */
  private drawArray(ctx: CanvasRenderingContext2D): void {
    const { n, d } = this.p;
    const cy = 150;
    const dPx = d * 52;
    const totalW = (n - 1) * dPx;
    const x0 = W / 2 - totalW / 2;

    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 8, 24, W - 16, 270, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(`一列散射点（N = ${n}）`, 20, 46);

    // 入射波（从左）
    ctx.strokeStyle = 'rgba(108,196,201,0.2)';
    for (let i = 0; i < 6; i++) {
      const x = ((this.time * 50 + i * 26) % 90) - 40;
      if (x < x0 - 30) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, 280);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.fillText('入射平面波 →', 12, 70);

    // 点列
    if (n === 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('N = 1：一个分子', W / 2 - 60, cy + 34);
    }
    for (let j = 0; j < n; j++) {
      const x = x0 + j * dPx;
      ctx.save();
      ctx.shadowColor = '#6cc4c9';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#6cc4c9';
      ctx.beginPath();
      ctx.arc(x, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 点间距标注
    if (n > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x0, cy + 26);
      ctx.lineTo(x0 + dPx, cy + 26);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px ui-monospace, Consolas, monospace';
      ctx.fillText('d', x0 + dPx / 2 - 5, cy + 40);
    }

    // 下部：远场强度（q = 2π sinθ/λ）
    const PLOT_X0 = 60;
    const PLOT_X1 = W - 30;
    const PLOT_TOP = 420;
    const PLOT_BOT = 720;
    const qmax = 4; // q·d 的范围
    const IOf = (qd: number): number => {
      const half = Math.sin((n * qd) / 2) / Math.sin(qd / 2 + 1e-9);
      return (half * half) / Math.max(1, n * n); // 归一化到 N²
    };

    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 8, 404, W - 16, 336, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(`远场强度（归一化到 N²）· 峰高 ∝ ${n}²`, 20, 424);

    const xOf = (qd: number): number => PLOT_X0 + ((qd + qmax) / (2 * qmax)) * (PLOT_X1 - PLOT_X0);
    const yOf = (v: number): number => PLOT_BOT - v * (PLOT_BOT - PLOT_TOP) * 0.92;

    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i <= 4; i++) {
      const y = PLOT_TOP + ((PLOT_BOT - PLOT_TOP) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(PLOT_X0, y);
      ctx.lineTo(PLOT_X1, y);
      ctx.stroke();
    }

    // 曲线
    ctx.beginPath();
    for (let qd = -qmax; qd <= qmax; qd += 0.02) {
      const I = IOf(qd);
      const x = xOf(qd);
      const y = yOf(I);
      if (qd === -qmax) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#e8b04b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 主峰标注
    ctx.fillStyle = 'rgba(170,200,215,0.8)';
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.fillText(`主峰半宽 ∝ 1/N`, PLOT_X0 + 10, PLOT_TOP + 24);
    ctx.fillText('轴：q·d', PLOT_X1 - 60, PLOT_BOT + 14);
  }

  /** 布拉格镜面：2d·sinθ = nλ */
  private drawBragg(ctx: CanvasRenderingContext2D): void {
    const { bd, thetaDeg, lambda } = this.p;
    const cy = 300;
    const dPx = bd * 90;

    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 8, 24, W - 16, 716, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('布拉格「镜面反射」模型：2d·sinθ = nλ', 20, 46);

    // 晶面（水平平行线）
    ctx.strokeStyle = 'rgba(108,196,201,0.5)';
    ctx.lineWidth = 2;
    const planes = 6;
    for (let i = 0; i < planes; i++) {
      const y = cy + (i - (planes - 1) / 2) * dPx;
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.lineTo(W - 90, y);
      ctx.stroke();
    }
    // 晶面间距标注
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(W - 130, cy);
    ctx.lineTo(W - 130, cy + dPx);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText('d', W - 120, cy + dPx / 2 + 4);

    // 入射与反射光线（相对晶面法线对称）
    const theta = thetaDeg * DEG;
    const hit = { x: W / 2, y: cy };
    const rayLen = 240;
    const inDir = { x: -Math.sin(theta), y: -Math.cos(theta) };
    const outDir = { x: Math.sin(theta), y: -Math.cos(theta) };
    const start = { x: hit.x - inDir.x * rayLen, y: hit.y - inDir.y * rayLen };
    const end = { x: hit.x + outDir.x * rayLen, y: hit.y + outDir.y * rayLen };

    ctx.strokeStyle = '#e8b04b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(hit.x, hit.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // 法线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(hit.x, hit.y - 120);
    ctx.lineTo(hit.x, hit.y + 120);
    ctx.stroke();
    ctx.setLineDash([]);

    // 角度标注
    ctx.fillStyle = '#e8b04b';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText(`θ = ${thetaDeg.toFixed(0)}°`, hit.x + 24, hit.y - 44);

    // 下层晶面反射路径差标注
    const nextHit = { x: W / 2, y: cy + dPx };
    ctx.strokeStyle = 'rgba(232,176,75,0.4)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(start.x + Math.sin(theta) * dPx * 2, start.y - Math.cos(theta) * dPx * 2);
    ctx.lineTo(nextHit.x, nextHit.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2d sinθ 结果
    const twoDSin = 2 * bd * Math.sin(theta);
    const nOrder = twoDSin / lambda;
    const satisfied = Math.abs(nOrder - Math.round(nOrder)) < 0.05;
    ctx.fillStyle = satisfied ? '#8fd0a8' : '#e8b04b';
    ctx.font = '14px ui-monospace, Consolas, monospace';
    ctx.fillText(`2d·sinθ = ${twoDSin.toFixed(2)}`, 30, 96);
    ctx.fillText(`2d·sinθ / λ = ${nOrder.toFixed(2)}`, 30, 118);
    ctx.fillText(
      satisfied ? '✓ 是整数倍：产生 n 阶反射' : '不是整数倍：两列反射波不同相，抵消',
      30,
      142,
    );
    ctx.fillText(`λ = ${lambda.toFixed(2)}   d = ${bd.toFixed(2)}`, 30, 170);
  }

  /** 实空间晶格 ↔ 倒易点阵联动 */
  private drawReciprocal(ctx: CanvasRenderingContext2D): void {
    const { aLen, bLen, angDeg } = this.p;
    const ang = angDeg * DEG;
    const a = { x: aLen * 42, y: 0 };
    const b = { x: bLen * 42 * Math.cos(ang), y: bLen * 42 * Math.sin(ang) };
    const det = a.x * b.y - a.y * b.x;
    const scale = (W / 2) / 4.2;
    const as = { x: (b.y / det) * scale, y: (-b.x / det) * scale };
    const bs = { x: (-a.y / det) * scale, y: (a.x / det) * scale };

    const drawLattice = (
      ox: number,
      oy: number,
      e1: { x: number; y: number },
      e2: { x: number; y: number },
      range: number,
      color: string,
    ): void => {
      for (let i = -range; i <= range; i++) {
        for (let j = -range; j <= range; j++) {
          const x = ox + e1.x * i + e2.x * j;
          const y = oy + e1.y * i + e2.y * j;
          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = 5;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    };

    // 左：实空间
    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 8, 24, W / 2 - 16, 716, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('实空间晶格', 26, 50);
    drawLattice(W / 4 + 30, 300, a, b, 3, '#6cc4c9');
    this.drawArrow(ctx, W / 4 + 30, 300, W / 4 + 30 + a.x, 300 + a.y, '#6cc4c9', 'a');
    this.drawArrow(ctx, W / 4 + 30, 300, W / 4 + 30 + b.x, 300 + b.y, '#8fd0a8', 'b');
    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText(`|a|=${aLen.toFixed(1)}  |b|=${bLen.toFixed(1)}  夹角=${angDeg.toFixed(0)}°`, 26, 700);

    // 右：倒易
    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, W / 2 + 8, 24, W / 2 - 16, 716, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.fillText('倒易点阵（衍射斑的位置）', W / 2 + 26, 50);
    drawLattice((W * 3) / 4 - 30, 300, as, bs, 4, '#e8b04b');
    this.drawArrow(ctx, (W * 3) / 4 - 30, 300, (W * 3) / 4 - 30 + as.x, 300 + as.y, '#e8b04b', 'a*');
    this.drawArrow(ctx, (W * 3) / 4 - 30, 300, (W * 3) / 4 - 30 + bs.x, 300 + bs.y, '#f0c98a', 'b*');
    ctx.fillStyle = 'rgba(232,176,75,0.9)';
    ctx.fillText('实空间越长 → 倒易越密', W / 2 + 26, 700);
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    label: string,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x1, y1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(label, (x0 + x1) / 2 + 6, (y0 + y1) / 2 - 6);
  }

  private roundRect(
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
}
