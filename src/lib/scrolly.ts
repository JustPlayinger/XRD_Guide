/**
 * scrolly.ts —— 滚动叙事（scrollytelling）引擎
 *
 * 原理：把一列 `.step` 元素与「视口活跃带」比较，判断当前应该激活第几步。
 * 活跃带取在视口垂直方向约 55% 处（中心略偏上）。
 * 选中规则：顶部边缘仍在活跃带之上的最后一个 step 即为当前步。
 * 任何章节都可以用 `setupScrolly(steps, { onStep })` 接入，
 * 由 onStep 驱动左侧粘性画布 / 卡片的内容切换。
 */

export interface ScrollyOptions {
  /** 每一步被激活时回调（只在索引变化时触发一次） */
  onStep?: (index: number, el: HTMLElement) => void;
}

/**
 * 监听一组 step 元素，返回一个清理函数（卸载页面章节时调用）。
 */
export function setupScrolly(steps: HTMLElement[], opts: ScrollyOptions = {}): () => void {
  let current = -1;
  let frame = 0;

  const pick = (): void => {
    if (steps.length === 0) return;
    const band = window.innerHeight * 0.55;
    let best = -1;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].getBoundingClientRect().top <= band) best = i;
    }
    if (best === -1) best = 0;
    if (best !== current) {
      current = best;
      opts.onStep?.(best, steps[best]);
    }
  };

  const onScroll = (): void => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(pick);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  pick();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
