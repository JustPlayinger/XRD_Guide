/**
 * 第 10 幕 · 使用者的检查清单
 *
 * 把前面 9 幕的概念钉回真实 PDB 条目：输入 PDB ID，自动解析关键校验字段并红黄绿灯。
 * 联网时从 RCSB 拉取；离线时回退到内置数据（1CRN / 1EJG）。
 */

import { setupScrolly } from '../../lib/scrolly';
import { parsePdb } from '../../lib/pdb';
import type { PdbStats } from '../../lib/pdb';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: '读结构前，先看这一页数字',
    body:
      '现在你可以看懂第 0 幕那个 PDB 条目的全部字段了：分辨率是信息的截止频率（第 7 幕），R-free 是防过拟合的验证集（第 8 幕），B 因子是时空平均的糊（第 9 幕）。下面的检查器把这些数字一次性列出来，配上红黄绿灯——红灯不一定是坏结构，但它要求你停下来想想。',
  },
  {
    title: '用检查器读一个真实条目',
    body:
      '输入一个 PDB ID（试试 1EJG，0.54 Å 的超高分辨；或 1CRN，1981 年的老条目）。联网时从 RCSB 实时拉取，断网时回退到内置数据。注意红黄绿灯是启发式的：<strong>它们帮你发现问题，不替你下结论</strong>。',
  },
  {
    title: '三个最常踩的坑',
    body:
      '<strong>① 生物学组装体 ≠ 不对称单元</strong>（第 9 幕）：做对接/分析前先确认你用的是 biological assembly。② <strong>缺失残基</strong>：REMARK 465 里没被看见的区域，别当成不存在。③ <strong>配体与水的真实性</strong>：低分辨率下「看得见的配体」可能是模型偏倚（第 8 幕）。',
  },
  {
    title: '偏差会传播：给下游使用者的忠告',
    body:
      '批量下载结构跑对接、训练机器学习模型时，这些偏差不会消失，只会被放大：被压扁的 loop、被照坏的金属、过度拟合的侧链，全都进了你的训练集。AlphaFold 预测坐标也可能继承它们——pLDDT 高不等于实验证实。把检查器当习惯：下载结构前，先让这一页数字过一遍眼睛。',
  },
];

type Light = 'green' | 'yellow' | 'red' | 'none';

function trafficLight(v: number | null, good: number, warn: number): Light {
  if (v === null) return 'none';
  if (v <= good) return 'green';
  if (v <= warn) return 'yellow';
  return 'red';
}

interface Card {
  label: string;
  value: string;
  light: Light;
  hint: string;
}

function buildCards(s: PdbStats): Card[] {
  const rFreeGap = s.rFree !== null && s.rValue !== null ? s.rFree - s.rValue : null;
  return [
    {
      label: '实验方法',
      value: s.method || '未知',
      light: s.method.toUpperCase().includes('X-RAY') ? 'green' : s.method ? 'yellow' : 'none',
      hint: s.method.toUpperCase().includes('X-RAY') ? '本篇教程范围' : '非 X 射线：方法不同，校验口径也不同',
    },
    {
      label: '分辨率（Å）',
      value: s.resolution !== null ? `${s.resolution.toFixed(2)}` : '未报告',
      light: trafficLight(s.resolution, 2.5, 3.5),
      hint: '≤2.5 绿 · ≤3.5 黄 · 更差红（见第 7 幕）',
    },
    {
      label: 'R-free',
      value: s.rFree !== null ? `${s.rFree.toFixed(3)}` : '未报告（老条目）',
      light: trafficLight(s.rFree, 0.25, 0.35),
      hint: s.rFree === null ? '1992 年前的结构没有 R-free，缺一把尺子（第 0 幕）' : '≤0.25 绿 · ≤0.35 黄（见第 8 幕）',
    },
    {
      label: 'R-work − R-free',
      value: rFreeGap !== null ? `${rFreeGap.toFixed(3)}` : '—',
      light: rFreeGap === null ? 'none' : rFreeGap > 0.05 ? 'red' : 'green',
      hint: '差距大 = 过拟合信号（第 8 幕）',
    },
    {
      label: '数据完整性缺口（%）',
      value: s.completeness !== null ? `${(100 - s.completeness).toFixed(1)}` : '未报告',
      light: trafficLight(s.completeness === null ? null : 100 - s.completeness, 10, 20),
      hint: '缺失越多，密度越不可靠',
    },
    {
      label: '缺失残基',
      value: `${s.missingResidues}`,
      light: s.missingResidues === 0 ? 'green' : s.missingResidues <= 20 ? 'yellow' : 'red',
      hint: 'REMARK 465：没被看见 ≠ 不存在（第 0 幕）',
    },
    {
      label: '平均 B 因子（Å²）',
      value: s.meanB !== null ? `${s.meanB.toFixed(1)}` : '未计算',
      light: trafficLight(s.meanB, 40, 80),
      hint: '时空平均的糊（第 9 幕）',
    },
    {
      label: '数据冗余度',
      value: s.redundancy !== null ? `${s.redundancy.toFixed(1)}` : '未报告',
      light: s.redundancy !== null && s.redundancy < 2 ? 'yellow' : 'none',
      hint: '冗余度低 → 数据质量存疑',
    },
    {
      label: '空间群',
      value: s.spaceGroup || '未报告',
      light: 'none',
      hint: '判断不对称单元/组装体的起点（第 9 幕）',
    },
    {
      label: '溶剂 / 配体 (HETATM)',
      value: `${s.nHetatm}`,
      light: 'none',
      hint: '第 0 幕 HETATM 的讨论',
    },
  ];
}

