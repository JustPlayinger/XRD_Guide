/**
 * interferenceScene.ts —— 第 3 幕「斑点从哪来」
 *
 * 上半：两个散射中心 P₁、P₂（间距 d），平面波从左侧入射，
 *       在远场角度 θ 处放置探测器，画出两条路径与路程差 Δ = d·sinθ。
 * 下半：远场强度曲线 I(θ) = cos²(π·d·sinθ/λ)。
 *       单点源只有平滑分布（虚线参考），两个点源产生明暗相间的条纹。
 *
 * 诚实标注：上半的「路程差」用了远场近似（真实路径差在 d 远小于观测距离时约等于 d·sinθ）；
 * 强度曲线用的正是这个远场公式。
 */

const W = 640;
const H = 760;

const UPPER_TOP = 24;
const UPPER_H = 336;
const UPPER_CY = 190;

const PLOT_X0 = 64;
const PLOT_X1 = W - 40;
const PLOT_TOP = 428;
const PLOT_BOT = 700;

const SRC_X = 130;
const FAR_R = 268;

const DEG = Math.PI / 180;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export interface InterfParams {
  /** 两个散射中心间距（场景单位，1 ≈ C–C 键） */
  d: number;
  /** 波长（场景单位） */
  lambda: number;
  /** 探测器角度（度） */
  thetaDeg: number;
}

