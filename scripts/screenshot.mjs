// 无头浏览器冒烟测试：启动 preview 服务 → 加载页面 → 逐屏截图 + 收集控制台错误
// 用法：node scripts/screenshot.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT = 'C:/temp/xrd-shots';
mkdirSync(OUT, { recursive: true });

// 定位已下载的 Chromium 可执行文件（完整版 chrome-win64 或 headless-shell 皆可）
function findChrome() {
  const base = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'ms-playwright')
    : null;
  if (!base || !existsSync(base)) return null;
  for (const d of readdirSync(base)) {
    const cands = [
      join(base, d, 'chrome-win64', 'chrome.exe'),
      join(base, d, 'chrome-win', 'chrome.exe'),
      join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
      join(base, d, 'chrome-headless-shell-win', 'chrome-headless-shell.exe'),
    ];
    for (const c of cands) {
      if (existsSync(c)) return c;
    }
  }
  return null;
}

const exe = findChrome();
if (!exe) {
  console.error('未找到 Chromium，请先运行: npx playwright install chromium');
  process.exit(2);
}
console.log('using chrome:', exe);

const server = spawn('npm.cmd', ['run', 'preview', '--', '--port', '4173'], {
  cwd: 'f:/project/XRD_Guide',
  shell: true,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.screenshot({ path: `${OUT}/full.png`, fullPage: true });

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/hero.png` });

const scrollTo = async (selector, offset) => {
  const box = await page.locator(selector).boundingBox();
  if (!box) {
    errors.push(`[missing] ${selector}`);
    return;
  }
  await page.evaluate(({ y, offset: o }) => window.scrollTo(0, y + o), { y: box.y, offset });
  await page.waitForTimeout(500);
};

await scrollTo('#act-0', 420);
await page.screenshot({ path: `${OUT}/act0.png` });

await scrollTo('#act-0', 1600);
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/act0-late.png` });

await scrollTo('#act-1', 300);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/act1.png` });

await scrollTo('#act-1', 1700);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/act1-late.png` });

await scrollTo('#act-2', 300);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/act2.png` });

await scrollTo('#act-2', 1200);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/act2-late.png` });

await scrollTo('#act-6', 300);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/act6.png` });

await scrollTo('#act-10', 200);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/act10.png` });

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/footer.png` });

console.log('CONSOLE/PAGE ERRORS:');
console.log(errors.length ? errors.join('\n') : '(none)');
await browser.close();
server.kill();
process.exit(errors.length ? 1 : 0);
