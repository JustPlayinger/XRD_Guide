/**
 * 第 1 幕 · 看见需要波：波长决定可分辨尺度
 *
 * 叙事目标：让读者从「波」的第一性原理推出——为什么看清原子必须用 X 射线。
 * 逻辑链：看见 = 波被物体改变并被读到 → 波会绕过比自己小的东西（实验）
 *         → 原子尺寸 ~1.5 Å，可见光 ~5500 Å，差了 4000 倍 → 只能用 X 射线
 *         → 但 X 射线折射率≈1，没有透镜（埋下第 2 幕的钩子）。
 *
 * 本幕只使用已建立的概念：波、波长、障碍物、Huygens 原理（视觉上建立）。
 */

import { setupScrolly } from '../../lib/scrolly';
import { DiffractionScene } from '../../lib/wave';
import type { WaveMode } from '../../lib/wave';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '「看见」到底是什么意思？',
    body:
      '我们把「看见」想得太理所当然。严格地说：看见 = 波碰到物体 → 波被改变 → 被改变的波被我们读到。物体自身不发光，它只是给路过的波留下痕迹——相位、方向、强度。于是问题变成：<strong>什么样的波，才会被一个小小的物体改变？</strong>右侧实验：一列平面波从上向下传播，撞上一个宽度 d 的障碍物（金色方块）。请把「波长 / 目标尺寸」滑块从大到小拖一遍，观察障碍物身后的影子。',
  },
  {
    title: '波会绕过比自己小的东西',
    body:
      '把滑块左右拖动：波长很长（λ ≫ d，拖到最右端 λ ≈ 30×d）时，障碍物身后的影子变得又浅又宽，几乎消失——波像没碰到东西一样从两侧绕过，没有「看见」它。波长缩短到与 d 相当或更短时，影子重新变得锐利清晰，边缘还带一圈圈衍射条纹。<strong>结论：可分辨的最小尺度 ≈ 波长。</strong>任何用波成像的装置——眼睛、光学显微镜、X 射线——都逃不开这条物理下限。再切到「时间平均强度」模式，看看探测器（黄虚线）最终会记录到什么。',
  },
  {
    title: '我们的目标有多小？',
    body:
      '化学键 C–C ≈ 1.54 Å，碳原子直径 ≈ 1.7 Å。要「看见」原子，波长必须到 1 Å 的量级。而可见光是 380–700 nm，也就是 3800–7000 Å——比一个键长大了约 4000 倍。点一下「可见光」预设：目标身后空空如也，波径直穿过，<strong>没有带回任何关于它的信息</strong>。这也是为什么任何光学显微镜——哪怕号称放大一万倍——都注定看不到单个原子。',
  },
  {
    title: 'X 射线：波长对了，但麻烦才开始',
    body:
      'X 射线波长 0.1–1 Å，与原子尺度匹配。点「硬 X 射线」预设：影子终于出现了。但请记住一个细节：X 射线在物质里的折射率几乎等于 1，也就是说它穿过物质时几乎不拐弯。这句话的后果非常严重——<strong>X 射线没法被透镜聚焦</strong>。下一幕我们把「看见」拆成两半（散射 + 聚焦），看看 X 射线世界里缺的到底是哪一半。',
  },
];

/** 每步自动演示的参数（null = 保持用户当前选择） */
const STEP_PRESETS: Array<{
  ratio?: number;
  invisible?: boolean;
  mode?: WaveMode;
} | null> = [
  null,
  { ratio: 0.6, mode: 'ripple' },
  { invisible: true, mode: 'intensity' },
  { ratio: 0.12, mode: 'ripple' },
];

/** 滑块值 v∈[0,100] ↔ λ/d∈[0.1, 30]（对数刻度，覆盖「硬 X 射线 → 接近不可见」） */
function sliderToRatio(v: number): number {
  return Math.pow(10, -1 + 2.477 * (v / 100));
}

function ratioToSlider(r: number): number {
  return Math.max(0, Math.min(100, ((Math.log10(r) + 1) / 2.477) * 100));
}

