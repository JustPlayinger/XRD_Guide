// 校验第 1 幕波动场的物理行为（与 src/lib/wave.ts 中 recompute 相同数学路径）
import { fresnel } from '../src/lib/fresnel.ts';

const SCENE = { xMin: -3.2, xMax: 3.2, yTop: -0.95, yBot: 3.95, barHalf: 0.5, detY: 3.35 };
const GRID_W = 320;
const GRID_H = 380;

function ampAt(X: number, Y: number, lambda: number): number {
  const k = (2 * Math.PI) / lambda;
  const ekyR = Math.cos(k * Y);
  const ekyI = Math.sin(k * Y);
  if (Y < 0.02) return 1;
  const sq = Math.sqrt(2 / (lambda * Y));
  const u2 = (SCENE.barHalf - X) * sq;
  const u1 = (-SCENE.barHalf - X) * sq;
  const f2 = fresnel(u2);
  const f1 = fresnel(u1);
  const dC = f2.C - f1.C;
  const dS = f2.S - f1.S;
  const FRe = (dC + dS) / 2;
  const FIm = (dS - dC) / 2;
  const barRe = ekyR * FRe - ekyI * FIm;
  const barIm = ekyR * FIm + ekyI * FRe;
  return Math.hypot(ekyR - barRe, ekyI - barIm);
}

let ok = true;

// 1) 全网格无 NaN / 无穷大
for (const ratio of [0.1, 0.12, 0.3, 0.6, 1, 2, 4, 20]) {
  let nan = 0;
  let maxAmp = 0;
  for (let j = 0; j < GRID_H; j++) {
    const Y = SCENE.yTop + (j / (GRID_H - 1)) * (SCENE.yBot - SCENE.yTop);
    for (let i = 0; i < GRID_W; i++) {
      const X = SCENE.xMin + (i / (GRID_W - 1)) * (SCENE.xMax - SCENE.xMin);
      const a = ampAt(X, Y, ratio);
      if (!isFinite(a)) nan++;
      if (a > maxAmp) maxAmp = a;
    }
  }
  console.log(`λ/d=${ratio}  NaN=${nan}  maxAmp=${maxAmp.toFixed(3)}`);
  if (nan > 0) ok = false;
}

// 2) 阴影检验：硬 X 射线（λ/d=0.12），障碍物正后方必须显著变暗
{
  const Y = 0.4;
  const center = ampAt(0, Y, 0.12);
  const side = ampAt(2.0, Y, 0.12);
  console.log(`shadow check (λ/d=0.12, Y=${Y}): center=${center.toFixed(3)} vs side=${side.toFixed(3)}`);
  if (center > 0.35) {
    ok = false;
    console.log('SHADOW FAIL: 障碍物后方没有形成阴影');
  }
}

// 3) 可见光（λ/d=4000）：近似平面波，两侧一致、几乎无调制
{
  const c = ampAt(0, 1.0, 4000);
  const s = ampAt(2.0, 1.0, 4000);
  console.log(`visible-light check: center=${c.toFixed(4)} vs side=${s.toFixed(4)}`);
  if (Math.abs(c - s) > 1e-3 || Math.abs(c - 1) > 0.02) {
    ok = false;
    console.log('INVISIBLE FAIL: 可见光条件下场不应被障碍物明显改变');
  }
}

// 4) 趋势检验：障碍物后方的调制幅度应随 λ/d 增大而单调减小
{
  const dev = (ratio: number): number => {
    let m = 0;
    for (let i = 0; i < GRID_W; i++) {
      const X = SCENE.xMin + (i / (GRID_W - 1)) * (SCENE.xMax - SCENE.xMin);
      m = Math.max(m, Math.abs(ampAt(X, SCENE.detY, ratio) - 1));
    }
    return m;
  };
  const d1 = dev(0.1);
  const d4 = dev(4);
  const d30 = dev(30);
  console.log(`profile max|amp−1|: λ/d=0.1 → ${d1.toFixed(3)}, λ/d=4 → ${d4.toFixed(3)}, λ/d=30 → ${d30.toFixed(3)}`);
  if (!(d1 > d4 && d4 > d30)) {
    ok = false;
    console.log('TREND FAIL: 阴影幅度应随波长增长而单调减小');
  }
  if (d30 > 0.15) {
    ok = false;
    console.log('LARGE-LAMBDA FAIL: λ/d=30 时影子应基本消失');
  }
}

console.log(ok ? '\nFIELD CHECKS PASSED' : '\nFIELD CHECKS FAILED');
process.exit(ok ? 0 : 1);
