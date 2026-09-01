/**
 * 第 0 幕 · 案发现场：一个 PDB 条目里的可疑数字
 *
 * 叙事目标：让读者对自己熟悉的 .pdb 文件产生「这些数字到底怎么来的」的疑问。
 * 本幕只使用读者已知概念（PDB 文件、坐标、X 射线衍射这一行字），不引入任何新物理。
 * 交互：左侧是真实文件卡片（1CRN + 1EJG 对照），滚动右侧步骤时高亮对应行。
 */

import { setupScrolly } from '../../lib/scrolly';

const CARD_HTML = `
<div class="pdb-card">
  <div class="pdb-card-head">1CRN · crambin（1981）&nbsp;&nbsp;<span class="pdb-meta">X-RAY DIFFRACTION</span></div>
  <div class="pdb-card-body">
    <div class="pdb-line" data-seg="0"><span class="pdb-ln">1</span><span class="pdb-txt">HEADER    PLANT PROTEIN                           30-APR-81   1CRN</span></div>
    <div class="pdb-line" data-seg="0"><span class="pdb-ln">2</span><span class="pdb-txt">TITLE     WATER STRUCTURE OF A HYDROPHOBIC PROTEIN</span></div>
    <div class="pdb-line" data-seg="0"><span class="pdb-ln">3</span><span class="pdb-txt">EXPDTA    X-RAY DIFFRACTION</span></div>
    <div class="pdb-line" data-seg="1"><span class="pdb-ln">4</span><span class="pdb-txt">REMARK   2 RESOLUTION.    1.50 ANGSTROMS.</span></div>
    <div class="pdb-line" data-seg="2"><span class="pdb-ln">5</span><span class="pdb-txt">REMARK   3   R VALUE            (WORKING + TEST SET) : NULL</span></div>
    <div class="pdb-line" data-seg="2"><span class="pdb-ln">6</span><span class="pdb-txt">REMARK   3   R VALUE            (WORKING SET)        : NULL</span></div>
    <div class="pdb-line" data-seg="2"><span class="pdb-ln">7</span><span class="pdb-txt">REMARK   3   FREE R VALUE                             : NULL</span></div>
    <div class="pdb-line" data-seg="3"><span class="pdb-ln">8</span><span class="pdb-txt">ATOM      1  N   THR A   1     17.047  14.099   3.625  </span><span class="pdb-hl pdb-hl--occ">1.00</span> <span class="pdb-hl pdb-hl--b">13.79</span><span class="pdb-txt">           N</span></div>
    <div class="pdb-line" data-seg="3"><span class="pdb-ln">9</span><span class="pdb-txt">ATOM      2  CA  THR A   1     16.967  12.784   4.338  </span><span class="pdb-hl pdb-hl--occ">1.00</span> <span class="pdb-hl pdb-hl--b">10.80</span><span class="pdb-txt">           C</span></div>
    <div class="pdb-line" data-seg="3"><span class="pdb-ln">10</span><span class="pdb-txt">ATOM      3  C   THR A   1     15.685  12.755   5.133  </span><span class="pdb-hl pdb-hl--occ">1.00</span> <span class="pdb-hl pdb-hl--b">9.19</span><span class="pdb-txt">           C</span></div>
    <div class="pdb-line" data-seg="3"><span class="pdb-ln">11</span><span class="pdb-txt">ATOM      4  O   THR A   1     15.268  13.825   5.594  </span><span class="pdb-hl pdb-hl--occ">1.00</span> <span class="pdb-hl pdb-hl--b">9.85</span><span class="pdb-txt">           O</span></div>
    <div class="pdb-line pdb-line--synth" data-seg="4"><span class="pdb-ln">12</span><span class="pdb-tag">示例</span><span class="pdb-txt">HETATM  739  O   HOH A 139     20.771  11.192  -2.126  </span><span class="pdb-hl pdb-hl--occ">1.00</span> <span class="pdb-hl pdb-hl--b">32.57</span><span class="pdb-txt">           O</span></div>
    <div class="pdb-line pdb-line--synth" data-seg="5"><span class="pdb-ln">13</span><span class="pdb-tag">示例</span><span class="pdb-txt">REMARK 465   MET A   1   SER A   2   ALA A   3</span></div>
    <div class="pdb-line pdb-line--rule" data-seg="6"><span class="pdb-ln">·</span><span class="pdb-txt">对照：1EJG · crambin（2000）</span></div>
    <div class="pdb-line" data-seg="6"><span class="pdb-ln">14</span><span class="pdb-txt">REMARK   2 RESOLUTION.    0.54 ANGSTROMS.</span></div>
    <div class="pdb-line" data-seg="6"><span class="pdb-ln">15</span><span class="pdb-txt">REMARK   3   R VALUE            (WORKING SET) : 0.090</span></div>
    <div class="pdb-line" data-seg="6"><span class="pdb-ln">16</span><span class="pdb-txt">REMARK   3   FREE R VALUE                     : 0.094</span></div>
    <div class="pdb-line" data-seg="6"><span class="pdb-ln">17</span><span class="pdb-txt">REMARK 280 CRYSTALLIZATION: 40 MG/ML IN 80% ETHANOL VS 60% ETHANOL, PH 7</span></div>
  </div>
</div>`;

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '打开一个 PDB 条目',
    body:
      '你从数据库下载结构，得到的是一个 <code>.pdb</code> 文件：几百行 <code>ATOM</code> 记录，每行描述一个原子——名字、坐标 <code>(x, y, z)</code>、以及两个神秘的尾巴数字。而文件头的 <code>EXPDTA</code> 明明白白写着：<strong>X-RAY DIFFRACTION</strong>。也就是说，这份「结构」来自 X 射线衍射。本篇教程要回答：这些数字，是怎么从一束 X 射线变成坐标的？',
  },
  {
    title: 'RESOLUTION 1.50 —— 一个像「清晰度」的词',
    body:
      '1CRN 写的是 <code>RESOLUTION 1.50 Å</code>。直觉上它像相机的「像素」：数字越小越清楚。但 1.50 Å 到底意味着什么？它测的是什么？它在夸耀什么、又隐瞒什么？到第 7 幕，我们会亲手把一张密度图从衍射斑里重建出来。届时你会明白，<strong>分辨率不是坐标误差，而是信息的截止频率</strong>。',
  },
  {
    title: 'R value : NULL —— 一把缺了的尺子',
    body:
      '1981 年的 1CRN，<code>REMARK 3</code> 里几乎所有校验字段都是 <code>NULL</code>。其中 <code>R VALUE</code> 与 <code>FREE R VALUE</code> 尤其值得注意：R-free 是 1992 年才发明的「防过拟合」指标——把一部分衍射斑留出来、<em>不</em>用于拟合，专门检验模型是否在骗你。所以：<strong>1981 年的结构没有这把尺子</strong>。读老条目时，请记得它缺少你习以为常的校验。',
  },
  {
    title: '每个原子一行：坐标、占有率与 B 因子',
    body:
      '每行 ATOM 的尾巴是 <span class="hl-occ">占有率 occupancy</span> 与 <span class="hl-b">B 因子</span>。1.00 表示「假设这个位置一定被原子占据」；13.79 表示「假设原子以高斯方式在这个位置附近抖动，模糊程度是这个量级」。注意措辞：<strong>这是模型假设，不是直接测量</strong>。B 因子大不等于原子真的在动——它只是说「如果按这个模型，它表现为很模糊」。第 9 幕会看到，B 因子其实是时空平均的产物。',
  },
  {
    title: 'HETATM —— 水分子',
    body:
      '<code>ATOM</code> 之后常跟着一串 <code>HETATM</code> 水分子。放几颗水、放不放水，都能显著改善 R 值——那么这些水是「证据」，还是「为了让拟合更好看而添加的愿望」？这到今天仍是结构争论的焦点。有趣的是：1CRN 现在的版本一行水都没有列出，可它的标题（TITLE）恰恰在讲水分子环。右图「示例」行只是格式示意。',
  },
  {
    title: 'REMARK 465 —— 缺失残基',
    body:
      '如果某段主链在密度图里没有信号，建模者会略过它，并在 <code>REMARK 465</code> 里登记为「缺失」。于是 PDB 里「缺失」的真实含义是「没被看见」，而不是「不存在」。1CRN 的 46 个残基全部建模了——很多结构做不到这一点。下次下载结构，先数数它缺了什么。右图「示例」行只是格式示意。',
  },
  {
    title: '40 年后，同一块蛋白',
    body:
      '2000 年，同一块 crambin 被做到 0.54 Å（1EJG）：<code>R_work = 0.090</code>，<code>R_free = 0.094</code>，两者几乎重合——模型没有「记住」衍射数据，值得信赖。对照 1981 年的 1CRN：分辨率 1.50 Å，R 值字段空缺。同一个蛋白，两代数据：分辨率的差距是细节的差距，校验字段的有无是可信度的差距。<strong>现在你只握着文件里的这些数字。接下来，我们从那束 X 射线开始，把它们从头造一遍。</strong>',
  },
];

export function mountAct00(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-0';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 0</span>
      <h2>案发现场：一个 PDB 条目里的可疑数字</h2>
      <p class="chapter-lead">你下载过的每个结构文件，都以「X-RAY DIFFRACTION」开头……但「衍射」到底发生了什么？先别急着接受，看看文件里那些你读过、却从没质疑过的数字。</p>
      <div class="chapter-dep">本幕依赖：PDB 文件、坐标 —— 读者已知概念。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure">
          ${CARD_HTML}
          <figcaption class="figure-caption">真实文件：PDB 1CRN（crambin，1981）。标「示例」的两行仅为格式示意。滚动右侧文字，左侧高亮对应行。</figcaption>
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

  const card = section.querySelector<HTMLElement>('.pdb-card-body')!;
  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));

  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
      card.querySelectorAll('.pdb-line').forEach((el) => {
        el.classList.toggle('active', el.getAttribute('data-seg') === String(i));
      });
      const active = card.querySelector<HTMLElement>('.pdb-line.active');
      if (active) {
        const cardRect = card.getBoundingClientRect();
        const lineRect = active.getBoundingClientRect();
        card.scrollTop += lineRect.top - cardRect.top - 10;
      }
    },
  });
}