export class InterferenceScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private p: InterfParams = { d: 1.0, lambda: 1.0, thetaDeg: 0 };
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

  setParams(p: Partial<InterfParams>): void {
    if (p.d !== undefined) this.p.d = clamp(p.d, 0.6, 4.0);
    if (p.lambda !== undefined) this.p.lambda = clamp(p.lambda, 0.3, 3.0);
    if (p.thetaDeg !== undefined) this.p.thetaDeg = clamp(p.thetaDeg, -75, 75);
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

    this.drawUpper(ctx);
    this.drawPlot(ctx);

    this.mctx.drawImage(this.off, 0, 0);
  }

    private drawUpper(ctx: CanvasRenderingContext2D): void {
    const { d, lambda, thetaDeg } = this.p;
    const cy = UPPER_CY;
    const dPx = d * 40; // 场景单位 → 像素
    const P1 = { x: SRC_X, y: cy - dPx / 2 };
    const P2 = { x: SRC_X, y: cy + dPx / 2 };
    const spacing = lambda * 26;

    // 面板底
    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 8, UPPER_TOP, W - 16, UPPER_H, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();

    // 入射平面波（从左侧进入）
    ctx.strokeStyle = 'rgba(108,196,201,0.25)';
    ctx.lineWidth = 1;
    for (let n = 0; n < 8; n++) {
      const x = ((this.time * 55 + n * spacing) % (SRC_X + 30)) - 10;
      if (x < SRC_X) {
        ctx.beginPath();
        ctx.moveTo(x, UPPER_TOP + 12);
        ctx.lineTo(x, UPPER_TOP + UPPER_H - 12);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('入射平面波 →', 12, UPPER_TOP + 24);

    // 散射波前（P1 青、P2 琥珀）
    this.drawRings(ctx, P1, lambda, '#6cc4c9');
    this.drawRings(ctx, P2, lambda, '#e8b04b');

    // 散射中心
    this.drawSource(ctx, P1, '#6cc4c9');
    this.drawSource(ctx, P2, '#e8b04b');
    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText('P₁', P1.x - 34, P1.y - 5);
    ctx.fillText('P₂', P2.x - 34, P2.y + 14);

    // 间距标注
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(P1.x - 26, P1.y);
    ctx.lineTo(P2.x - 26, P2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(`d = ${d.toFixed(2)}`, P2.x - 30, (P1.y + P2.y) / 2 + 26);

    // 远场探测器
    const M = { x: SRC_X, y: cy };
    const theta = thetaDeg * DEG;
    const D = { x: M.x + FAR_R * Math.cos(theta), y: M.y + FAR_R * Math.sin(theta) };

    ctx.strokeStyle = 'rgba(232,176,75,0.3)';
    ctx.beginPath();
    ctx.arc(M.x, M.y, FAR_R, -75 * DEG, 75 * DEG);
    ctx.stroke();

    // 两条路径
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 5]);
    for (const [P, color] of [
      [P1, '#6cc4c9'],
      [P2, '#e8b04b'],
    ] as Array<[{ x: number; y: number }, string]>) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(D.x, D.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    // 探测器
    ctx.save();
    ctx.shadowColor = '#e8b04b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#e8b04b';
    ctx.beginPath();
    ctx.arc(D.x, D.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 路程差标注
    const pathDiff = d * Math.sin(theta);
    const phaseDiff = (2 * Math.PI * pathDiff) / lambda;
    ctx.fillStyle = 'rgba(232,176,75,0.95)';
    ctx.font = '13px ui-monospace, Consolas, monospace';
    const labelX = Math.min(Math.max(D.x - 130, 20), W - 200);
    const labelY = Math.min(Math.max(D.y, UPPER_TOP + 40), UPPER_TOP + UPPER_H - 24);
    ctx.fillText(`Δ = d·sinθ = ${pathDiff.toFixed(3)}`, labelX, labelY);
    ctx.fillText(`相位差 = 2πΔ/λ = ${phaseDiff.toFixed(2)} rad`, labelX, labelY + 18);
  }

  private drawRings(
    ctx: CanvasRenderingContext2D,
    P: { x: number; y: number },
    lambda: number,
    color: string,
  ): void {
    const spacing = lambda * 26;
    const maxR = FAR_R + 20;
    ctx.save();
    ctx.beginPath();
    ctx.rect(8, UPPER_TOP, W - 16, UPPER_H);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.2;
    for (let n = 0; n < 16; n++) {
      const r = (this.time * 60 + n * spacing) % maxR;
      ctx.beginPath();
      ctx.arc(P.x, P.y, Math.max(1, r), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSource(ctx: CanvasRenderingContext2D, p: { x: number; y: number }, color: string): void {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlot(ctx: CanvasRenderingContext2D): void {
    const { d, lambda, thetaDeg } = this.p;
    const theta = thetaDeg * DEG;
    const xOf = (deg: number): number =>
      PLOT_X0 + ((deg + 80) / 160) * (PLOT_X1 - PLOT_X0);
    const yOf = (v: number): number => PLOT_BOT - v * (PLOT_BOT - PLOT_TOP) * 0.22;

    // 面板底
    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 8, 404, W - 16, 336, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('远场强度  I(θ)  （横轴：观察角 θ）', 20, 424);

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = yOf(i / 4);
      ctx.beginPath();
      ctx.moveTo(PLOT_X0, y);
      ctx.lineTo(PLOT_X1, y);
      ctx.stroke();
    }

    // 单点源参考线（平滑，无条纹）
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(PLOT_X0, yOf(1));
    ctx.lineTo(PLOT_X1, yOf(1));
    ctx.stroke();
    ctx.setLineDash([]);

    // 强度曲线
    ctx.beginPath();
    for (let deg = -80; deg <= 80; deg += 0.5) {
      const I = Math.cos((Math.PI * d * Math.sin(deg * DEG)) / lambda) ** 2;
      const x = xOf(deg);
      const y = yOf(I);
      if (deg === -80) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#e8b04b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 亮纹标注（d·sinθ = nλ）
    ctx.fillStyle = 'rgba(170,200,215,0.8)';
    ctx.font = '10px ui-monospace, Consolas, monospace';
    for (let n = -4; n <= 4; n++) {
      const s = (n * lambda) / d;
      if (Math.abs(s) <= 1) {
        const deg = Math.asin(s) / DEG;
        ctx.fillText(`n=${n}`, xOf(deg) - 8, yOf(1) - 14);
      }
    }

    // 当前 θ
    const curX = xOf(thetaDeg);
    ctx.strokeStyle = 'rgba(108,196,201,0.8)';
    ctx.beginPath();
    ctx.moveTo(curX, PLOT_TOP - 2);
    ctx.lineTo(curX, PLOT_BOT);
    ctx.stroke();
    ctx.fillStyle = '#6cc4c9';
    ctx.beginPath();
    ctx.arc(curX, yOf(Math.cos((Math.PI * d * Math.sin(theta)) / lambda) ** 2), 4, 0, Math.PI * 2);
    ctx.fill();

    // 轴标注
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText('−80°', PLOT_X0 - 2, PLOT_BOT + 14);
    ctx.fillText('0°', xOf(0) - 8, PLOT_BOT + 14);
    ctx.fillText('+80°', PLOT_X1 - 20, PLOT_BOT + 14);
    ctx.fillText('单点源（虚线）：平滑', PLOT_X1 - 165, 442);
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
