/**
 * 第 5 幕 · 格子 × 内容：晶格定位置，分子定强度
 *
 * 逻辑链（只依赖已建立的：第 3–4 幕的倒易点阵与干涉）：
 *   衍射斑位置 = 晶格（倒易点阵）；衍射斑强度 = 分子内容（结构因子 |F|²）
 *   结构因子 = 每个原子的相量求和
 */

import { setupScrolly } from '../../lib/scrolly';
import { SfScene } from '../../lib/sfScene';
import type { SfMode } from '../../lib/sfScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '晶格定位置，分子定强度',
    body:
      '第 4 幕的倒易点阵告诉我们斑点会出现在哪，但它没说斑点有多亮。亮度来自分子本身。一句话分工：<strong>晶格决定斑点的位置，分子决定斑点的强度</strong>。第 3 幕结尾那句话，现在升级成了完整的二维版本。',
  },
  {
    title: '转一下分子：位置不动，亮度大变',
    body:
      '右边左侧是一个小分子，右侧是衍射斑网格。拖动「旋转角」滑块：分子转动，斑点的位置一动不动，但亮度剧烈变化。有些斑变亮，有些斑熄灭。所以每一张衍射图的强度分布，都记着分子内部原子是怎么排列的——这就是我们想从衍射图里读出来的信息。',
  },
  {
    title: '一个斑点 (h,k) 的强度从哪来',
    body:
      '任意一个斑点 (h,k)，它的振幅 F(h,k) 是所有原子的贡献加起来：每个原子贡献一支矢量，方向由它在这个斑点对应的「相位」决定，长度假设为 1。切到「相量求和」模式，拖 h、k 滑块，看右边复数平面上这串箭头怎么变化。',
  },
  {
    title: '首尾相接：|F(h,k)|² 就是斑点亮度',
    body:
      '把所有原子箭头首尾相接，从原点到终点的那条矢量就是 F(h,k)，长度就是振幅，平方就是探测器拍到的强度。有的 (h,k) 所有箭头正好排成一条线，F 很大，斑点很亮；有的箭头互相绕圈，F 很小甚至为零，斑点熄灭。这些「熄灭的斑点」，在第 6 幕会成为麻烦的根源。',
  },
];

const STEP_PRESETS: Array<{ mode?: SfMode; angle?: number; h?: number; k?: number } | null> = [
  { mode: 'lattice', angle: 0 },
  { mode: 'lattice', angle: 55 },
  { mode: 'phasor', angle: 0, h: 1, k: 1 },
  { mode: 'phasor', angle: 0, h: 3, k: 0 },
];

export function mountAct05(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-5';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 5</span>
      <h2>格子 × 内容：衍射斑的亮度藏着分子</h2>
      <p class="chapter-lead">斑点在哪，晶格说了算；斑点多亮，分子说了算。这一半信息，正是最后要拼出结构的另一半。</p>
      <div class="chapter-dep">本幕依赖：第 3–4 幕（干涉、倒易点阵）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act5-sf"></canvas>
          </div>
          <div class="figure-controls" id="act5-controls"></div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>分子是 2D 的五原子模型，散射因子统一取 1；真实晶体在 3D，散射因子随原子种类和散射角变化。「斑点位置由晶格、强度由内容决定」的结构完全一致。</p>
          </details>
          <figcaption class="figure-caption">左：分子；右：衍射斑网格或相量求和。转动分子，看斑点亮度怎么变。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act5-sf')!;
  const scene = new SfScene(canvas);
  scene.start();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) scene.start();
      else scene.pause();
    });
  });
  io.observe(canvas);

  const controls = section.querySelector<HTMLElement>('#act5-controls')!;
  const state = { mode: 'lattice' as SfMode, angle: 0, h: 1, k: 1 };

  const buildControls = (mode: SfMode): void => {
    if (mode === 'lattice') {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act5-a">旋转角</label>
          <input id="act5-a" type="range" min="-180" max="180" step="1" value="${state.angle}" />
          <output class="ctl-readout" id="act5-r">${state.angle}°</output>
        </div>`;
    } else {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act5-h">h</label>
          <input id="act5-h" type="range" min="-4" max="4" step="1" value="${state.h}" />
          <label class="ctl-label" for="act5-k">k</label>
          <input id="act5-k" type="range" min="-4" max="4" step="1" value="${state.k}" />
          <output class="ctl-readout" id="act5-r">(${state.h}, ${state.k})</output>
        </div>`;
    }
  };

  const wireControls = (mode: SfMode): void => {
    const rOut = controls.querySelector<HTMLOutputElement>('#act5-r');
    if (mode === 'lattice') {
      const aSl = controls.querySelector<HTMLInputElement>('#act5-a')!;
      aSl.addEventListener('input', () => {
        state.angle = parseInt(aSl.value, 10);
        scene.setParams({ angle: state.angle });
        if (rOut) rOut.textContent = `${state.angle}°`;
      });
    } else {
      const hSl = controls.querySelector<HTMLInputElement>('#act5-h')!;
      const kSl = controls.querySelector<HTMLInputElement>('#act5-k')!;
      const update = (): void => {
        state.h = parseInt(hSl.value, 10);
        state.k = parseInt(kSl.value, 10);
        scene.setParams({ h: state.h, k: state.k });
        if (rOut) rOut.textContent = `(${state.h}, ${state.k})`;
      };
      hSl.addEventListener('input', update);
      kSl.addEventListener('input', update);
    }
  };

  const applyMode = (mode: SfMode): void => {
    state.mode = mode;
    buildControls(mode);
    wireControls(mode);
    scene.setParams({ mode });
  };

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      const p = STEP_PRESETS[i];
      if (p) {
        if (p.mode) applyMode(p.mode);
        if (p.angle !== undefined) {
          state.angle = p.angle;
          scene.setParams({ angle: p.angle });
        }
        if (p.h !== undefined) state.h = p.h;
        if (p.k !== undefined) state.k = p.k;
        scene.setParams({ h: state.h, k: state.k });
      }
    },
  });

  applyMode('lattice');
}