export function mountAct01(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-1';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 1</span>
      <h2>看见需要波：波长决定可分辨的尺度</h2>
      <p class="chapter-lead">在追究 PDB 那些数字之前，先回到物理最底层：一个物体凭什么能被「看见」？答案会让「为什么非用 X 射线不可」变成一件必然的事。</p>
      <div class="chapter-dep">本幕依赖：波、波长、障碍物、显微镜 —— 读者已知概念。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act1-wave"></canvas>
          </div>
          <div class="figure-controls">
            <div class="ctl-row">
              <label class="ctl-label" for="act1-lambda">波长 / 目标尺寸（λ / d）</label>
              <input id="act1-lambda" type="range" min="0" max="100" step="0.1" value="31.4" />
              <output id="act1-readout" class="ctl-readout">λ ≈ 0.60 × d</output>
            </div>
            <div class="ctl-row ctl-row--presets">
              <button class="btn-chip" data-ratio="0.12">硬 X 射线</button>
              <button class="btn-chip" data-ratio="0.6">软 X 射线</button>
              <button class="btn-chip" data-ratio="2.5">极紫外</button>
              <button class="btn-chip" data-ratio="4000">可见光</button>
            </div>
            <div class="ctl-row">
              <button class="btn-chip" data-mode="ripple">波动动画</button>
              <button class="btn-chip" data-mode="intensity">时间平均强度</button>
            </div>
          </div>
          <figcaption class="figure-caption">一列平面波穿过宽度 d 的障碍物。d 固定（代表一个 C–C 键），滑块改变 λ / d 比值。波动动画 = 瞬时波面；时间平均强度 = 探测器最终记录到的东西。</figcaption>
        </figure>
      </div>
      <div class="steps">
        ${STEPS.map(
          (s, i) => `
          <article class="step" data-step="${i}">
            <h3><span class="step-num">${i + 1}</span>${s.title}</h3>
            <p>${s.body}</p>
          </article>`,
        ).join('')}
      </div>
    </div>
  `;
  parent.appendChild(section);

  const canvas = section.querySelector<HTMLCanvasElement>('#act1-wave')!;
  const scene = new DiffractionScene(canvas);
  scene.start();

  // 暂停/恢复渲染：画布滚出视口时省电
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) scene.start();
      else scene.pause();
    });
  });
  io.observe(canvas);

  const slider = section.querySelector<HTMLInputElement>('#act1-lambda')!;
  const readout = section.querySelector<HTMLOutputElement>('#act1-readout')!;
  const chips = Array.from(section.querySelectorAll<HTMLButtonElement>('.btn-chip'));

  // 章节内维护当前状态，避免依赖场景内部私有字段
  const state = { ratio: 0.6, invisible: false, mode: 'ripple' as WaveMode };

  const syncControls = (): void => {
    slider.value = String(ratioToSlider(state.ratio));
    readout.textContent = state.invisible
      ? 'λ ≈ 3700×d —— 波径直穿过，无影'
      : `λ ≈ ${state.ratio.toFixed(2)}×d`;
    chips.forEach((c) => {
      const r = c.getAttribute('data-ratio');
      const m = c.getAttribute('data-mode');
      const active =
        (r !== null && Number(r) === (state.invisible ? 4000 : state.ratio)) ||
        (m !== null && m === state.mode);
      c.classList.toggle('active', active);
    });
  };

  const applyParams = (p: { ratio?: number; invisible?: boolean; mode?: WaveMode }): void => {
    if (p.ratio !== undefined) state.ratio = p.ratio;
    if (p.invisible !== undefined) state.invisible = p.invisible;
    if (p.mode !== undefined) state.mode = p.mode;
    scene.setParams({ lambdaRatio: state.ratio, invisible: state.invisible, mode: state.mode });
    syncControls();
  };

  slider.addEventListener('input', () => {
    state.ratio = sliderToRatio(parseFloat(slider.value));
    state.invisible = false;
    scene.setParams({ lambdaRatio: state.ratio, invisible: false });
    syncControls();
  });

  chips.forEach((c) => {
    c.addEventListener('click', () => {
      const ratioRaw = c.getAttribute('data-ratio');
      const modeRaw = c.getAttribute('data-mode');
      if (ratioRaw !== null) {
        const ratio = parseFloat(ratioRaw);
        applyParams({ ratio, invisible: ratio >= 100 });
      } else if (modeRaw !== null) {
        applyParams({ mode: modeRaw === 'intensity' ? 'intensity' : 'ripple' });
      }
    });
  });

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      const p = STEP_PRESETS[i];
      if (p) {
        applyParams({ ratio: p.ratio ?? 0.6, invisible: p.invisible ?? false, mode: p.mode ?? 'ripple' });
      }
    },
  });
}
