/**
 * distortionScene.ts —— 第 9 幕「晶体不是细胞」
 *
 * 三种模式：
 *  - 'average'  时空平均：一群抖动/无序的分子叠加成一条密度 → B 因子
 *  - 'packing'  堆积接触：对称邻居把 loop 压进接触界面 → 非生理构象
 *  - 'damage'   辐射损伤：剂量↑ → 二硫键与金属位点密度消失/被还原
 *
 * 诚实标注：分子是 2D 示意图形；辐射损伤用「密度淡出 + 颜色变化」示意，
 * 真实损伤是光电子化学过程。三类失真的 PDB 痕迹（B 因子/REMARK 465/金属还原）都是真实的。
 */

const W = 640;
const H = 760;

export type DistortionMode = 'average' | 'packing' | 'damage';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export class DistortionScene {
  private off: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D;
  private mode: DistortionMode = 'average';
  private jitter = 3;
  private dose = 0;
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

  setMode(m: DistortionMode): void {
    this.mode = m;
  }
  setJitter(v: number): void {
    this.jitter = clamp(Math.round(v), 1, 10);
  }
  setDose(v: number): void {
    this.dose = clamp(v, 0, 1);
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

    if (this.mode === 'average') this.drawAverage(ctx);
    else if (this.mode === 'packing') this.drawPacking(ctx);
    else this.drawDamage(ctx);

    this.mctx.drawImage(this.off, 0, 0);
  }

  /** 时空平均：分子越乱，平均密度越糊 */
  private drawAverage(ctx: CanvasRenderingContext2D): void {
    const cx = 150;
    const cy = 300;
    const atoms: Array<[number, number]> = [
      [0, 0],
      [34, -18],
      [58, 12],
      [26, 40],
      [-14, 26],
      [-30, -12],
      [8, -34],
    ];
    const jit = this.jitter * 2.4;
    const sigma = 3 + jit * 0.55;

    ctx.fillStyle = '#0d1624';
    ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '13px ui-monospace, Consolas, monospace';
    ctx.fillText('时空平均：10¹⁵ 个分子的「合影」', 20, 34);
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.fillText(`无序程度（≈ B 因子）=${this.jitter}`, 20, 58);

    for (const [ax, ay] of atoms) {
      const g = ctx.createRadialGradient(cx + ax, cy + ay, 0, cx + ax, cy + ay, sigma * 3);
      g.addColorStop(0, 'rgba(108,196,201,0.75)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx + ax, cy + ay, sigma * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const [ax, ay] of atoms) {
      const ox = (Math.sin(this.time * 3 + ax) * 0.5 + 0.5) * 2 - 1;
      const oy = (Math.cos(this.time * 2.7 + ay) * 0.5 + 0.5) * 2 - 1;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#e8b04b';
      ctx.beginPath();
      ctx.arc(cx + ax + ox * jit, cy + ay + oy * jit, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(232,176,75,0.9)';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('无序↑ → 密度越糊 → B 因子越大', 20, 700);
    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.fillText('PDB 痕迹：ATOM 行的 B 因子列；柔性 loop 直接消失 → REMARK 465', 20, 722);
  }

  /** 堆积接触：对称邻居把 loop 压进界面 */
  private drawPacking(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0d1624';
    ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '13px ui-monospace, Consolas, monospace';
    ctx.fillText('晶体堆积：分子被对称邻居围住', 20, 34);
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.fillText('不对称单元 ≠ 生物学组装体', 20, 58);

    const mol = (x: number, y: number, color: string): void => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 18, y - 12);
      ctx.quadraticCurveTo(x + 44, y - 28, x + 50, y - 8);
      ctx.stroke();
    };

    mol(320, 330, 'rgba(108,196,201,0.85)');
    mol(320, 170, 'rgba(108,196,201,0.45)');
    mol(320, 490, 'rgba(108,196,201,0.45)');
    mol(140, 330, 'rgba(108,196,201,0.45)');
    mol(500, 330, 'rgba(108,196,201,0.45)');

    ctx.fillStyle = '#e8b04b';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('这个 loop 正被两个邻居夹在中间，', 20, 700);
    ctx.fillText('在晶体里它只能摆出被挤压的姿势——不一定是溶液里的姿势。', 20, 722);
  }

  /** 辐射损伤：剂量↑ → 二硫键消失、金属被还原 */
  private drawDamage(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0d1624';
    ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '13px ui-monospace, Consolas, monospace';
    ctx.fillText(`辐射损伤 · 剂量 = ${Math.round(this.dose * 100)}%`, 20, 34);
    ctx.fillStyle = 'rgba(170,200,215,0.6)';
    ctx.fillText('X 射线一边拍照，一边破坏样品', 20, 58);

    const cx = 320;
    const cy = 300;
    const chain: Array<[number, number]> = [
      [cx - 110, cy - 40],
      [cx - 60, cy - 10],
      [cx, cy - 30],
      [cx + 60, cy],
      [cx + 110, cy - 20],
    ];
    ctx.strokeStyle = 'rgba(170,200,215,0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(chain[0][0], chain[0][1]);
    for (const [x, y] of chain) ctx.lineTo(x, y);
    ctx.stroke();

    // 二硫键（两个 S），剂量大了就断开
    const s1 = [cx - 40, cy + 40];
    const s2 = [cx + 40, cy + 40];
    const ssAlpha = 1 - this.dose * 0.95;
    ctx.globalAlpha = Math.max(0.05, ssAlpha);
    ctx.strokeStyle = '#e8b04b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s1[0], s1[1]);
    ctx.lineTo(s2[0], s2[1]);
    ctx.stroke();
    ctx.fillStyle = '#f0c98a';
    for (const [x, y] of [s1, s2]) {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 金属位点：剂量↑ 颜色变淡
    const fe = [cx, cy + 70];
    const feAlpha = 1 - this.dose * 0.7;
    ctx.globalAlpha = Math.max(0.1, feAlpha);
    ctx.fillStyle = '#c96a5c';
    ctx.beginPath();
    ctx.arc(fe[0], fe[1], 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(232,176,75,0.9)';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText(
      this.dose > 0.5 ? '二硫键断了，金属被还原——你看到的活性位点，可能是被照坏的。' : '低剂量：结构还完整',
      20,
      700,
    );
    ctx.fillStyle = 'rgba(170,200,215,0.7)';
    ctx.fillText('PDB 痕迹：氧化态异常、金属配位不完整，往往就是辐射损伤', 20, 722);
  }
}
