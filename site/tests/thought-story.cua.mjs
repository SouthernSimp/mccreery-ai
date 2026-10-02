// Run in cua_repl after entering the scroll story. Never submits a brief.
export async function checkThoughtStory(tab) {
  for (const [label, beat] of [['02 Local AI', '1'], ['03 Sky', '2'], ['04 Your Mac', '3'], ['01 Capture', '0']]) {
    await tab.playwright.getByRole('button', { name: label, exact: true }).click();
    await tab.getAXState({ emit: false });
    await tab.playwright.locator(`.opening-story[data-beat="${beat}"]`).waitFor({ state: 'attached' });
    const state = await tab.playwright.evaluate(() => ({
      fits: document.documentElement.scrollWidth <= innerWidth,
      navBottom: document.querySelector('.thought-nav').getBoundingClientRect().bottom,
      height: innerHeight,
      heroInert: document.querySelector('.hero').hasAttribute('inert'),
      videoReady: document.querySelector('.thought-video').duration > 0 && !document.querySelector('.thought-video').error,
    }));
    if (!state.fits || state.navBottom > state.height || !state.heroInert || !state.videoReady) throw Error(`${label}: ${JSON.stringify(state)}`);
  }
  return 'Forward and reverse chapters, video loading, hidden-hero focus, and viewport fit passed.';
}
