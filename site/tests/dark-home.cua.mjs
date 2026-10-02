// Run in cua_repl: import this file, then await checkDarkHome(tab).
// Use the local homepage at desktop and mobile widths. Never submits the brief.
export async function checkDarkHome(tab) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  await tab.playwright.getByRole('button', { name: 'Watch demo' }).click();
  await tab.getAXState({emit:false});
  const opened = await tab.playwright.evaluate(() => ({
    open: document.querySelector('dialog').open,
    paused: document.querySelector('.osat-video').paused,
    focused: document.activeElement.getAttribute('aria-label'),
  }));
  assert(opened.open && !opened.paused && opened.focused === 'Close demo', 'Demo must play and focus Close');
  await tab.pressKey(null, 'Escape');
  await tab.getAXState({emit:false});
  const closed = await tab.playwright.evaluate(() => ({
    open: document.querySelector('dialog').open,
    paused: document.querySelector('.osat-video').paused,
    focused: document.activeElement.textContent,
    fits: document.documentElement.scrollWidth <= innerWidth,
  }));
  assert(!closed.open && closed.paused && closed.focused.includes('Watch demo') && closed.fits, 'Escape must pause, restore focus, and fit the viewport');
  const menu = tab.playwright.getByRole('button', { name: 'Menu', exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    assert(await tab.playwright.getByRole('button', { name: 'Close', exact: true }).getAttribute('aria-expanded') === 'true', 'Menu must expand');
    await tab.pressKey(null, 'Escape');
    assert(await menu.getAttribute('aria-expanded') === 'false', 'Escape must close the menu');
  }
  return 'Dark homepage interaction check passed';
}
