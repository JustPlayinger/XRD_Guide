/**
 * 第 3 幕 · 斑点从哪来：两个散射体与第一条条纹
 *
 * 逻辑链（只依赖已建立的：第 1 幕的波、第 2 幕的散射与强度）：
 *   一个点 → 平滑分布；两个点 → 明暗条纹（干涉）
 *   条纹位置由路程差 d·sinθ 决定 → 亮纹条件 d·sinθ = nλ
 *   间距 d 越大，条纹越密 → 倒易关系初现（第 4 幕完整化）
 */

import { setupScrolly } from '../../lib/scrolly';
import { InterferenceScene } from '../../lib/interferenceScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '一个点只有弥漫，两个点才有条纹',
    body:
      '一个散射中心在探测器上留下的强度是平滑的，像第 1 幕那个「无影」的情形。但两个散射中心就不一样了：它们发出的波会在空间里相遇，有的地方波峰撞波峰，变亮；有的地方波峰撞波谷，变暗。于是屏幕上出现明暗相间的条纹。条纹本身就是「有两个点」的直接证据。',
  },
  {
    title: '条纹从哪来：路程差',
    body:
      '探测器放在角度 θ。两个点到它的距离不一样，差值是 <strong>Δ = d·sinθ</strong>。这个路程差对应一个相位差。Δ 刚好是波长的整数倍时，两列波同相，叠加变亮；Δ 是半波长的奇数倍时，反相，变暗。拖动 θ 滑块，看上半部分两条路径和 Δ 的变化，同时注意下半曲线上的对应位置。',
  },
  {
    title: 'd 越大，条纹越密',
    body:
      '拖动 d（两个散射中心的间距）。间距越大，同样角度范围内的条纹越多、越密；反过来，间距小，条纹就稀。这就是<strong>「实空间越大，衍射空间越密」</strong>。同样的现象，到第 4 幕会变成完整的倒易点阵——实空间的尺寸和衍射空间的尺寸总是反着来。',
  },
  {
    title: '一句话总结',
    body:
      '亮纹条件：<strong>d·sinθ = nλ</strong>。它看起来朴素，但注意一个细节：亮纹的角度只由间距 d 决定，和「每个点长什么样」无关。也就是说，<strong>间距决定条纹的位置，点的内容决定条纹的明暗</strong>。这个分工，到第 5 幕会变成「晶格决定斑点位置，分子决定斑点强度」。',
  },
];

/** 每步自动演示的参数 */
const STEP_PRESETS: Array<Partial<{ d: number; lambda: number; thetaDeg: number }> | null> = [
  { d: 1.0, lambda: 1.0 },
  { d: 1.0, lambda: 1.0 },
  { d: 3.0, lambda: 1.0 },
  { d: 3.0, lambda: 1.0 },
];

export function mountAct03(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-3';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 3</span>
      <h2>斑点从哪来：两个散射体画出的第一条条纹</h2>
      <p class="chapter-lead">探测器只能记强度。但哪怕只有两个散射中心，强度也不是均匀的——它上面刻着间距的信息。这一幕看看条纹是怎么长出来的。</p>
      <div class="chapter-dep">本幕依赖：第 1–2 幕（波、散射、强度）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act3-interf"></canvas>
          </div>
          <div class="figure-controls">
            <div class="ctl-row">
              <label class="ctl-label" for="act3-d">间距 d</label>
              <input id="act3-d" type="range" min="60" max="400" step="5" value="100" />
              <label class="ctl-label" for="act3-l">波长 λ</label>
              <input id="act3-l" type="range" min="30" max="300" step="5" value="100" />
            </div>
            <div class="ctl-row">
              <label class="ctl-label" for="act3-th">观察角 θ</label>
              <input id="act3-th" type="range" min="-75" max="75" step="1" value="20" />
              <output id="act3-readout" class="ctl-readout">Δ = d·sinθ</output>
            </div>
          </div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>路程差用了远场近似：Δ = d·sinθ 严格成立的条件是观测距离远大于 d。强度曲线用的就是这个远场公式。两个点源的散射被假定为各向同性。</p>
          </details>
          <figcaption class="figure-caption">上半：两个散射中心 + 远场探测器；下半：远场强度 I(θ)。虚线是单点源——平滑，没有条纹。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act3-interf')!;
  const scene = new InterferenceScene(canvas);
  scene.start();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) scene.start();
      else scene.pause();
    });
  });
  io.observe(canvas);

  const dSlider = section.querySelector<HTMLInputElement>('#act3-d')!;
  const lSlider = section.querySelector<HTMLInputElement>('#act3-l')!;
  const thSlider = section.querySelector<HTMLInputElement>('#act3-th')!;
  const readout = section.querySelector<HTMLOutputElement>('#act3-readout')!;

  const state = { d: 1.0, lambda: 1.0, thetaDeg: 20 };

  const syncReadout = (): void => {
    const delta = state.d * Math.sin((state.thetaDeg * Math.PI) / 180);
    const frac = delta / state.lambda;
    readout.textContent = `Δ = ${delta.toFixed(2)} ≈ ${frac.toFixed(2)}λ`;
  };

  const apply = (): void => {
    dSlider.value = String(Math.round(state.d * 100));
    lSlider.value = String(Math.round(state.lambda * 100));
    thSlider.value = String(state.thetaDeg);
    scene.setParams(state);
    syncReadout();
  };

  dSlider.addEventListener('input', () => {
    state.d = parseFloat(dSlider.value) / 100;
    apply();
  });
  lSlider.addEventListener('input', () => {
    state.lambda = parseFloat(lSlider.value) / 100;
    apply();
  });
  thSlider.addEventListener('input', () => {
    state.thetaDeg = parseFloat(thSlider.value);
    apply();
  });

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      const p = STEP_PRESETS[i];
      if (p) {
        if (p.d !== undefined) state.d = p.d;
        if (p.lambda !== undefined) state.lambda = p.lambda;
        if (p.thetaDeg !== undefined) state.thetaDeg = p.thetaDeg;
        apply();
      }
    },
  });
}
