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
      '「看见」没有想象中那么理所当然。严格说，看见等于：波碰到物体，被改变，改变后的波被我们读到。物体自己不发光（先假设），它只是给路过的波留下痕迹。所以问题变成：什么样的波，才会被一个小小的物体改变？右边这个实验，一列平面波从上方下来，撞上一个宽度 d 的障碍物（金色方块）。把「波长 / 目标尺寸」滑块从大到小拖一遍，看障碍物身后的影子。',
  },
  {
    title: '波会绕过比自己小的东西',
    body:
      '波长很长（λ ≫ d，拖到最右端 λ≈30×d）时，影子又浅又宽，几乎没了，波从两侧绕过去，等于没看见这个障碍物。波长缩短到和 d 差不多甚至更短，影子重新变得锐利，边缘还带一圈圈条纹。结论一句话：<strong>可分辨的最小尺度，和波长一个量级</strong>。眼睛、光学显微镜、X 射线，都逃不出这条。切到「时间平均强度」，看探测器（黄虚线）到底会记下什么。',
  },
  {
    title: '我们的目标有多小？',
    body:
      'C–C 键约 1.54 Å，碳原子直径约 1.7 Å。想看见原子，波长得在 1 Å 附近。可见光呢？380–700 nm，就是 3800–7000 Å，比一个键大三四千倍。点「可见光」预设：波径直穿过去，什么信息都没带回来。所以光学显微镜无论标称放大多少倍，都看不到单个原子。',
  },
  {
    title: 'X 射线：波长对了，但麻烦才开始',
    body:
      'X 射线波长 0.1–1 Å，和原子尺度对上了。点「硬 X 射线」，影子终于出现。但注意一个细节：X 射线在物质里的折射率接近 1，穿过材料几乎不拐弯。这句话的后果很严重：<strong>X 射线没法被透镜聚焦</strong>。下一幕把「看见」拆成两半，看看 X 射线世界里缺的是哪一半。',
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
      <p class="chapter-lead">要让 PDB 那些数字有根，得先回答一个更基础的问题：一个东西凭什么能被看见？答案会顺带解释，为什么非得用 X 射线不可。</p>
      <div class="chapter-dep">本幕依赖：波、波长、障碍物、显微镜 —— 都是常识。</div>
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
          <figcaption class="figure-caption">一列平面波穿过宽 d 的障碍物。d 固定（当它是 C–C 键），滑块改 λ/d。波动动画看瞬时波面，时间平均强度是探测器真正会记下的东西。</figcaption>
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
