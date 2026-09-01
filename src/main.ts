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

interface ChapterMeta {
  id: string;
  num: string;
  title: string;
  built: boolean;
}

const CHAPTERS: ChapterMeta[] = [
  { id: 'act-0', num: 'ACT 0', title: '案发现场', built: true },
  { id: 'act-1', num: 'ACT 1', title: '看见需要波', built: true },
  { id: 'act-2', num: 'ACT 2', title: '透镜的缺席', built: false },
  { id: 'act-3', num: 'ACT 3', title: '斑点从哪来', built: false },
  { id: 'act-4', num: 'ACT 4', title: '为什么非要晶体', built: false },
  { id: 'act-5', num: 'ACT 5', title: '格子 × 内容', built: false },
  { id: 'act-6', num: 'ACT 6', title: '相位问题', built: false },
  { id: 'act-7', num: 'ACT 7', title: '分辨率', built: false },
  { id: 'act-8', num: 'ACT 8', title: '从密度到坐标', built: false },
  { id: 'act-9', num: 'ACT 9', title: '晶体不是细胞', built: false },
  { id: 'act-10', num: 'ACT 10', title: '使用者的检查清单', built: false },
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
    <p class="hero-kicker">交互式可视化 · X 射线单晶衍射从零构建</p>
    <h1 class="hero-title">看不见的原子</h1>
    <p class="hero-sub">
      从一束 X 射线，到 PDB 里的一行坐标。<br />
      我们会把这条链<strong>从头造一遍</strong>——造完你就知道，该相信它到什么程度。
    </p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="#act-0">开始阅读 ↓</a>
      <span class="hero-note">第 0–1 幕已完成 · 共 11 幕，持续更新</span>
    </div>
    <div class="principles">
      <div class="principle-card">
        <h4>概念守恒律</h4>
        <p>每一幕只使用「读者已知的概念」或「前文亲手建立的概念」。不允许从天上掉下来一个术语。</p>
      </div>
      <div class="principle-card">
        <h4>先现象，后命名</h4>
        <p>先看到现象、归纳规律，最后才给学名。而每个学名，都对应到 PDB 文件里的某个字段。</p>
      </div>
      <div class="principle-card">
        <h4>诚实标注律</h4>
        <p>每张图都标注「做了哪些简化」。因为认识局限本身，正是这个项目要训练的直觉。</p>
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
    <p class="hero-footnote">你在这里：第 0–1 幕。</p>
  `;
  return hero;
}

function buildOutro(): HTMLElement {
  const outro = document.createElement('section');
  outro.id = 'next';
  outro.className = 'outro';
  outro.innerHTML = `
    <h2>下一幕预告</h2>
    <p>
      ACT 1 的结论是：只有 X 射线拥有看清原子的波长。<br />
      但 X 射线折射率 ≈ 1 —— <strong>它不能被透镜聚焦</strong>。
      ACT 2 将把「看见」拆成「散射」与「聚焦」两半，
      然后你会发现 X 射线世界里缺了整整一半。麻烦，从「相位」两个字开始。
    </p>
    <div class="outro-actions">
      <a class="btn btn-ghost" href="#hero">回到开头</a>
      <span class="hero-note">下一幕（ACT 2）将在里程碑 M2 中发布。</span>
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

const app = document.getElementById('app')!;
app.append(buildNav(), buildHero());
mountAct00(app);
mountAct01(app);
app.append(buildOutro(), buildFooter());
initProgress();
initNavSpy();
