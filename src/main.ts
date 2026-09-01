/**
 * main.ts —— 应用入口
 *
 * 结构：
 *   顶部导航（章节索引 + 阅读进度条）
 *   Hero（引言 + 三条约定的设计契约 + 全程路线图）
 *   章节序列（每幕一个 <section>，由各自模块挂载）
 *   收尾（下一幕预告）
 *   页脚（数据来源 / 许可 / 技术说明）
 */

import './styles/index.css';
import { mountAct00 } from './chapters/act00_entry';
import { mountAct01 } from './chapters/act01_wavelength';
import { mountAct02 } from './chapters/act02_no_lens';
import { mountAct03 } from './chapters/act03_interference';
import { mountAct04 } from './chapters/act04_crystal';
import { mountAct05 } from './chapters/act05_content';
import { mountAct06 } from './chapters/act06_phase';
import { mountAct07 } from './chapters/act07_resolution';
import { mountAct08 } from './chapters/act08_model';
import { mountAct09 } from './chapters/act09_distortions';
import { mountAct10 } from './chapters/act10_checklist';

interface ChapterMeta {
  id: string;
  num: string;
  title: string;
  built: boolean;
}

const CHAPTERS: ChapterMeta[] = [
  { id: 'act-0', num: 'ACT 0', title: '案发现场', built: true },
  { id: 'act-1', num: 'ACT 1', title: '看见需要波', built: true },
  { id: 'act-2', num: 'ACT 2', title: '透镜的缺席', built: true },
  { id: 'act-3', num: 'ACT 3', title: '斑点从哪来', built: true },
  { id: 'act-4', num: 'ACT 4', title: '为什么非要晶体', built: true },
  { id: 'act-5', num: 'ACT 5', title: '格子 × 内容', built: true },
  { id: 'act-6', num: 'ACT 6', title: '相位问题', built: true },
  { id: 'act-7', num: 'ACT 7', title: '分辨率', built: true },
  { id: 'act-8', num: 'ACT 8', title: '从密度到坐标', built: true },
  { id: 'act-9', num: 'ACT 9', title: '晶体不是细胞', built: true },
  { id: 'act-10', num: 'ACT 10', title: '使用者的检查清单', built: true },
];

function buildNav(): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'topbar';
  nav.innerHTML = `
    <div class="topbar-inner">
      <a class="brand" href="#hero">看不见的原子</a>
      <div class="topbar-links">
        ${CHAPTERS.map(
          (c) =>
            c.built
              ? `<a class="topbar-link" href="#${c.id}">${c.num}</a>`
              : `<span class="topbar-link topbar-link--muted" title="尚未发布（后续里程碑）">${c.num}</span>`,
        ).join('')}
      </div>
    </div>
    <div class="progress"><div class="progress-bar" id="progress-bar"></div></div>
  `;
  return nav;
}

function buildHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.id = 'hero';
  hero.className = 'hero';
  hero.innerHTML = `
    <p class="hero-kicker">交互式可视化 · X 射线单晶衍射</p>
    <h1 class="hero-title">看不见的原子</h1>
    <p class="hero-sub">
      一个 .pdb 文件里的坐标，是怎么从一束 X 射线变出来的？<br />
      我们把它拆开，一步一步看懂。读完你会自然知道，哪些数字该信、哪些该怀疑。
    </p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="#act-0">开始阅读 ↓</a>
      <span class="hero-note">全部 11 幕已完成 🎉</span>
    </div>
    <div class="how-to">
      <h3 class="how-to-title">怎么用</h3>
      <ol class="how-to-list">
        <li><span class="how-to-num">1</span>往下滚。右侧是讲解，左侧的图会跟着你的位置自动变。</li>
        <li><span class="how-to-num">2</span>见到滑块就拖，见到按钮就点。不动手，有些话看不明白。</li>
        <li><span class="how-to-num">3</span>用 <kbd>←</kbd> <kbd>→</kbd> 键在步骤间前后跳；想回哪一幕，点顶部菜单。</li>
      </ol>
    </div>
    <div class="principles">
      <div class="principle-card">
        <h4>概念守恒</h4>
        <p>每一幕只用到你本来就知道的东西，或者前面刚讲过的东西。新词都是从现象里长出来的，不从天而降。</p>
      </div>
      <div class="principle-card">
        <h4>先现象，后命名</h4>
        <p>先看到效果，再补上名字。每个名字最后都会落在 PDB 文件里的某个字段上。</p>
      </div>
      <div class="principle-card">
        <h4>诚实标注</h4>
        <p>每张图都写清楚「这里简化了什么」。判断一个模型能信多少，本来就是这套教程要练的事。</p>
      </div>
    </div>
    <ol class="roadmap">
      <li class="roadmap-item"><span class="rm-dot">1</span><span class="rm-txt">波长</span></li>
      <li class="roadmap-item"><span class="rm-arrow">→</span><span class="rm-dot">2</span><span class="rm-txt">晶体</span></li>
      <li class="roadmap-item"><span class="rm-arrow">→</span><span class="rm-dot">3</span><span class="rm-txt">衍射斑</span></li>
      <li class="roadmap-item"><span class="rm-arrow">→</span><span class="rm-dot">4</span><span class="rm-txt">相位</span></li>
      <li class="roadmap-item"><span class="rm-arrow">→</span><span class="rm-dot">5</span><span class="rm-txt">密度图</span></li>
      <li class="roadmap-item"><span class="rm-arrow">→</span><span class="rm-dot">6</span><span class="rm-txt">原子模型</span></li>
      <li class="roadmap-item roadmap-item--final"><span class="rm-arrow">→</span><span class="rm-dot">7</span><span class="rm-txt">隐患</span></li>
    </ol>
    <p class="hero-footnote">从波长到隐患，11 幕全部就位。</p>
  `;
  return hero;
}

function buildOutro(): HTMLElement {
  const outro = document.createElement('section');
  outro.id = 'next';
  outro.className = 'outro';
  outro.innerHTML = `
    <h2>到这里，你手里多了一把尺子</h2>
    <p>
      现在回头打开第 0 幕那个 PDB 文件，每一行数字都有了来处：<br />
      分辨率是截止频率，R-free 是验证集，B 因子是时空平均，缺失残基是没被看见。<br />
      再遇到一个结构，你知道该问它什么，也知道该信它多少。
    </p>
    <div class="outro-actions">
      <a class="btn btn-primary" href="#act-0">从头再看一遍</a>
      <a class="btn btn-ghost" href="#act-10">去检查清单实操</a>
    </div>
  `;
  return outro;
}

function buildFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="footer-grid">
      <div>
        <h4>关于本项目</h4>
        <p>
          面向生信学习者的交互式教程：用可视化从零构建 X 射线单晶衍射原理，
          并逐层揭开 PDB 结构数据中的隐患与局限。
        </p>
      </div>
      <div>
        <h4>数据</h4>
        <p>
          内置真实 PDB 条目：1CRN（1981，1.50 Å）与 1EJG（2000，0.54 Å），
          来源于 <a href="https://www.rcsb.org/" target="_blank" rel="noopener">RCSB PDB</a>（公开数据）。
        </p>
      </div>
      <div>
        <h4>许可</h4>
        <p>代码：MIT。文字与可视化：CC BY 4.0。数据版权归原发布者所有。</p>
      </div>
      <div>
        <h4>本地运行</h4>
        <p><code>npm install</code> → <code>npm run dev</code> → 打开浏览器。</p>
      </div>
    </div>
    <p class="footer-line">看不见的原子 · 从一束 X 射线到 PDB 里的一行坐标</p>
  `;
  return footer;
}

function initProgress(): void {
  const bar = document.getElementById('progress-bar')!;
  const update = (): void => {
    const el = document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? el.scrollTop / max : 0;
    bar.style.transform = `scaleX(${p})`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

function initNavSpy(): void {
  const links = Array.from(document.querySelectorAll<HTMLElement>('.topbar-link[href]'));
  const built = CHAPTERS.filter((c) => c.built).map((c) => c.id);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) =>
            l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`),
          );
        }
      });
    },
    { rootMargin: '-30% 0px -55% 0px' },
  );
  built.forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}

