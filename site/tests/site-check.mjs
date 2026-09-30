import assert from 'node:assert/strict';
import { filmProgress, lerp, pointerOffset, sendBrief } from '../src/site.js';
assert.equal(filmProgress(0, 4000, 800), 0);
assert.equal(filmProgress(-3200, 4000, 800), 1);
assert.equal(filmProgress(-1600, 4000, 800), .5);
assert.equal(filmProgress(100, 800, 800), 0);
assert.equal(lerp(0, 1, .2), .2);
assert.equal(pointerOffset(.5, 1, 1, false), 0);
assert.ok(Math.abs(pointerOffset(1, 1, 1, true)) < .00001);
const brief = {name:'Test',email:'test@example.com',outcome:'Search documents',friction:'Manual work'};
assert.equal(await sendBrief(brief, async (url, options) => {
  assert.equal(url, 'https://os.mccreery.ai/api/contact');
  assert.equal(options.method, 'POST');
  assert.deepEqual(JSON.parse(options.body), {name:brief.name,email:brief.email,message:'Desired outcome: Search documents\n\nCurrent friction: Manual work',source:'mccreery.ai'});
  return {ok:true,json:async()=>({message:'Received'})};
}), 'Received');
await assert.rejects(sendBrief(brief, async()=>({ok:false,json:async()=>({detail:'Unavailable'})})), /Unavailable/);
await assert.rejects(sendBrief(brief, async()=>({ok:false,json:async()=>{throw Error('invalid JSON')}})), /could not be sent/);
console.log('Scroll math and contact delivery checks passed. No live contact message sent.');
