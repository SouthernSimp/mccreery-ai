import { useEffect, useRef, useState } from 'react';
import { clamp, filmProgress, lerp } from './site.js';

const beats = ['Capture', 'Local AI', 'Sky', 'Your Mac'];
const positions = [.23, .46, .69, .91];
const phaseAt = p => p < .13 ? -1 : p < .36 ? 0 : p < .59 ? 1 : p < .82 ? 2 : 3;
const ramp = (p, start, end) => clamp((p - start) / (end - start));

export function ThoughtStory({ children }) {
  const root = useRef(null), film = useRef(null), meter = useRef(null);
  const [enabled, setEnabled] = useState(false), [beat, setBeat] = useState(-1);
  useEffect(() => {
    const story = root.current, video = film.current, hero = story.querySelector('.hero');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, progress = 0, active = false, phase = -1;
    function tick() {
      frame = 0;
      if (reduced.matches || !active || story.dataset.motion !== 'scroll') return;
      const stage = story.querySelector('.opening-stage');
      const target = filmProgress(story.getBoundingClientRect().top, story.offsetHeight, stage.offsetHeight);
      progress = lerp(progress, target, .16);
      if (Math.abs(target - progress) < .0003) progress = target;
      story.style.setProperty('--journey', progress);
      story.style.setProperty('--hero-out', ramp(progress, .015, .13));
      story.style.setProperty('--film-in', ramp(progress, .065, .16));
      story.style.setProperty('--film-dim', ramp(progress, .32, .43) * .58);
      story.style.setProperty('--sky-in', ramp(progress, .54, .65));
      story.style.setProperty('--sky-pullback', ramp(progress, .59, .82));
      meter.current.value = progress;
      const next = phaseAt(progress);
      if (next !== phase) { phase = next; setBeat(next); }
      hero.inert = next !== -1;
      if (video.readyState >= 2 && Number.isFinite(video.duration) && !video.seeking) {
        const time = ramp(progress, .12, .74) * Math.max(0, video.duration - .05);
        if (Math.abs(video.currentTime - time) > 1 / 24) video.currentTime = time;
      }
      if (progress !== target || video.seeking) frame = requestAnimationFrame(tick);
    }
    function schedule() { if (!frame && active && !reduced.matches && story.dataset.motion === 'scroll') frame = requestAnimationFrame(tick); }
    function changed() {
      const allowed = !reduced.matches && !navigator.connection?.saveData;
      story.dataset.motion = allowed ? 'scroll' : 'static';
      setEnabled(allowed);
      if (allowed) { video.preload = 'auto'; if (!video.currentSrc) video.load(); schedule(); }
      else { cancelAnimationFrame(frame); frame = 0; hero.inert = false; video.pause(); }
    }
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) schedule(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    observer.observe(story);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    video.addEventListener('loadeddata', schedule);
    video.addEventListener('seeked', schedule);
    reduced.addEventListener('change', changed);
    changed();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame); hero.inert = false;
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      video.removeEventListener('loadeddata', schedule); video.removeEventListener('seeked', schedule);
      reduced.removeEventListener('change', changed);
    };
  }, []);
  function go(index) {
    const story = root.current, stage = story.querySelector('.opening-stage');
    window.scrollTo({ top: scrollY + story.getBoundingClientRect().top + positions[index] * (story.offsetHeight - stage.offsetHeight), behavior: 'smooth' });
  }
  return <div ref={root} className="opening-story" data-motion={enabled ? 'scroll' : 'static'} data-beat={beat} id="home">
    <div className="opening-stage">
      {children}
      <div className="thought-sequence" aria-hidden={!enabled || beat === -1}>
        <div className="thought-film" aria-hidden="true"><img src="/assets/osat-connected-thoughts-poster.jpg" width="1280" height="720" alt="" /><video ref={film} className="thought-video" muted playsInline preload="none" tabIndex={-1} poster="/assets/osat-connected-thoughts-poster.jpg"><source src="/assets/osat-connected-thoughts.mp4" type="video/mp4" /></video></div>
        <div className="thought-sky" aria-hidden="true"><img src="/assets/osat-sky-retina.webp" width="3915" height="1350" alt="" /></div>
        <section className="thought-chapter thought-capture" aria-hidden={beat !== 0} inert={beat !== 0}>
          <p className="eyebrow">ONE THOUGHT CAN GO A LONG WAY.</p><h2>It starts with<br /><span>a little thought.</span></h2><p className="chapter-description">Catch it. Give it a place.<br />Let the next step unfold.</p>
        </section>
        <section className="thought-chapter thought-ai" aria-hidden={beat !== 1} inert={beat !== 1}>
          <div><p className="eyebrow">YOUR NOTES. A LITTLE CLARITY.</p><h2>Ask what<br /><span>you already know.</span></h2><p className="chapter-description">Your local AI. Your project context.<br />The source, right beside the answer.</p><a className="text-link" href="#local-ai">Explore local AI <img className="icon" src="/assets/icons/ArrowRight.svg" alt="" /></a></div>
          <figure className="thought-answer"><div className="answer-label"><img className="icon" src="/assets/icons/Sparkle.svg" alt="" /><span>OSAT / Local AI</span></div><img src="/assets/osat-ask-retina.webp" width="1000" height="400" alt="A saved OSAT conversation asks what Northstar needs before design starts. The answer identifies the client logo and shows the Northstar client brief as its source." /><figcaption><img className="icon" src="/assets/icons/NotePencil.svg" alt="" />A saved conversation. Grounded in a source note.</figcaption></figure>
        </section>
        <section className="thought-chapter thought-map" aria-hidden={beat !== 2} inert={beat !== 2}>
          <p className="eyebrow">FROM ONE NOTE TO THE WHOLE PICTURE.</p><h2>Follow the thought.<br /><span>Find the connection.</span></h2><p className="chapter-description">Your notes, projects, and next steps.<br />A little more connected.</p><a className="text-link" href="#connections">Explore Sky <img className="icon" src="/assets/icons/ArrowRight.svg" alt="" /></a>
        </section>
        <section className="thought-chapter thought-promise" aria-hidden={beat !== 3} inert={beat !== 3}>
          <p className="eyebrow">ROOM TO THINK. FREEDOM TO WORK.</p><h2>Your workspace.<br /><span>Your local AI.</span></h2><p className="chapter-description">On your Mac. Built to work offline.<br /><small>Local AI works offline after initial model setup.</small></p><a className="thought-bots" href="#bots"><img className="icon" src="/assets/icons/Robot.svg" alt="" />Bots, coming soon <img className="icon" src="/assets/icons/ArrowUpRight.svg" alt="" /></a>
        </section>
        <div className="thought-nav" inert={beat === -1}><nav aria-label="Follow a thought">{beats.map((label, index) => <button key={label} onClick={() => go(index)} aria-current={beat === index ? 'step' : undefined}><span>0{index + 1}</span>{label}</button>)}</nav><progress ref={meter} max="1" value="0" aria-hidden="true" /><a href="#osat" className="thought-skip">Explore the tools <img className="icon" src="/assets/icons/ArrowDown.svg" alt="" /></a></div>
      </div>
    </div>
  </div>;
}
