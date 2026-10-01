import { useEffect, useRef, useState } from 'react';
import { AxisFilm } from './AxisFilm.jsx';
import { sendBrief } from './site.js';

const services = [
  ['Offline AI assistants.', 'Assistants that use your business information and run on your hardware.'],
  ['Custom business software.', 'Tools built for the way your business works.'],
  ['Workflow automation.', 'Connect your tools. Cut repetitive work.'],
];
const work = [['Jackalope Welding', 'Operations · Automation'], ['Westside Spine & Injury', 'Digital experience · Systems'], ['Legal AI Agent', 'Private AI · Knowledge'], ['OSAT', 'Personal workspace · In development']];

function Brief() {
  const [step, setStep] = useState(0), [brief, setBrief] = useState({ outcome: '', friction: '', name: '', email: '' });
  const [status, setStatus] = useState(''), [error, setError] = useState(''), [sending, setSending] = useState(false);
  const pending = useRef(false), heading = useRef(null);
  const update = (event) => setBrief({ ...brief, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    if (step < 2) { setStep(step + 1); return; }
    pending.current = true; setSending(true); setError('');
    try { setStatus(await sendBrief(brief)); } catch (err) { setError(err.message); }
    finally { pending.current = false; setSending(false); }
  }
  useEffect(() => { if (step > 0) heading.current?.focus(); }, [step]);
  return <section className="brief section-pad" id="brief">
    <div><p className="eyebrow">LET’S BUILD SOMETHING USEFUL</p><h2>Have a project<br />in mind?</h2><p className="section-description">Tell me what you want to make easier.</p><a className="text-link" href="mailto:nate@mccreery.ai">nate@mccreery.ai ↗</a></div>
    <div className="brief-panel">{status ? <div className="confirmation" role="status"><p className="eyebrow">BRIEF RECEIVED</p><h3>Thank you.</h3><p>{status}</p></div> : <form onSubmit={submit}>
      <p className="eyebrow">PROJECT BRIEF · 0{step + 1} / 03</p>
      <h3 ref={heading} tabIndex={-1}>{['What would you like to do?', 'What’s getting in the way?', 'Where can I reach you?'][step]}</h3>
      {step === 0 && <label>Your desired outcome<textarea name="outcome" value={brief.outcome} onChange={update} required maxLength={5000} placeholder="An assistant that can search our documents, a better way to manage daily work…" /></label>}
      {step === 1 && <label>Your current workflow or challenge<textarea name="friction" value={brief.friction} onChange={update} required maxLength={5000} placeholder="What takes too much time? What tools are you using?" /></label>}
      {step === 2 && <><label>Your name<input name="name" autoComplete="name" value={brief.name} onChange={update} required maxLength={200} /></label><label>Email address<input type="email" name="email" autoComplete="email" value={brief.email} onChange={update} required maxLength={254} /></label></>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">{step > 0 && <button type="button" className="text-link" disabled={sending} onClick={() => setStep(step - 1)}>← BACK</button>}<button className="button" disabled={sending}>{sending ? 'SENDING…' : step === 2 ? 'SEND MY BRIEF ↗' : 'CONTINUE →'}</button></div>
    </form>}</div>
  </section>;
}

export function App() {
  const [solid, setSolid] = useState(false), [menu, setMenu] = useState(false), [demoError, setDemoError] = useState(false);
  const menuButton = useRef(null), demo = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setSolid(entry.intersectionRatio > 0 || entry.boundingClientRect.top < 0));
    observer.observe(document.getElementById('services'));
    function escape(event) { if (event.key === 'Escape') { setMenu(false); menuButton.current?.focus(); } }
    window.addEventListener('keydown', escape);
    return () => { observer.disconnect(); window.removeEventListener('keydown', escape); };
  }, []);
  async function playDemo() {
    demo.current?.focus({ preventScroll: true });
    try { await demo.current.play(); setDemoError(false); } catch { setDemoError(true); }
  }
  return <>
    <a className="skip-link" href="#services">Skip to services</a>
    <header className={solid || menu ? 'site-header solid' : 'site-header'}>
      <a className="brand" href="#home" aria-label="McCreery.ai home">McCreery.ai</a>
      <button ref={menuButton} className="menu-button" aria-expanded={menu} aria-controls="main-nav" onClick={() => setMenu(!menu)}>{menu ? 'CLOSE' : 'MENU'}</button>
      <nav id="main-nav" aria-label="Main navigation" className={menu ? 'open' : ''}>
        {[['WORK', '#work'], ['SERVICES', '#services'], ['OSAT', '#osat']].map(([name, url]) => <a key={name} href={url} onClick={() => setMenu(false)}>{name}</a>)}
        <a className="button" href="#brief" onClick={() => setMenu(false)}>START A PROJECT</a>
      </nav>
    </header>
    <main>
      <section className="story" id="home" aria-label="Offline AI built around you">
        <div className="story-stage"><AxisFilm /></div>
        <div className="story-copy">
          <article className="scene"><div className="scene-pin"><div className="scene-content">
            <p className="eyebrow">INDEPENDENT DESIGN &amp; DEVELOPMENT</p>
            <h1>Offline AI.<br />Built around you.<br />Your data stays yours.</h1>
            <p className="hero-description">I’m Nate. I build custom software, automation, and offline AI for your business. Your AI runs on your hardware. Your data stays with you.</p>
            <div className="hero-actions"><a className="button" href="#services">SEE WHAT I BUILD</a><a className="text-link" href="#brief">START A PROJECT →</a></div>
          </div></div></article>
        </div>
      </section>
      <section className="services section-pad" id="services"><div className="services-copy"><p className="eyebrow">WHAT I BUILD</p>{services.map(([title, description], index) => <article className="service" key={title}><span className="number">0{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div><img className="service-image" src="/assets/service-architecture.png" width="1086" height="1448" loading="lazy" alt="Sunlit stone architecture, engraved with Useful software for a more focused day." /></section>
      <section className="osat section-pad" id="osat"><div><p className="eyebrow">MY PERSONAL PROJECT · IN DEVELOPMENT</p><h2>OSAT</h2><p className="osat-lead">An offline workspace for client notes, next steps, and local AI.</p><button className="button demo-button" onClick={playDemo}><span aria-hidden="true">▶</span> WATCH THE DEMO</button>{demoError && <p><a href="/assets/osat-private-client-work-silent.mp4">Open the demo video</a></p>}</div><video ref={demo} className="osat-video" controls playsInline preload="none" poster="/assets/osat-private-client-work-poster.jpg" aria-label="OSAT private client work demonstration" tabIndex={0}><source src="/assets/osat-private-client-work-silent.mp4" type="video/mp4" /></video></section>
      <section className="work section-pad" id="work"><div><p className="eyebrow">SELECTED WORK</p><h2>Useful systems,<br />built for real work.</h2><p className="section-description">A few systems I’ve built for businesses and myself.</p><a className="text-link" href="#brief">START A PROJECT →</a></div><div className="work-list">{work.map(([name, category], index) => <div className="work-row" key={name}><span className="number">0{index + 1}</span><h3>{name}</h3><p>{category}</p></div>)}</div></section>
      <Brief />
    </main>
    <footer><a className="brand" href="#home">McCreery.ai</a><p>Offline AI. Built around you.</p><span>© {new Date().getFullYear()} Nate McCreery</span></footer>
  </>;
}
