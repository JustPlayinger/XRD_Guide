/**
 * sfScene.ts —— 第 5 幕「格子 × 内容」
 *
 * 核心：晶格决定衍射斑的位置，分子内容决定每个斑的强度。
 * 结构因子 F(h,k) = Σ f_j·e^{2πi(h·x_j + k·y_j)}，斑点强度 ∝ |F|²。
 *
 * 两种模式：
 *  - 'lattice'  左：可旋转的分子；右：衍射斑网格（位置固定、亮度随分子转动而变）
 *  - 'phasor'   左：分子；右：选定 (h,k) 的相量求和链（首尾相接 → 总矢量 F）
 *
 * 诚实标注：用 2D 简单分子；散射因子统一取 1；真实晶体是 3D、原子散射因子随原子而异。
 */

const W = 640;
const H = 760;

const MOL_CX = 150;
const MOL_CY = 220;
const GRID_CX = 470;
const GRID_CY = 250;
const CELL = 64;

// 2D 简单分子：5 个原子（相对坐标）
const ATOMS: Array<[number, number]> = [
  [0, 0],
  [1.3, 0.5],
  [-0.7, 1.1],
  [1.0, -1.0],
  [-1.1, -0.5],
];
const SCALE = 46;

export type SfMode = 'lattice' | 'phasor';

export interface SfParams {
  mode: SfMode;
  /** 分子旋转角（度） */
  angle: number;
  /** phasor 模式：选择的倒易点 */
  h: number;
  k: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** 旋转后的原子坐标（单位坐标） */
function rotatedAtoms(angleDeg: number): Array<[number, number]> {
  const c = Math.cos((angleDeg * Math.PI) / 180);
  const s = Math.sin((angleDeg * Math.PI) / 180);
  return ATOMS.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

/** 结构因子 F(h,k) */
function structureFactor(h: number, k: number, angleDeg: number): { re: number; im: number } {
  let re = 0;
  let im = 0;
  for (const [x, y] of rotatedAtoms(angleDeg)) {
    const phi = 2 * Math.PI * (h * x + k * y);
    re += Math.cos(phi);
    im += Math.sin(phi);
  }
  return { re, im };
}

export class SfScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private p: SfParams = { mode: 'lattice', angle: 0, h: 1, k: 1 };
  private running = false;
  private rafId = 0;

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
    this.render();
  }

  setParams(p: Partial<SfParams>): void {
    if (p.mode !== undefined) this.p.mode = p.mode;
    if (p.angle !== undefined) this.p.angle = clamp(p.angle, -180, 180);
    if (p.h !== undefined) this.p.h = clamp(Math.round(p.h), -4, 4);
    if (p.k !== undefined) this.p.k = clamp(Math.round(p.k), -4, 4);
    this.render();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = (): void => {
      if (!this.running) return;
      this.render();
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

  private render(): void {
    const ctx = this.octx;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a1320';
    ctx.fillRect(0, 0, W, H);

    if (this.p.mode === 'lattice') this.drawLatticeMode(ctx);
    else this.drawPhasorMode(ctx);

    this.mctx.drawImage(this.off, 0, 0);
  }

  /** 画分子（左侧） */
  private drawMolecule(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 8, 24, 280, 360, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('分子（转一下看看）', 20, 48);

    const atoms = rotatedAtoms(this.p.angle);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const d = Math.hypot(atoms[i][0] - atoms[j][0], atoms[i][1] - atoms[j][1]);
        if (d < 2.1) {
          ctx.beginPath();
          ctx.moveTo(cx + atoms[i][0] * SCALE, cy + atoms[i][1] * SCALE);
          ctx.lineTo(cx + atoms[j][0] * SCALE, cy + atoms[j][1] * SCALE);
          ctx.stroke();
        }
      }
    }
    for (const [x, y] of atoms) {
      ctx.save();
      ctx.shadowColor = '#6cc4c9';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#6cc4c9';
      ctx.beginPath();
      ctx.arc(cx + x * SCALE, cy + y * SCALE, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(`旋转角 = ${this.p.angle.toFixed(0)}°`, 20, 366);
  }

  /** 衍射斑网格（右侧） */
  private drawLatticeMode(ctx: CanvasRenderingContext2D): void {
    this.drawMolecule(ctx, MOL_CX, MOL_CY);

    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 304, 24, 328, 360, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('衍射斑（位置由晶格定）', 316, 48);

    let maxI = 0;
    for (let h = -4; h <= 4; h++) {
      for (let k = -4; k <= 4; k++) {
        const f = structureFactor(h, k, this.p.angle);
        maxI = Math.max(maxI, f.re * f.re + f.im * f.im);
      }
    }
    if (maxI === 0) maxI = 1;

    for (let h = -4; h <= 4; h++) {
      for (let k = -4; k <= 4; k++) {
        const f = structureFactor(h, k, this.p.angle);
        const I = (f.re * f.re + f.im * f.im) / maxI;
        const x = GRID_CX + h * (CELL / 2);
        const y = GRID_CY + k * (CELL / 2);
        const r = 2 + 9 * Math.sqrt(I);
        ctx.save();
        ctx.globalAlpha = 0.15 + 0.85 * I;
        ctx.fillStyle = '#e8b04b';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillText('h, k 取 −4…4', GRID_CX - 40, GRID_CY + 150);
    ctx.fillStyle = 'rgba(232,176,75,0.9)';
    ctx.fillText('转分子 → 亮度大变，位置不动', 316, 366);
  }

  /** 相量求和链（右侧） */
  private drawPhasorMode(ctx: CanvasRenderingContext2D): void {
    this.drawMolecule(ctx, MOL_CX, MOL_CY);

    const px = 450;
    const py = 250;
    const scale = 26;
    ctx.fillStyle = '#0d1624';
    this.roundRect(ctx, 304, 24, 328, 360, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(`相量求和 · F(${this.p.h}, ${this.p.k})`, 316, 48);

    // 复数平面网格
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px + i * scale, py - 130);
      ctx.lineTo(px + i * scale, py + 130);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 130, py + i * scale);
      ctx.lineTo(px + 130, py + i * scale);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(px - 130, py);
    ctx.lineTo(px + 130, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py - 130);
    ctx.lineTo(px, py + 130);
    ctx.stroke();
    ctx.fillStyle = 'rgba(170,200,215,0.5)';
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.fillText('Re', px + 118, py + 12);
    ctx.fillText('Im', px + 8, py - 112);

    // 相量链
    const atoms = rotatedAtoms(this.p.angle);
    let cx = px;
    let cy = py;
    for (let i = 0; i < atoms.length; i++) {
      const [x, y] = atoms[i];
      const phi = 2 * Math.PI * (this.p.h * x + this.p.k * y);
      const ex = cx + Math.cos(phi) * scale;
      const ey = cy - Math.sin(phi) * scale;
      ctx.strokeStyle = i % 2 === 0 ? '#6cc4c9' : '#e8b04b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = i % 2 === 0 ? '#6cc4c9' : '#e8b04b';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.4, 0, Math.PI * 2);
      ctx.fill();
      cx = ex;
      cy = ey;
    }
    // 总矢量
    const f = structureFactor(this.p.h, this.p.k, this.p.angle);
    ctx.strokeStyle = '#8fd0a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + f.re * scale, py - f.im * scale);
    ctx.stroke();
    ctx.fillStyle = '#8fd0a8';
    ctx.fillText(`|F| = ${Math.hypot(f.re, f.im).toFixed(2)}`, px + 20, py + 30);
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.fillText('每个原子 = 一支箭头，首尾相接', 316, 366);
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
