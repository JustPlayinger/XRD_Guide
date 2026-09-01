/**
 * 第 4 幕 · 为什么非要晶体
 *
 * 逻辑链（只依赖已建立的：第 1–3 幕）：
 *   单分子散射太弱 → 需要 N 个拷贝同相叠加（强度 ∝ N²，峰变锐 ∝ 1/N）
 *   周期性 → 布拉格条件 2d·sinθ = nλ
 *   二维点阵 → 倒易点阵（实空间越长，倒易越密）
 */

import { setupScrolly } from '../../lib/scrolly';
import { CrystalScene } from '../../lib/crystalScene';
import type { CrystalMode } from '../../lib/crystalScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '单分子太弱了',
    body:
      '一个分子的散射，落在探测器上基本淹没在噪声里。而且单个分子没有周期性，它的散射在空间里是连续的一大片，什么都分不出来。所以必须有很多很多分子，而且它们必须按同一个姿势站好，让散射波互相加强。这个「很多分子按同一姿势站好」的东西，就是晶体。',
  },
  {
    title: 'N 个点排成一列：强度 N²，峰宽 1/N',
    body:
      '右边上半是一列散射点。拖动 N：N=1 时远场只有一条平滑的宽线（弱、没特征）；N 增大，强度曲线出现尖锐的主峰，峰高按 N² 涨，峰宽按 1/N 收窄。晶体里大约有 10¹⁵ 个分子，所以斑点又强又锐——这就是为什么非要用晶体不可。',
  },
  {
    title: '布拉格镜面：2d·sinθ = nλ',
    body:
      '相邻晶面反射的波，路程差是 2d·sinθ。它等于波长的整数倍时，各层晶面的反射同相叠加，出现一个强反射峰。右边把 d、θ、λ 三个滑块都拖一拖，看什么时候显示「✓ 整数倍」。注意：这其实和第 3 幕的 d·sinθ = nλ 是同一件事，只是多乘了个 2（因为路程走一个来回）。',
  },
  {
    title: '实空间 ↔ 倒易：长短永远反着来',
    body:
      '把点阵看成一个平行四边形网格。右边左侧是实空间晶格，右侧是它的倒易点阵——也就是衍射斑点可能出现的位置。拖 |a|、|b|、夹角三个滑块：实空间的格子拉长，倒易的格子就压缩；实空间旋转，倒易跟着转。这就是第 3 幕那句「d 越大条纹越密」的二维版本。',
  },
  {
    title: '小结：晶体是必须的，也是第 9 幕所有麻烦的来源',
    body:
      '一句话：晶体把「弱而弥散的单分子散射」变成「强而锐利的衍射斑」，代价是让分子在晶体里排成规则阵列。规则阵列意味着分子被互相挨着、被固定姿态、被平均——这些「代价」，到第 9 幕会变成 PDB 数据里一系列说不清道不明的偏差。先记住这个因果链。',
  },
];

const STEP_PRESETS: Array<{ mode?: CrystalMode; n?: number; bd?: number; thetaDeg?: number } | null> = [
  { mode: 'array', n: 3 },
  { mode: 'array', n: 20 },
  { mode: 'bragg', bd: 1.2, thetaDeg: 30 },
  { mode: 'reciprocal' },
  null,
];