/**
 * 统一增强每个章节的浏览体验（无需改动各章节模块）：
 *  1. 幕内步骤指示器：在左侧图形上方显示一排圆点，标记「当前第几步 / 共几步」；
 *  2. 幕间导航：章节末尾插入「上一幕 / 下一幕」按钮，迷路时一键回到其它幕。
 */
function enhanceChapters(): void {
  const built = CHAPTERS.filter((c) => c.built);

  built.forEach((meta, idx) => {
    const section = document.getElementById(meta.id);
    if (!section) return;

    // —— 幕内步骤圆点 ——
    const media = section.querySelector<HTMLElement>('.sticky-media');
    const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
    if (media && steps.length > 0) {
      const tracker = document.createElement('div');
      tracker.className = 'step-tracker';
      tracker.title = '本幕进度：第 1 / N 步';
      tracker.innerHTML = steps
        .map((_, i) => `<span class="tracker-dot" data-i="${i}" title="第 ${i + 1} 步"></span>`)
        .join('');
      media.prepend(tracker);

      const sync = (): void => {
        const cur = section.querySelector<HTMLElement>('.step.current');
        const i = cur ? steps.indexOf(cur) : 0;
        tracker.querySelectorAll<HTMLElement>('.tracker-dot').forEach((d, di) => {
          d.classList.toggle('active', di === i);
        });
        tracker.title = `本幕进度：第 ${i + 1} / ${steps.length} 步`;
      };
      sync();
      const mo = new MutationObserver(sync);
      mo.observe(section.querySelector('.steps')!, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class'],
      });
    }

    // —— 幕间导航 ——
    const prev = idx > 0 ? built[idx - 1] : null;
    const next = idx < built.length - 1 ? built[idx + 1] : null;
    const nav = document.createElement('nav');
    nav.className = 'chapter-nav';
    nav.innerHTML = `
      <div>
        ${
          prev
            ? `<a class="btn btn-ghost" href="#${prev.id}">← ${prev.num} ${prev.title}</a>`
            : '<span class="btn btn-ghost" aria-disabled="true">← 已是第一幕</span>'
        }
      </div>
      <div>
        ${
          next
            ? `<a class="btn btn-primary" href="#${next.id}">${next.num} ${next.title} →</a>`
            : '<span class="btn btn-ghost" aria-disabled="true">下一幕 · 建设中</span>'
        }
      </div>
    `;
    section.appendChild(nav);
  });
}

/** 键盘 ← / → 在步骤之间跳转（左右方向键不会干扰页面默认滚动） */
function initKeyboardNav(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    if (['input', 'textarea', 'select', 'button', 'a'].includes(tag)) return;
    e.preventDefault();
    const steps = Array.from(document.querySelectorAll<HTMLElement>('.step'));
    if (steps.length === 0) return;
    const cur = steps.findIndex((s) => s.classList.contains('current'));
    const base = cur >= 0 ? cur : 0;
    const next = Math.max(0, Math.min(steps.length - 1, base + (e.key === 'ArrowRight' ? 1 : -1)));
    // 把目标步骤对齐到「活跃带」（视口约 52% 处），而不是视口顶部——
    // 这样滚动叙事引擎会恰好选中它，而不是被带内更靠后的步骤抢走。
    const band = window.innerHeight * 0.52;
    const top = steps[next].getBoundingClientRect().top + window.scrollY - band;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });
}

const app = document.getElementById('app')!;
app.append(buildNav(), buildHero());
mountAct00(app);
mountAct01(app);
mountAct02(app);
mountAct03(app);
mountAct04(app);
mountAct05(app);
mountAct06(app);
mountAct07(app);
mountAct08(app);
mountAct09(app);
mountAct10(app);
app.append(buildOutro(), buildFooter());
initProgress();
initNavSpy();
enhanceChapters();
initKeyboardNav();
