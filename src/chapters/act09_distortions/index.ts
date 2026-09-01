/**
 * 第 9 幕 · 晶体不是细胞
 *
 * 逻辑链（只依赖已建立的：第 4 幕的晶体、第 7–8 幕的密度与模型）：
 *   晶体的必要条件（排列、冷冻、高浓度）本身就是失真的来源
 *   → 时空平均/B 因子、堆积接触、辐射损伤、选择偏倚、过度解释
 */

import { setupScrolly } from '../../lib/scrolly';
import { DistortionScene } from '../../lib/distortionScene';
import type { DistortionMode } from '../../lib/distortionScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '先记住前提：晶体不是细胞',
    body:
      '第 4 幕我们为什么需要晶体：10¹⁵ 个分子排成阵列，散射才能叠加成强斑点。可这个「排列」本身就不自然——分子被挤在晶格里、被冷冻到 100 K、被泡在高浓度沉淀剂里。所以晶体拍出来的结构，天然带着一系列失真。这一幕把它们逐个点名。',
  },
  {
    title: '时空平均与 B 因子',
    body:
      '每个斑点来自所有晶胞里所有分子的平均。分子在晶格里微微抖动、占据多个姿势——拍下来的是一条「平均密度」。右图拖动「无序程度」：分子越乱，平均密度越糊。PDB 里那个 B 因子，就是这团糊的量化：<strong>B 因子大 = 这个位置的密度糊</strong>，未必是原子在动。',
  },
  {
    title: '堆积接触：邻居压出来的构象',
    body:
      '晶体里分子是被对称邻居围住的。伸出去的表面 loop，在溶液里自由摆动，在晶体里被邻居夹着，只能摆出被挤压的姿势。更糟的是：有的「二聚体」根本是晶体里两个分子互相挨着，不是生物学组装体。看 PDB 文件时，<strong>不对称单元 ≠ 生物学组装体</strong>——这两者被搞混是生信管线里最常见的坑。',
  },
  {
    title: '冷冻、选择偏倚与辐射损伤',
    body:
      '结构通常拍自 100 K 的冷冻晶体：构象系综被冻住，只留一种姿势（选择偏倚）。而 X 射线一边拍照一边破坏样品：剂量高了，二硫键断开、金属被还原。右图拖剂量滑块：<strong>你看到的「活性位点」，可能是被照坏之后的活性位点。</strong>另外，能长出好晶体的构象未必是溶液里主要的构象——结晶条件本身就是一种选择。',
  },
  {
    title: '配体、水与占有率：过度解释',
    body:
      '最后是习惯性过度解释。放几颗水、给配体一个低占有率，都能把 R 值刷漂亮。低分辨率下「看清楚配体」尤其难——很多知名药物-蛋白结构的争议就出在这里。现代校验会看 real-space correlation、polder map，还会直接告诉你「这个配体没有密度支持」。',
  },
];

const STEP_PRESETS: Array<{ mode?: DistortionMode; jitter?: number; dose?: number } | null> = [
  { mode: 'average', jitter: 3 },
  { mode: 'average', jitter: 7 },
  { mode: 'packing' },
  { mode: 'damage', dose: 0.8 },
  { mode: 'damage', dose: 0.3 },
];

export function mountAct09(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-9';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 9</span>
      <h2>晶体不是细胞：七种失真逐个点名</h2>
      <p class="chapter-lead">结构是从晶体里长出来的，而晶体不是细胞。这一幕盘点晶体环境强加给分子的失真，以及它们在 PDB 文件里的痕迹。</p>
      <div class="chapter-dep">本幕依赖：第 4 幕（晶体）、第 7–8 幕（密度、模型）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act9-dist"></canvas>
          </div>
          <div class="figure-controls" id="act9-controls"></div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>分子是 2D 示意；辐射损伤用淡出和变色示意（真实是光电子化学）；没有画真实的对称操作。三类失真的 PDB 痕迹（B 因子、REMARK 465、金属还原）都是真实的。</p>
          </details>
          <figcaption class="figure-caption">图形随步骤切换：时空平均 → 堆积接触 → 辐射损伤。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act9-dist')!;
  const scene = new DistortionScene(canvas);
  scene.start();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) scene.start();
      else scene.pause();
    });
  });
  io.observe(canvas);

  const controls = section.querySelector<HTMLElement>('#act9-controls')!;
  const state = { mode: 'average' as DistortionMode, jitter: 3, dose: 0 };

  const buildControls = (mode: DistortionMode): void => {
    if (mode === 'average') {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act9-j">无序程度（≈ B 因子）</label>
          <input id="act9-j" type="range" min="1" max="10" step="1" value="${state.jitter}" />
          <output class="ctl-readout" id="act9-r">${state.jitter}</output>
        </div>`;
    } else if (mode === 'damage') {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act9-d">辐射剂量</label>
          <input id="act9-d" type="range" min="0" max="100" step="1" value="${Math.round(state.dose * 100)}" />
          <output class="ctl-readout" id="act9-r">${Math.round(state.dose * 100)}%</output>
        </div>`;
    } else {
      controls.innerHTML = '<div class="ctl-row"><span class="ctl-label">静态示意，无滑块</span></div>';
    }
  };

  const wireControls = (mode: DistortionMode): void => {
    const rOut = controls.querySelector<HTMLOutputElement>('#act9-r');
    if (mode === 'average') {
      const jSl = controls.querySelector<HTMLInputElement>('#act9-j')!;
      jSl.addEventListener('input', () => {
        state.jitter = parseInt(jSl.value, 10);
        scene.setJitter(state.jitter);
        if (rOut) rOut.textContent = `${state.jitter}`;
      });
    } else if (mode === 'damage') {
      const dSl = controls.querySelector<HTMLInputElement>('#act9-d')!;
      dSl.addEventListener('input', () => {
        state.dose = parseInt(dSl.value, 10) / 100;
        scene.setDose(state.dose);
        if (rOut) rOut.textContent = `${Math.round(state.dose * 100)}%`;
      });
    }
  };

  const applyMode = (mode: DistortionMode): void => {
    state.mode = mode;
    buildControls(mode);
    wireControls(mode);
    scene.setMode(mode);
  };

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      const p = STEP_PRESETS[i];
      if (p) {
        if (p.mode) applyMode(p.mode);
        if (p.jitter !== undefined) {
          state.jitter = p.jitter;
          scene.setJitter(p.jitter);
        }
        if (p.dose !== undefined) {
          state.dose = p.dose;
          scene.setDose(p.dose);
        }
      }
    },
  });

  applyMode('average');
}
