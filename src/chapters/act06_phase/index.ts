/**
 * 第 6 幕 · 相位问题：被丢掉的那一半
 *
 * 逻辑链（只依赖已建立的：第 5 幕的 |F|² 与相量）：
 *   探测器只记强度 |F|² → 振幅知道，相位丢了
 *   交换实验：相位决定图像长相 → 必须把相位猜回来
 *   三条出路（预告：分子置换在 ACT 8 会埋下模型偏倚）
 */

import { setupScrolly } from '../../lib/scrolly';
import { PhaseScene } from '../../lib/phaseScene';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '探测器只给 |F|²：强度有了，相位没了',
    body:
      '第 5 幕告诉我们每个斑点背后是一个复数 F(h,k)，有振幅、有相位。但探测器只记强度，也就是 |F|²。平方把相位抹掉了。于是我们手里有一堆「振幅」，却完全没有「相位」。重建分子需要两者都齐——这就像有了一张没有阴影信息的照片。',
  },
  {
    title: '交换实验：只换振幅 vs 只换相位',
    body:
      '右边是两幅图：圆环 A 和哑铃 B。它们各自做傅里叶变换，得到各自的振幅和相位。现在做两个交换：<strong>A 的振幅 × B 的相位</strong>，逆变换回去；再反过来，<strong>B 的振幅 × A 的相位</strong>。看看下面两行，哪一行像 A、哪一行像 B。',
  },
  {
    title: '结果：谁提供相位，图像就长得像谁',
    body:
      '结果是明确的：提供相位的那张图，决定了重建结果的长相。振幅只影响整体的亮暗、细节的锐钝。换句话说，<strong>结构信息几乎全在相位里</strong>。而我们恰好只测到了振幅的平方。这就是单晶衍射的根本困难：相位问题。',
  },
  {
    title: '所以相位得用别的办法猜回来',
    body:
      '既然测不到，就靠猜。历史上主要有三条路：<strong>同晶置换</strong>（往晶体里塞重原子，对比前后强度的差求相位）、<strong>反常散射</strong>（利用特定波长的吸收边）、<strong>分子置换</strong>（拿一个已知的相似结构来当相位来源）。第三条最省事，也最危险——如果模板结构是错的，错误会原样流进新结构。这个坑，第 8 幕专门讲。',
  },
];

export function mountAct06(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-6';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 6</span>
      <h2>相位问题：被丢掉的那一半信息</h2>
      <p class="chapter-lead">强度知道了，相位没了。一个交换实验会让你亲眼看到：相位才是决定图像长相的那一半。</p>
      <div class="chapter-dep">本幕依赖：第 5 幕（结构因子、|F|²）。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure figure--wave">
          <div class="figure-canvas-wrap">
            <canvas id="act6-phase"></canvas>
          </div>
          <div class="figure-controls">
            <div class="ctl-row">
              <button class="btn-chip" id="act6-rerun">换一组图案重新实验</button>
            </div>
          </div>
          <details class="simplify">
            <summary>本图简化了什么</summary>
            <p>两幅图是程序生成的 2D 图案（圆环 / 哑铃），不是真实蛋白密度；但「相位决定长相」的交换实验在真实结构测定里完全成立（Oppenheim–Lim 实验）。</p>
          </details>
          <figcaption class="figure-caption">上面两幅是原图，下面两幅是交换振幅/相位后的重建。谁提供相位，结果就像谁。</figcaption>
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

  const canvas = section.querySelector<HTMLCanvasElement>('#act6-phase')!;
  const scene = new PhaseScene(canvas);

  section.querySelector<HTMLButtonElement>('#act6-rerun')!.addEventListener('click', () => {
    scene.rerun();
  });

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
    },
  });
}
