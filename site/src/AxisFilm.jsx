import { useEffect, useRef } from 'react';
import { clamp, filmProgress, lerp, pointerOffset } from './site.js';

export function AxisFilm() {
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    const story = video.closest('.story');
    const stage = video.closest('.story-stage');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || navigator.connection?.saveData || !video.canPlayType('video/mp4')) return;
    const mobile = matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;
    const fine = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)').matches;
    let height = story.offsetHeight, viewport = stage.offsetHeight, width = innerWidth;
    let target = filmProgress(story.getBoundingClientRect().top, height, viewport);
    let progress = target, duration = 0, active = true, frame = 0;
    let targetX = 0, targetY = 0, x = 0, y = 0;
    function tick() {
      frame = 0;
      if (!active || !duration) return;
      target = filmProgress(story.getBoundingClientRect().top, height, viewport);
      progress = lerp(progress, target, mobile ? .18 : .24);
      x = lerp(x, targetX, .1); y = lerp(y, targetY, .1);
      const time = Math.max(0, Math.min(duration, clamp(progress) * duration + pointerOffset(progress, x, y, fine)));
      if (!video.seeking && Math.abs(video.currentTime - time) > 1 / (mobile ? 24 : 30)) {
        try { video.currentTime = time; } catch { /* Metadata may still be loading. */ }
      }
      frame = requestAnimationFrame(tick);
    }
    function start() { if (!frame && active && duration) frame = requestAnimationFrame(tick); }
    function loaded() {
      if (!Number.isFinite(video.duration)) return;
      duration = Math.max(0, video.duration - .04);
      video.currentTime = Math.max(.001, target * duration);
      start();
    }
    function ready() { video.dataset.ready = 'true'; }
    function resize() {
      if (mobile && width === innerWidth) return;
      width = innerWidth; height = story.offsetHeight; viewport = stage.offsetHeight;
      start();
    }
    function pointer(event) { targetX = event.clientX / innerWidth * 2 - 1; targetY = event.clientY / innerHeight * 2 - 1; }
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) start(); else { cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: '25% 0px' });
    observer.observe(story);
    video.addEventListener('loadeddata', loaded);
    video.addEventListener('seeked', ready);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    if (fine) window.addEventListener('pointermove', pointer, { passive: true });
    video.preload = 'auto'; video.load();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      video.removeEventListener('loadeddata', loaded); video.removeEventListener('seeked', ready);
      window.removeEventListener('resize', resize); window.removeEventListener('orientationchange', resize);
      window.removeEventListener('pointermove', pointer);
    };
  }, []);
  return <div className="axis-film" aria-hidden="true">
    <picture><source media="(max-width: 900px)" srcSet="/assets/private-axis-higgsfield-pass-05-mobile-poster.jpg" /><img src="/assets/private-axis-higgsfield-pass-05-poster.jpg" alt="" /></picture>
    <video ref={videoRef} muted playsInline preload="none" tabIndex={-1}>
      <source media="(max-width: 900px), (hover: none) and (pointer: coarse)" src="/assets/private-axis-higgsfield-pass-05-mobile.mp4" type="video/mp4" />
      <source media="(min-width: 1280px) and (min-resolution: 1.5dppx)" src="/assets/private-axis-higgsfield-pass-05.mp4" type="video/mp4" />
      <source src="/assets/private-axis-higgsfield-pass-05-desktop.mp4" type="video/mp4" />
    </video>
  </div>;
}
