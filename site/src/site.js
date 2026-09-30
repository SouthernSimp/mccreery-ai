export const clamp = (value) => Math.max(0, Math.min(1, value));
export const filmProgress = (top, height, viewport) => clamp(-top / Math.max(1, height - viewport));
export const lerp = (value, target, amount = .2) => value + (target - value) * clamp(amount);
export const pointerOffset = (progress, x, y, enabled) => enabled ? Math.max(-1, Math.min(1, x + y * .35)) * .22 * Math.sin(Math.PI * clamp(progress)) : 0;
export async function sendBrief(brief, request = fetch) {
  const response = await request('https://os.mccreery.ai/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: brief.name, email: brief.email, message: `Desired outcome: ${brief.outcome}\n\nCurrent friction: ${brief.friction}`, source: 'mccreery.ai' }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || 'Your brief could not be sent. Please try again or email Nate.');
  return result.message || 'Your brief has been sent. I’ll be in touch.';
}
