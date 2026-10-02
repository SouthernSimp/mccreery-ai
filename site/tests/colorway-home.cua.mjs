// Run in cua_repl with the local preview. This check never sends a project brief.
import { checkDarkHome } from './dark-home.cua.mjs';
export async function checkColorwayHome(tab) {
  const assert = (value, message) => { if (!value) throw Error(message); };
  await checkDarkHome(tab);
  await tab.playwright.getByRole('button', { name: 'Quick chat', exact: true }).click();
  assert(await tab.playwright.getByRole('button', { name: 'Quick chat', exact: true }).getAttribute('aria-pressed') === 'true', 'Ring selection must update');
  assert((await tab.playwright.locator('.ring-description').innerText()).includes('local AI'), 'Ring must describe selected tool');
  await tab.playwright.getByRole('button', { name: 'Close tool ring', exact: true }).click();
  assert(await tab.playwright.getByRole('button', { name: 'Open tool ring', exact: true }).isVisible(), 'Ring must close');
  await tab.playwright.getByRole('button', { name: 'Open tool ring', exact: true }).click();
  await tab.playwright.getByRole('button', { name: 'Expand note stack', exact: true }).click();
  assert(await tab.playwright.getByRole('button', { name: 'Fold note stack', exact: true }).getAttribute('aria-expanded') === 'true', 'Stack must unfold');
  await tab.playwright.getByRole('button', { name: 'Fold note stack', exact: true }).click();
  await tab.playwright.getByLabel('A thought to capture', { exact: true }).fill('  Keep an idea  ');
  await tab.playwright.getByRole('button', { name: 'Capture this thought', exact: true }).click();
  assert((await tab.playwright.locator('.captured-note').innerText()).includes('Keep an idea'), 'Capture must preserve the thought');
  assert(await tab.playwright.getByLabel('A thought to capture', { exact: true }).getAttribute('value') === '', 'Capture input must clear');
  await tab.playwright.getByRole('button', { name: 'Detail', exact: true }).click();
  assert(await tab.playwright.getByRole('button', { name: 'Detail', exact: true }).getAttribute('aria-pressed') === 'true', 'Sky detail must select');
  await tab.playwright.getByRole('button', { name: 'Overview', exact: true }).click();
  await tab.playwright.getByText('How privacy works', { exact: true }).click();
  assert((await tab.playwright.locator('.privacy-details').innerText()).includes('provider receives'), 'Privacy disclosure must open');
  await tab.playwright.getByText('How privacy works', { exact: true }).click();
  await tab.playwright.getByLabel('Your desired outcome', { exact: true }).fill('Make daily work easier');
  await tab.playwright.getByRole('button', { name: 'Continue →', exact: true }).click();
  await tab.playwright.getByLabel('Your current workflow or challenge', { exact: true }).fill('Too much manual copying');
  await tab.playwright.getByRole('button', { name: 'Continue →', exact: true }).click();
  assert(await tab.playwright.getByLabel('Email address', { exact: true }).isVisible(), 'Brief must reach contact step');
  await tab.playwright.getByRole('button', { name: '← Back', exact: true }).click();
  await tab.playwright.getByRole('button', { name: '← Back', exact: true }).click();
  await tab.getAXState({emit:false});
  assert(await tab.playwright.evaluate(() => document.querySelector('textarea[name=outcome]').value === 'Make daily work easier'), 'Back must preserve the brief');
  assert(await tab.playwright.evaluate(() => document.activeElement.tagName === 'H3'), 'Back must focus the updated heading');
  assert(await tab.playwright.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page must fit the viewport');
  return 'Colorway interactions passed; no brief sent.';
}
