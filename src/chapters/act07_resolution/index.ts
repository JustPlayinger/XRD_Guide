/**
 * 第 7 幕 · 分辨率：把斑点加回成密度图
 *
 * 逻辑链（只依赖已建立的：第 5–6 幕的 F 与傅里叶思想）：
 *   密度图 = 每个斑点（含相位）的求和
 *   分辨率 = 参与求和的最高频率 |s| ≤ 1/d_min
 *   截断越狠越糊，且硬截断产生傅里叶涟漪（假密度）→ 第一个真正的「隐患」
 */

import { setupScrolly } from '../../lib/scrolly';
import { ResolutionScene } from '../../lib/resolutionScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '合成：把每个斑点「加」回图像',
    body:
      '有了振幅和相位（第 6 幕说过相位要靠猜），剩下的就是把几万个斑点加回成一张图：每个斑点 (h,k) 贡献一个正弦波，振幅和相位由 F(h,k) 决定。所有波加起来，就得到电子密度图。第 6 幕的交换实验，其实就是这个合成的正反两面。',
  },
  {
    title: '拖分辨率滑块：从一坨雾到原子',
    body:
      '右边把 d_min 从 6 Å 拖到 1 Å。6 Å 时密度只是一坨雾，能看出分子的大致轮廓，但看不出侧链；3.5 Å 时主链能追了，侧链还是一团；2.5 Å 侧链清晰；1 Å 单个原子都分得开。注意：同一张图，只是「用了多少斑点」不同。',
  },
  {
    title: 'PDB 里的 RESOLUTION 就是这条截止线',
    body:
      '还记得 ACT 0 的「RESOLUTION 1.50 Å」吗？它的真实含义是：这个结构只用了 |s| ≤ 1/1.50 Å⁻¹ 的衍射斑来重建。它既不是坐标误差，也不是「每个原子画得多圆」。这个数字决定你能看到多细的东西，也是判断一个结构好坏的第一道门槛。',
  },
  {
    title: '截断的代价：涟漪与假密度',
    body:
      '注意分辨率差时，密度峰周围会出现一圈圈明暗涟漪——那是硬截断造成的傅里叶振铃，不是真实结构。结晶学家管这叫 Fourier ripples。它们是「假密度」：可能被误认成水分子、误认成配体。这是我们遇到的第一批真正的数据隐患，而它还在第 8、9 幕等着被放大。',
  },
];

const PRESET_VALUES = [6.0, 3.5, 2.5, 1.0];

export function mountAct07(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-7';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 7</span>
      <h2>分辨率：斑点加回成图的那条截止线</h2>
      <p class="chapter-lead">所有斑点都齐了，怎么拼成一张密度图？答案是一次一次地加。加多少，决定了你看得多清楚——这个数字就写在每个 PDB 条目里。</p>
      <div class="chapter-dep">本幕依赖：第 5–6 幕（结构因子、相位）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act7-res"></canvas>
          </div>
          <div class="figure-controls">
            <div class="ctl-row">
              <label class="ctl-label" for="act7-r">分辨率 d_min</label>
              <input id="act7-r" type="range" min="10" max="60" step="1" value="25" />
              <output id="act7-readout" class="ctl-readout">2.5 Å</output>
            </div>
            <div class="ctl-row ctl-row--presets">
              ${PRESET_VALUES.map(
                (v) => `<button class="btn-chip" data-res="${v}">${v.toFixed(1)} Å</button>`,
              ).join('')}
            </div>
          </div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>分子是程序生成的 2D 高斯原子云；合成用了硬截断（真实精修常用软权重，涟漪更轻）；振幅直接用，没有加噪声。傅里叶合成的原理和真实结构测定一致。</p>
          </details>
          <figcaption class="figure-caption">左：重建密度；右：衍射图与截止圆（琥珀色虚线）。分辨率越低，圈越小，图越糊。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act7-res')!;
  const scene = new ResolutionScene(canvas);

  const slider = section.querySelector<HTMLInputElement>('#act7-r')!;
  const readout = section.querySelector<HTMLOutputElement>('#act7-readout')!;
  const chips = Array.from(section.querySelectorAll<HTMLButtonElement>('.btn-chip'));

  const apply = (dMin: number): void => {
    scene.setResolution(dMin);
    slider.value = String(Math.round(dMin * 10));
    readout.textContent = `${dMin.toFixed(1)} Å`;
    chips.forEach((c) => {
      c.classList.toggle('active', Math.abs(Number(c.getAttribute('data-res')) - dMin) < 0.01);
    });
  };

  slider.addEventListener('input', () => {
    apply(parseFloat(slider.value) / 10);
  });
  chips.forEach((c) => {
    c.addEventListener('click', () => {
      apply(parseFloat(c.getAttribute('data-res')!));
    });
  });

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      if (i === 2) apply(2.5);
    },
  });
}