export function mountAct04(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-4';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 4</span>
      <h2>为什么非要晶体：弱散射如何变成强斑点</h2>
      <p class="chapter-lead">两个点能画条纹，但一个分子不行。要拿到看得见的衍射，分子必须成千上万地、按同一个姿势排好。这一排，排出了晶体，也排出了后面一大堆麻烦。</p>
      <div class="chapter-dep">本幕依赖：第 1–3 幕（波、散射、干涉条纹）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act4-crystal"></canvas>
          </div>
          <div class="figure-controls" id="act4-controls"></div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>「N 个点」用的是 1D 光栅公式（真实晶体是 3D）；布拉格是经典镜面模型；倒易图是 2D 版本（真实晶体在 3D）。「长短反比、方向垂直、峰强 ∝ N²」这些规律在 3D 里同样成立。</p>
          </details>
          <figcaption class="figure-caption">这一步的图形会随右侧文字自动切换：N 点列阵 → 布拉格镜面 → 实空间↔倒易联动。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act4-crystal')!;
  const scene = new CrystalScene(canvas);
  scene.start();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) scene.start();
      else scene.pause();
    });
  });
  io.observe(canvas);

  const controls = section.querySelector<HTMLElement>('#act4-controls')!;
  const state = { mode: 'array' as CrystalMode, n: 3, bd: 1.2, thetaDeg: 30, lambda: 1.0 };

  const buildControls = (mode: CrystalMode): void => {
    if (mode === 'array') {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act4-n">点数 N</label>
          <input id="act4-n" type="range" min="1" max="50" step="1" value="${state.n}" />
          <output class="ctl-readout" id="act4-r">N = ${state.n}</output>
        </div>`;
    } else if (mode === 'bragg') {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act4-d">晶面间距 d</label>
          <input id="act4-d" type="range" min="50" max="300" step="5" value="${state.bd * 100}" />
          <label class="ctl-label" for="act4-th">入射角 θ</label>
          <input id="act4-th" type="range" min="5" max="80" step="1" value="${state.thetaDeg}" />
        </div>
        <div class="ctl-row">
          <label class="ctl-label" for="act4-l">波长 λ</label>
          <input id="act4-l" type="range" min="30" max="300" step="5" value="100" />
          <output class="ctl-readout" id="act4-r"></output>
        </div>`;
    } else {
      controls.innerHTML = `
        <div class="ctl-row">
          <label class="ctl-label" for="act4-a">|a|</label>
          <input id="act4-a" type="range" min="8" max="40" step="1" value="14" />
          <label class="ctl-label" for="act4-b">|b|</label>
          <input id="act4-b" type="range" min="8" max="40" step="1" value="10" />
          <label class="ctl-label" for="act4-ang">夹角</label>
          <input id="act4-ang" type="range" min="40" max="140" step="1" value="78" />
        </div>`;
    }
  };

  const wireControls = (mode: CrystalMode): void => {
    const rOut = controls.querySelector<HTMLOutputElement>('#act4-r');
    if (mode === 'array') {
      const nSl = controls.querySelector<HTMLInputElement>('#act4-n')!;
      nSl.addEventListener('input', () => {
        state.n = parseInt(nSl.value, 10);
        scene.setParams({ n: state.n });
        if (rOut) rOut.textContent = `N = ${state.n}`;
      });
    } else if (mode === 'bragg') {
      const dSl = controls.querySelector<HTMLInputElement>('#act4-d')!;
      const thSl = controls.querySelector<HTMLInputElement>('#act4-th')!;
      const lSl = controls.querySelector<HTMLInputElement>('#act4-l')!;
      const update = (): void => {
        state.bd = parseFloat(dSl.value) / 100;
        state.thetaDeg = parseFloat(thSl.value);
        state.lambda = parseFloat(lSl.value) / 100;
        scene.setParams({ bd: state.bd, thetaDeg: state.thetaDeg, lambda: state.lambda });
        if (rOut) {
          rOut.textContent = `2d·sinθ/λ = ${(
            (2 * state.bd * Math.sin((state.thetaDeg * Math.PI) / 180)) /
            state.lambda
          ).toFixed(2)}`;
        }
      };
      dSl.addEventListener('input', update);
      thSl.addEventListener('input', update);
      lSl.addEventListener('input', update);
    } else {
      const aSl = controls.querySelector<HTMLInputElement>('#act4-a')!;
      const bSl = controls.querySelector<HTMLInputElement>('#act4-b')!;
      const angSl = controls.querySelector<HTMLInputElement>('#act4-ang')!;
      const update = (): void => {
        scene.setParams({
          aLen: parseFloat(aSl.value) / 10,
          bLen: parseFloat(bSl.value) / 10,
          angDeg: parseFloat(angSl.value),
        });
      };
      aSl.addEventListener('input', update);
      bSl.addEventListener('input', update);
      angSl.addEventListener('input', update);
    }
  };

  const applyMode = (mode: CrystalMode): void => {
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
        if (p.n !== undefined) {
          state.n = p.n;
          scene.setParams({ n: p.n });
        }
        if (p.bd !== undefined) state.bd = p.bd;
        if (p.thetaDeg !== undefined) state.thetaDeg = p.thetaDeg;
        scene.setParams({ bd: state.bd, thetaDeg: state.thetaDeg });
      }
    },
  });

  applyMode('array');
}
