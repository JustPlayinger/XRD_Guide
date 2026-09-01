/**
 * 第 8 幕 · 从密度到坐标：人把手伸进图里
 *
 * 逻辑链（只依赖已建立的：第 6–7 幕）：
 *   密度→坐标多解（3Å 下侧链摆法不唯一）
 *   → 用 R 值检验模型：R-work 对拟合数据、R-free 对留出数据（验证集）
 *   → 过拟合：R-work 一路降、R-free 先降后升
 *   → 模型偏倚：错误相位长出假特征（分子置换的原罪），用 omit map 破
 */

import { setupScrolly } from '../../lib/scrolly';
import { ModelScene } from '../../lib/modelScene';
import type { ModelMode } from '../../lib/modelScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '从密度到坐标，是人把原子放进去的',
    body:
      '第 7 幕的密度图是连续的一坨坨，不是原子。建模的人要做的是：把原子的球棍模型放进密度里，让密度「包住」原子。在 2–3 Å 的分辨率下，侧链怎么摆往往有好几种方案都说得通。这一步的结果不是唯一的，人的判断在里面。',
  },
  {
    title: '怎么检验模型：R 值',
    body:
      '模型放好之后，把它算出来的衍射强度和实测的衍射强度比一比，差距就是 R 值：<strong>R = Σ||F_obs| − |F_calc|| / Σ|F_obs|</strong>。R 越小说明模型越贴合数据，0.2 以下算不错。但这里有个陷阱：模型参数越多，R 只会越小。',
  },
  {
    title: 'R-free：留 5% 的验证集',
    body:
      '1992 年 Brünger 想了个办法，和机器学习里留验证集一模一样：精修前先随机扣掉 5% 的衍射斑，永远不让它们参与拟合。左边的 R-work 管这 95%，R-free 管那 5%。拖动「模型自由度」滑块：R-work 一路下降，但 R-free 先降后升——<strong>升起来的那一段，就是过拟合</strong>。',
  },
  {
    title: '模型偏倚：错误的相位，长出假的密度',
    body:
      '现在把第 6 幕的实验换个角度。真实分子（左）做可换晶置换拿到正确振幅，但相位来自一个错误的模型（中，一个圆）。用「正确振幅 × 错误相位」重建（右）：密度里长出了错误模型才有的圆环，却和真密度一样可信。<strong>如果模板结构是错的，分子置换会把错误原样复制进新结构。</strong>破法是 omit map：把可疑区域先从模型里扣掉，看密度还站不站得住。',
  },
];

const STEP_PRESETS: Array<{ mode?: ModelMode; p?: number } | null> = [
  { mode: 'rfree', p: 20 },
  { mode: 'rfree', p: 20 },
  { mode: 'rfree', p: 85 },
  { mode: 'bias' },
];

export function mountAct08(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-8';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 8</span>
      <h2>从密度到坐标：模型、过拟合与偏倚</h2>
      <p class="chapter-lead">密度图不会自己变成坐标。放原子的是人，检验的是 R 值，而 R 值也会骗人——除非你留一手。</p>
      <div class="chapter-dep">本幕依赖：第 6–7 幕；训练集/验证集的直觉（你本来就有）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act8-model"></canvas>
          </div>
          <div class="figure-controls" id="act8-controls"></div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>R 曲线是合成的示意曲线，不是真实精修过程；偏倚实验的分子是 2D 图案。R 的定义、R-free 的留出策略、以及「相位决定长相」的机制都和真实情况一致。</p>
          </details>
          <figcaption class="figure-caption">这一步的图会随步骤切换：R 值曲线 ↔ 模型偏倚实验。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act8-model')!;
  const scene = new ModelScene(canvas);
  scene.start();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) scene.start();
      else scene.pause();
    });
  });
  io.observe(canvas);

  const controls = section.querySelector<HTMLElement>('#act8-controls')!;
  const state = { mode: 'rfree' as ModelMode, p: 20 };

  const buildControls = (mode: ModelMode): void => {
    if (mode === 'rfree') {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act8-p">模型自由度（原子数、水、B 因子…）</label>
          <input id="act8-p" type="range" min="1" max="100" step="1" value="${state.p}" />
          <output class="ctl-readout" id="act8-r">${state.p}</output>
        </div>`;
    } else {
      controls.innerHTML = '<div class="ctl-row"><span class="ctl-label">静态实验，无滑块</span></div>';
    }
  };

  const wireControls = (mode: ModelMode): void => {
    const rOut = controls.querySelector<HTMLOutputElement>('#act8-r');
    if (mode === 'rfree') {
      const pSl = controls.querySelector<HTMLInputElement>('#act8-p')!;
      pSl.addEventListener('input', () => {
        state.p = parseInt(pSl.value, 10);
        scene.setFreedom(state.p);
        if (rOut) rOut.textContent = `${state.p}`;
      });
    }
  };

  const applyMode = (mode: ModelMode): void => {
    state.mode = mode;
    buildControls(mode);
    wireControls(mode);
    scene.setMode(mode);
    scene.setFreedom(state.p);
  };

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      const p = STEP_PRESETS[i];
      if (p) {
        if (p.mode) applyMode(p.mode);
        if (p.p !== undefined) {
          state.p = p.p;
          scene.setFreedom(p.p);
        }
      }
    },
  });

  applyMode('rfree');
}
