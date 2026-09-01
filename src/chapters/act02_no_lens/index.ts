/**
 * 第 2 幕 · 透镜的缺席
 *
 * 逻辑链（只依赖已建立的：第 1 幕的波/散射，读者常识的透镜与折射）：
 *   看见 = 散射（信息出发） + 聚焦（信息重新聚拢）
 *   → 可见光有透镜：折射率 n≈1.5，能让来自同一点的波在像点同相叠加
 *   → X 射线对几乎所有物质 n≈1，无法拐弯，没有透镜可造
 *   → 探测器只能记录强度，相位在那一刻就丢了
 */

import { setupScrolly } from '../../lib/scrolly';
import { LensScene } from '../../lib/lensScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '「看见」其实是两件事',
    body:
      '看见不是一步到位的。第一步，波碰到物体，被散射出去，信息从物体上「出发」；第二步，散出去的波被重新收集、重新聚拢，才变成一张像。眼睛的晶状体、相机的镜头、放大镜，干的都是第二步。它们本质上都是同一台机器：<strong>把波按相位重新相加</strong>。',
  },
  {
    title: '可见光：透镜为什么有用',
    body:
      '透镜靠折射工作：光进入玻璃后拐弯，出来再拐一次。设计好的透镜能让来自同一个点的波，走不同的路径却同时抵达同一个像点——波峰对着波峰，叠加成亮点。来自另一个点的波，在另一个像点叠加。于是物体上的每个点，都在像上留一个对应点，这就是「像」。看右边上半部分：P₁、P₂ 两个散射中心，各自在屏上聚成一个亮点。',
  },
  {
    title: 'X 射线：没有透镜可造',
    body:
      '透镜的前提是「折射率明显不是 1」。玻璃对可见光 n≈1.5，所以能拐弯。但 X 射线对几乎所有物质的折射率都约等于 1——波穿过去，方向几乎不变。不能拐弯，就没法把散开的波重新聚回一点。看右边下半部分：拖 n 滑块，n≈1.0 时屏上只有一片弥散的光，分不清 P₁ 和 P₂；把 n 拉到 1.5，假设的透镜能把像「救回来」。现实里，X 射线永远停在 n≈1.0。',
  },
  {
    title: '手里只剩强度，丢的是相位',
    body:
      '没有透镜，X 射线散射后径直飞到探测器。探测器只记一件事：光有多强。而波峰波谷的相对位置——也就是相位——在记录的那一刻就没了。一张只有强度、没有相位的图，没法直接还原成物体的像。下一幕，我们从最简单的两个散射体开始，看它们到底在探测器上留下了什么，以及相位是怎么藏进那张图里的。',
  },
];

/** 每步自动演示的折射率（null = 保持用户当前选择） */
const STEP_PRESETS: Array<{ n: number } | null> = [
  { n: 1.5 },
  { n: 1.5 },
  { n: 1.0 },
  { n: 1.0 },
];

export function mountAct02(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-2';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 2</span>
      <h2>透镜的缺席：X 射线世界里缺的那一半</h2>
      <p class="chapter-lead">第 1 幕证明了波长该用 X 射线。但光有波长还不够，你还需要把它聚回一张像。而这一半，X 射线世界里不存在。</p>
      <div class="chapter-dep">本幕依赖：第 1 幕（波、散射）；透镜与折射（常识）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act2-lens"></canvas>
          </div>
          <div class="figure-controls">
            <div class="ctl-row">
              <label class="ctl-label" for="act2-n">材料折射率 n（X 射线 ≈ 1.0 · 玻璃 ≈ 1.5）</label>
              <input id="act2-n" type="range" min="100" max="150" step="1" value="100" />
              <output id="act2-readout" class="ctl-readout">n ≈ 1.00 · 没有透镜</output>
            </div>
            <div class="ctl-row ctl-row--presets">
              <button class="btn-chip" data-n="100">X 射线 n≈1.00</button>
              <button class="btn-chip" data-n="133">水 n≈1.33</button>
              <button class="btn-chip" data-n="150">玻璃 n≈1.50</button>
            </div>
          </div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>透镜聚焦是用「波前圆心在透镜处切换」的几何近似画的，没有做真实的折射计算；透镜成像用了傍轴近似（每个物点对应一个像点）。「相位对齐 → 像点变亮」这条物理是对的。</p>
          </details>
          <figcaption class="figure-caption">上半：可见光，透镜把 P₁、P₂ 各自聚成屏上的像点。下半：X 射线，把 n 从 1.0 拖到 1.5，看假设的透镜能不能把像救回来。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act2-lens')!;
  const scene = new LensScene(canvas);
  scene.start();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) scene.start();
      else scene.pause();
    });
  });
  io.observe(canvas);

  const slider = section.querySelector<HTMLInputElement>('#act2-n')!;
  const readout = section.querySelector<HTMLOutputElement>('#act2-readout')!;
  const chips = Array.from(section.querySelectorAll<HTMLButtonElement>('.btn-chip'));

  const state = { n: 1.0 };

  const sync = (): void => {
    slider.value = String(Math.round(state.n * 100));
    const lensOn = state.n >= 1.28;
    readout.textContent = lensOn
      ? `n ≈ ${state.n.toFixed(2)} · 假设有透镜`
      : `n ≈ ${state.n.toFixed(2)} · 没有透镜`;
    chips.forEach((c) => {
      c.classList.toggle('active', Number(c.getAttribute('data-n')) === Math.round(state.n * 100));
    });
  };

  const apply = (n: number): void => {
    state.n = n;
    scene.setN(n);
    sync();
  };

  slider.addEventListener('input', () => {
    apply(parseFloat(slider.value) / 100);
  });

  chips.forEach((c) => {
    c.addEventListener('click', () => {
      apply(parseFloat(c.getAttribute('data-n')!) / 100);
    });
  });

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      const p = STEP_PRESETS[i];
      if (p) apply(p.n);
    },
  });
}
