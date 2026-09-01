// 浏览器内功能验证（比截图更严格的 DOM/像素断言）
// 用法：node scripts/verify.mjs
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

function findChrome() {
  const base = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'ms-playwright') : null;
  if (!base || !existsSync(base)) return null;
  for (const d of readdirSync(base)) {
    for (const c of [
      join(base, d, 'chrome-win64', 'chrome.exe'),
      join(base, d, 'chrome-win', 'chrome.exe'),
      join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
    ]) {
      if (existsSync(c)) return c;
    }
  }
  return null;
}

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const server = spawn('npm.cmd', ['run', 'preview', '--', '--port', '4174'], {
  cwd: 'f:/project/XRD_Guide',
  shell: true,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch({ executablePath: findChrome() });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
});
await page.waitForTimeout(1200);

// 1. 章节数量与导航
check(
  '两个章节已挂载',
  (await page.locator('section.chapter').count()) === 2,
  `${await page.locator('section.chapter').count()} sections`,
);
check(
  '顶部导航包含 11 幕索引',
  (await page.locator('.topbar-link').count()) === 11,
  `${await page.locator('.topbar-link').count()} links`,
);

// 2. PDB 卡片内容与滚动联动
const lineCount = await page.locator('.pdb-card .pdb-line').count();
check('PDB 卡片包含 18 行', lineCount === 18, `${lineCount} lines`);

const scrollY = async (y) => {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(500);
};

const act0Box = await page.locator('#act-0').boundingBox();

// 页面初始在顶部 → 第 0 步激活，高亮 data-seg="0"（seg=0 有三行，需 first()）
const seg0 = await page
  .locator('.pdb-card .pdb-line.active')
  .first()
  .getAttribute('data-seg')
  .catch(() => null);
check('初始时 PDB 高亮 seg=0', seg0 === '0', `active seg=${seg0}`);

// 滚动到第 0 幕末尾 → 最后一步（seg=6）激活
await scrollY(act0Box.y + 1300);
const seg6 = await page
  .locator('.pdb-card .pdb-line.active')
  .first()
  .getAttribute('data-seg')
  .catch(() => null);
check('滚动到幕末高亮 seg=6', seg6 === '6', `active seg=${seg6}`);
check('存在 .current 步（每幕一个）', (await page.locator('.step.current').count()) >= 1);

// 3. 波动场画布：先把画布滚入视口（视口外会被自动暂停），再采样像素
await page.locator('#act1-wave').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
const canvasStats = await page.evaluate(() => {
  const c = document.getElementById('act1-wave');
  if (!c) return null;
  const ctx = c.getContext('2d');
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0;
  let sum2 = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 200) {
    const v = data[i];
    sum += v;
    sum2 += v * v;
    n++;
  }
  const mean = sum / n;
  return { n, mean, variance: sum2 / n - mean * mean };
});
check(
  '波动场画布有内容（像素方差 > 50）',
  canvasStats !== null && canvasStats.variance > 50,
  `variance=${canvasStats?.variance.toFixed(1)}`,
);

// 4. 波动动画随时间推进（两帧像素签名不同）
const frameSig = await page.evaluate(() => {
  const c = document.getElementById('act1-wave');
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 200) s += d[i] * 37 + d[i + 1] * 17;
  return s;
});
await page.waitForTimeout(400);
const frameSig2 = await page.evaluate(() => {
  const c = document.getElementById('act1-wave');
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 200) s += d[i] * 37 + d[i + 1] * 17;
  return s;
});
check('波动动画在运行（两帧签名不同）', frameSig !== frameSig2);

// 5. 第 1 幕滚动联动：把最后一步滚入视口 → 自动应用「硬 X 射线」
await page.locator('#act-1 .step').last().scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
const readout = await page.locator('#act1-readout').textContent();
check('滚动到第 1 幕末尾自动应用「硬 X 射线」', (readout ?? '').includes('0.12'), readout ?? '');

// 6. 无横向溢出
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 1,
);
check('无横向溢出', !overflow);

// 7. 控制台无错误（除 favicon 外）
const realErrors = consoleErrors.filter((e) => !e.includes('favicon'));
check('无页面/控制台错误', realErrors.length === 0, realErrors.join(' | '));

// 8. 浏览体验增强（引导区 / 步骤圆点 / 幕间导航 / 键盘翻步）
check('首屏包含「怎么读」引导', (await page.locator('.how-to').count()) === 1);
check('每幕都有步骤圆点指示器', (await page.locator('.step-tracker').count()) === 2);
const dots0 = await page.locator('#act-0 .tracker-dot').count();
const dots1 = await page.locator('#act-1 .tracker-dot').count();
check('圆点数量与步骤数一致', dots0 === 7 && dots1 === 4, `act0=${dots0} act1=${dots1}`);
check('每幕都有幕间导航', (await page.locator('.chapter-nav').count()) === 2);
check(
  'ACT0 有「下一幕 → ACT1」链接',
  (await page.locator('#act-0 .chapter-nav a[href="#act-1"]').count()) === 1,
);
check(
  'ACT1 显示「下一幕 · 建设中」',
  (await page.locator('#act-1 .chapter-nav .btn[aria-disabled="true"]').count()) >= 1,
);

// 键盘 ←/→ 翻步
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const stepBefore = await page
  .locator('.step.current')
  .first()
  .getAttribute('data-step');
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(1300);
const stepAfter = await page
  .locator('.step.current')
  .first()
  .getAttribute('data-step');
check(
  '键盘 → 前进到下一步',
  stepBefore === '0' && stepAfter === '1',
  `before=${stepBefore} after=${stepAfter}`,
);
const activeDotBefore = await page
  .locator('#act-0 .tracker-dot.active')
  .getAttribute('data-i');
check('圆点指示器同步到第 2 步', activeDotBefore === '1', `active dot=${activeDotBefore}`);

await browser.close();
server.kill();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 项通过`);
process.exit(failed.length ? 1 : 0);