export function mountAct10(parent: HTMLElement): void {
  const section = document.createElement('section');
  section.id = 'act-10';
  section.className = 'chapter';
  section.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-tag">ACT 10</span>
      <h2>使用者的检查清单</h2>
      <p class="chapter-lead">前面 9 幕的知识，最后落成一个工具：输入 PDB ID，让关键数字自己交代。红灯不一定代表坏结构，但它值得你停下来。</p>
      <div class="chapter-dep">本幕依赖：全部前面幕。</div>
    </header>
    <div class="chapter-grid">
      <div class="media sticky-media">
        <figure class="figure">
          <div class="inspector">
            <div class="inspector-bar">
              <input id="act10-id" type="text" placeholder="输入 PDB ID，如 1EJG / 1CRN" maxlength="4" value="1EJG" />
              <button class="btn btn-primary" id="act10-go">分析</button>
            </div>
            <div class="inspector-status" id="act10-status">等待分析…</div>
            <div class="inspector-cards" id="act10-cards"></div>
          </div>
          <details class="simplify">
            <summary>本工具的简化</summary>
            <p>红黄绿灯是启发式阈值，不是权威校验报告；解析器只处理常见 PDB 头格式，个别条目可能漏字段。权威校验请用 RCSB 的 Validation Report。</p>
          </details>
          <figcaption class="figure-caption">联网从 RCSB 拉取；断网回退内置 1CRN / 1EJG。</figcaption>
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

  const input = section.querySelector<HTMLInputElement>('#act10-id')!;
  const goBtn = section.querySelector<HTMLButtonElement>('#act10-go')!;
  const status = section.querySelector<HTMLElement>('#act10-status')!;
  const cardsEl = section.querySelector<HTMLElement>('#act10-cards')!;

  async function loadPdb(id: string): Promise<string> {
    const clean = id.trim().toUpperCase();
    try {
      const r = await fetch(`https://files.rcsb.org/download/${clean}.pdb`);
      if (r.ok) return await r.text();
      throw new Error('rcsb 404');
    } catch {
      const local = await fetch(`data/${clean.toLowerCase()}.pdb`);
      if (local.ok) return await local.text();
      throw new Error(`找不到条目 ${clean}`);
    }
  }

  async function analyze(): Promise<void> {
    const id = input.value.trim().toUpperCase();
    if (!id) return;
    status.textContent = `正在拉取 ${id}…`;
    cardsEl.innerHTML = '';
    try {
      const text = await loadPdb(id);
      const stats = parsePdb(text, id);
      status.textContent = `${id} 已解析：${stats.method || '方法未知'} · ${stats.nAtoms} 个 ATOM · ${stats.nHetatm} 个 HETATM`;
      const cards = buildCards(stats);
      cardsEl.innerHTML = cards
        .map(
          (c) => `
          <div class="inspector-card">
            <span class="inspector-light light--${c.light}"></span>
            <div class="inspector-card-body">
              <div class="inspector-label">${c.label}</div>
              <div class="inspector-value">${c.value}</div>
              <div class="inspector-hint">${c.hint}</div>
            </div>
          </div>`,
        )
        .join('');
    } catch (e) {
      status.textContent = `分析失败：${(e as Error).message}`;
    }
  }

  goBtn.addEventListener('click', () => {
    void analyze();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void analyze();
  });
  void analyze();

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.step'));
  setupScrolly(steps, {
    onStep: (i) => {
      steps.forEach((el, si) => el.classList.toggle('current', si === i));
    },
  });
}
