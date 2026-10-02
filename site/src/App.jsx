import { useEffect, useRef, useState } from 'react';
import { lerp, sendBrief } from './site.js';
import { ThoughtStory } from './AxisFilm.jsx';

const services = [
  ['Offline AI assistants.', 'Assistants that use your business information and run on your hardware.'],
  ['Custom business software.', 'Tools built for the way your business works.'],
  ['Workflow automation.', 'Connect your tools. Cut repetitive work.'],
];
const work = [['Jackalope Welding', 'Operations · Automation'], ['Westside Spine & Injury', 'Digital experience · Systems'], ['Legal AI Agent', 'Private AI · Knowledge']];
const tools = [
  ['MagnifyingGlass', 'Quick search', 'Find a note, a file, or something you copied.', '#find'],
  ['Clipboard', 'Clipboard', 'Bring something you copied back into your flow.', '#find'],
  ['NotePencil', 'New sticky', 'Catch the thought now. Organize it when you’re ready.', '#capture'],
  ['Sparkle', 'Quick chat', 'Think with local AI and the notes you already have.', '#local-ai'],
  ['House', 'The desk', 'Your notes, stacks, and next steps, in one place.', '#capture'],
];
function Icon({ name, className = '' }) { return <img className={`icon ${className}`} src={`/assets/icons/${name}.svg`} width="24" height="24" alt="" aria-hidden="true" />; }
function Note({ title, children, className = '' }) {
  return <div className={`note ${className}`}><img className="note-face" src="/assets/osat-yellow-note.webp" width="1536" height="1024" alt="" aria-hidden="true" /><div className="note-content"><strong>{title}</strong>{children && <p>{children}</p>}</div></div>;
}
function Ring() {
  const [selected, setSelected] = useState(0), [open, setOpen] = useState(true);
  return <div className="ring-demo"><img className="ring-pointer icon" src="/assets/icons/Cursor.svg" alt="" aria-hidden="true" />
    <div className={`tool-ring ${open ? '' : 'folded'}`}>
      {open ? <>{tools.map(([icon, title], i) => <button key={title} className={`ring-tool ring-tool-${i}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><Icon name={icon} /><span>{title}</span></button>)}<button className="ring-center" aria-label="Close tool ring" onClick={() => setOpen(false)}><Icon name="X" /></button></> : <button className="ring-open" onClick={() => setOpen(true)}><Icon name="Cursor" />Open tool ring</button>}
    </div>
    <div className="ring-description" aria-live="polite"><strong>{open ? tools[selected][1] : 'Right where you work.'}</strong><p>{open ? tools[selected][2] : 'Open the ring to explore OSAT’s quick tools.'}</p>{open && <a className="text-link" href={tools[selected][3]}>Explore this feature <Icon name="ArrowRight" /></a>}</div>
  </div>;
}
function Stack() {
  const [expanded, setExpanded] = useState(false);
  return <div className="stack-demo"><button className={`note-stack ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={expanded ? 'Fold note stack' : 'Expand note stack'}><Note className="stack-back" title="A place for the idea">Keep the pieces together.</Note><Note className="stack-middle" title="One small next step">Build the first draft.</Note><Note className="stack-front" title="Ideas turn into progress.">Request the client logo.</Note></button><strong>Small thoughts. A little order.</strong><p>Stack related stickies. Unfold them when you need them.</p><span className="interaction-hint">{expanded ? 'Click to fold the stack' : 'Click to unfold the stack'}</span></div>;
}
function Capture() {
  const [thought, setThought] = useState(''), [saved, setSaved] = useState('');
  return <div className="capture-playground"><p className="eyebrow">TRY A LITTLE CAPTURE</p><form onSubmit={event => { event.preventDefault(); if (thought.trim()) { setSaved(thought.trim()); setThought(''); } }}><label className="sr-only" htmlFor="demo-thought">A thought to capture</label><input id="demo-thought" maxLength={120} value={thought} onChange={event => setThought(event.target.value)} placeholder="A thought worth keeping…" required /><button className="capture-submit" aria-label="Capture this thought"><Icon name="ArrowRight" /></button></form>{saved ? <div className="captured-note" role="status"><Note title={saved} /><p>Captured here for this preview.</p></div> : <p className="capture-hint">Type a thought. Give it a place.</p>}</div>;
}
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
    <div><h2>Have a project<br />in mind?</h2><p className="section-description">Tell me what you want to make easier.</p><a className="text-link" href="mailto:nate@mccreery.ai">nate@mccreery.ai <span aria-hidden="true">↗</span></a></div>
    <div className="brief-panel">{status ? <div className="confirmation" role="status"><p className="eyebrow">BRIEF RECEIVED</p><h3>Thank you.</h3><p>{status}</p></div> : <form onSubmit={submit}>
      <p className="form-step">Project brief <span>{step + 1} of 3</span></p>
      <h3 ref={heading} tabIndex={-1}>{['What would you like to do?', 'What’s getting in the way?', 'Where can I reach you?'][step]}</h3>
      {step === 0 && <label>Your desired outcome<textarea name="outcome" value={brief.outcome} onChange={update} required maxLength={5000} placeholder="An assistant that can search our documents, a better way to manage daily work…" /></label>}
      {step === 1 && <label>Your current workflow or challenge<textarea name="friction" value={brief.friction} onChange={update} required maxLength={5000} placeholder="What takes too much time? What tools are you using?" /></label>}
      {step === 2 && <><label>Your name<input name="name" autoComplete="name" value={brief.name} onChange={update} required maxLength={200} /></label><label>Email address<input type="email" name="email" autoComplete="email" value={brief.email} onChange={update} required maxLength={254} /></label></>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">{step > 0 && <button type="button" className="text-link" disabled={sending} onClick={() => { setStep(step - 1); heading.current?.focus(); }}>← Back</button>}<button className="button" disabled={sending}>{sending ? 'Sending…' : step === 2 ? 'Send my brief ↗' : 'Continue →'}</button></div>
    </form>}</div>
  </section>;
}

export function App() {
  const [menu, setMenu] = useState(false), [demoError, setDemoError] = useState(false), [skyDetail, setSkyDetail] = useState(false);
  const menuButton = useRef(null), demo = useRef(null), demoDialog = useRef(null), hero = useRef(null);
  useEffect(() => {
    function escape(event) { if (event.key === 'Escape' && menu) { setMenu(false); menuButton.current?.focus(); } }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [menu]);
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } }), { threshold: .08 });
    elements.forEach(element => observer.observe(element));
    const surface = hero.current, motion = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(pointer: fine)');
    let frame = 0, x = 0, y = 0, targetX = 0, targetY = 0;
    function tick() {
      x = lerp(x, targetX, .08); y = lerp(y, targetY, .08);
      surface.style.setProperty('--pointer-x', `${x.toFixed(2)}px`); surface.style.setProperty('--pointer-y', `${y.toFixed(2)}px`);
      frame = Math.abs(x - targetX) + Math.abs(y - targetY) > .05 ? requestAnimationFrame(tick) : 0;
    }
    function move(event) {
      if (motion.matches || !fine.matches) return;
      const box = surface.getBoundingClientRect();
      targetX = (event.clientX - box.left - box.width / 2) / box.width * 22;
      targetY = (event.clientY - box.top - box.height / 2) / box.height * 18;
      if (!frame) frame = requestAnimationFrame(tick);
    }
    function reset() { targetX = targetY = 0; if (!frame) frame = requestAnimationFrame(tick); }
    function changed() { if (motion.matches) { cancelAnimationFrame(frame); frame = 0; x = y = 0; surface.style.setProperty('--pointer-x', '0px'); surface.style.setProperty('--pointer-y', '0px'); } }
    surface.addEventListener('pointermove', move); surface.addEventListener('pointerleave', reset); motion.addEventListener('change', changed);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerleave', reset); motion.removeEventListener('change', changed); };
  }, []);
  async function playDemo() {
    demoDialog.current.showModal();
    try { await demo.current.play(); setDemoError(false); } catch { setDemoError(true); }
  }
  return <>
    <a className="skip-link" href="#osat">Skip to content</a>
    <header className="site-header"><a className="brand" href="#home" aria-label="McCreery.ai home">McCreery.ai</a><button ref={menuButton} className="menu-button" aria-expanded={menu} aria-controls="main-nav" onClick={() => setMenu(!menu)}>{menu ? 'Close' : 'Menu'} <Icon name={menu ? 'X' : 'Plus'} /></button><nav id="main-nav" aria-label="Main navigation" className={menu ? 'open' : ''}>{[['OSAT', '#osat'], ['Services', '#services'], ['Work', '#work']].map(([name, url]) => <a key={name} href={url} onClick={() => setMenu(false)}>{name}</a>)}<a className="button button-small" href="#brief" onClick={() => setMenu(false)}>Start a project <Icon name="ArrowUpRight" /></a></nav></header>
    <main>
      <div className="product-story">
        <ThoughtStory>
        <section ref={hero} className="hero" id="hero">
          <div className="hero-art" aria-hidden="true"><img className="hero-lines" src="/assets/osat-hero-connections.webp" width="1671" height="941" alt="" /><div className="hero-note hero-note-1"><Note title="A new idea">A little room to think.</Note></div><div className="hero-note hero-note-2"><Note title="Research">Keep what inspires you.</Note></div><div className="hero-note hero-note-3"><Note title="Next steps">Make a little progress.</Note></div><div className="hero-note hero-note-4"><Note title="Project notes">The pieces, together.</Note></div></div>
          <div className="hero-copy"><p className="product-label"><img src="/assets/osat-icon.png" width="26" height="26" alt="" /> OSAT <span>A workspace for your Mac</span></p><h1>Your thoughts.<br /><span>Connected.</span></h1><p className="hero-description">A private workspace. Built to work offline.</p><div className="hero-actions"><button className="button" onClick={playDemo}><Icon name="Play" />Watch demo</button><a className="button button-secondary" href="#osat">Explore OSAT <Icon name="ArrowRight" /></a></div><p className="release-label">For Mac. In development.</p><a href="#bots" className="bots-pill"><Icon name="Robot" /><span>Bots, coming soon</span><Icon name="ArrowUpRight" className="pill-arrow" /></a></div>
          <nav className="hero-dock" aria-label="OSAT feature tour">{[['House','The desk','#capture'],['MagnifyingGlass','Search','#find'],['Clipboard','Clipboard','#find'],['Sparkle','Local AI','#local-ai'],['TreeStructure','Sky','#connections']].map(([icon,label,url]) => <a key={label} href={url} aria-label={label}><Icon name={icon} /><span>{label}</span></a>)}</nav><a href="#osat" className="scroll-cue">A little room for your mind <Icon name="ArrowDown" /></a>
        </section>
        </ThoughtStory>
        <section className="tools-section section-pad" id="osat" data-reveal><div className="tools-intro"><p className="eyebrow">01 / RIGHT WITH YOU</p><h2>Tools at<br /><span>your cursor.</span></h2><p className="section-description">Capture, refine, and organize without breaking your flow. OSAT lives on your Mac, right where you work.</p><p className="shortcut">In OSAT <kbd>⌘</kbd> + middle-click</p></div><Ring /><Stack /></section>
        <section className="capture-section section-pad" id="capture" data-reveal><div><p className="eyebrow">02 / CATCH THE THOUGHT</p><h2>Before it’s gone.<br /><span>Give it a home.</span></h2><p className="section-description">A note, a task, an unfinished thought. Start with one line. Keep it editable, stack it with related ideas, and come back when you’re ready.</p><Capture /></div><figure className="product-frame capture-frame"><img src="/assets/osat-capture-retina.webp" width="1470" height="1440" loading="lazy" alt="The actual OSAT capture line and sticky stacks, in its green, coral, and violet backdrop." /><figcaption>One line. A note. Your next step.</figcaption></figure></section>
        <section className="connections-section section-pad" id="connections" data-reveal><div className="section-heading"><p className="eyebrow">03 / FROM PIECES TO PICTURE</p><h2>See what<br /><span>connects.</span></h2><p>Link notes and next steps. Build branches around a project. Zoom out to Sky and see how the whole thing fits together.</p></div><figure className={`product-frame sky-frame ${skyDetail ? 'detail' : ''}`}><div className="frame-toolbar"><span><Icon name="TreeStructure" />OSAT / Sky</span><div className="view-switch" aria-label="Sky preview zoom"><button aria-pressed={!skyDetail} onClick={() => setSkyDetail(false)}>Overview</button><button aria-pressed={skyDetail} onClick={() => setSkyDetail(true)}>Detail <Icon name="ArrowsOut" /></button></div></div><div className="sky-viewport" role="region" aria-label="Sky image preview" tabIndex={skyDetail ? 0 : -1}><img src="/assets/osat-sky-retina.webp" width="3915" height="1350" loading="lazy" alt="OSAT Sky connects the Northstar launch, client brief, and delivery tasks in an editable project map." /></div><figcaption>{skyDetail ? 'A closer look at the notes and branches.' : 'The same notes. A bigger perspective.'}<span className="mobile-hint">Swipe to look around.</span></figcaption></figure><div className="connection-points"><p><Icon name="Link" /><strong>Connect the pieces.</strong><span>Notes and context stay together.</span></p><p><Icon name="Stack" /><strong>Keep a little order.</strong><span>Stacks make room for what’s next.</span></p><p><Icon name="TreeStructure" /><strong>Find the bigger picture.</strong><span>Your project, seen from above.</span></p></div></section>
      </div>
      <section className="find section-pad" id="find" data-reveal><div><p className="eyebrow">04 / RIGHT BACK TO IT</p><h2>A thought.<br />A file.<br /><span>That thing you copied.</span></h2><p className="section-description">Find it without retracing your day. Search your saved notes or recover something from clipboard history, then get back to the work.</p></div><figure className="product-frame search-frame"><img src="/assets/osat-search-retina.webp" width="1430" height="890" loading="lazy" alt="Searching Northstar in OSAT returns the project, its client brief, and invoice." /><figcaption>Search where your work already lives.</figcaption></figure></section>
      <section className="ai-section section-pad" id="local-ai" data-reveal><div className="section-heading"><p className="eyebrow">05 / THINK IT THROUGH</p><h2>Your context.<br /><span>Your local AI.</span></h2><p>Ask a question about what you’ve saved. Use AI on your Mac after the initial model setup, with your notes close at hand.</p></div><figure className="product-frame ai-frame"><img src="/assets/osat-ask-retina.webp" width="1000" height="400" loading="lazy" alt="A saved OSAT conversation answers a question about the Northstar project and links its client brief as context." /><figcaption><Icon name="LockSimple" />A saved conversation in OSAT. Your source note, one click away.</figcaption></figure></section>
      <section className="privacy section-pad" id="privacy" data-reveal><div className="privacy-emblem"><Icon name="Desktop" /><Icon name="WifiSlash" /></div><p className="eyebrow">OFFLINE IS THE POINT.</p><h2>On your Mac.<br /><span>On your terms.</span></h2><p className="section-description">Your workspace stays on your Mac.<br />Local AI can work offline after model setup.<br />Online connections are a choice.</p><div className="privacy-facts"><span><Icon name="Check" />Local workspace</span><span><Icon name="Check" />Offline mode</span><span><Icon name="Check" />Optional cloud services</span></div><details className="privacy-details"><summary>How privacy works <Icon name="Plus" /></summary><div><p>Workspace notes are saved locally. Built-in AI runs on your Mac after an initial model download; LM Studio is another local option.</p><p>If you choose a cloud model, its provider receives your prompt and included context. Optional iCloud sharing uses your iCloud Drive. Connected AI clients follow their own data settings.</p><p>OSAT’s offline mode blocks its non-local network requests and pauses connected services.</p></div></details></section>
      <section className="bots-section section-pad" id="bots" data-reveal><div className="bot-emblem"><Icon name="Robot" /></div><div><p className="eyebrow">A LITTLE HELP, COMING SOON</p><h2>Room for a<br /><span>new kind of teammate.</span></h2><p className="section-description">Bots are the next chapter for OSAT. A little more help inside the workspace you already call your own.</p><span className="coming-soon">Bots, coming soon <Icon name="Robot" /></span></div></section>
      <section className="demo-invitation section-pad" data-reveal><p className="eyebrow">A THOUGHT CAN GO A LONG WAY.</p><h2>See it come together.</h2><p>From the first capture to the bigger picture.</p><button className="button" onClick={playDemo}><Icon name="Play" />Watch the OSAT demo</button></section>
      <section className="company section-pad" id="services" data-reveal><div className="section-heading"><p className="eyebrow">MCCREERY.AI / MADE TO BE USEFUL</p><h2>Useful software.<br /><span>Built around you.</span></h2><p>I’m Nate. Alongside OSAT, I build custom software, automation, and offline AI for businesses.</p></div><div className="services-list">{services.map(([title, description],i) => <article key={title}><span className="service-number">0{i+1}</span><h3>{title}</h3><p>{description}</p><a className="text-link" href="#brief">Let’s talk <Icon name="ArrowUpRight" /></a></article>)}</div><div className="work" id="work"><h3>Selected work</h3><div className="work-list">{work.map(([name, category]) => <div className="work-row" key={name}><h4>{name}</h4><p>{category}</p></div>)}</div></div></section>
      <Brief />
    </main>
    <footer><div><a className="brand" href="#home">McCreery.ai</a><p>© {new Date().getFullYear()} Nate McCreery</p></div><nav aria-label="Footer navigation"><a href="#osat">OSAT</a><a href="#privacy">Privacy</a><a href="#brief">Start a project</a></nav></footer>
    <dialog ref={demoDialog} className="demo-dialog" aria-labelledby="demo-title" onClose={() => demo.current?.pause()}><div className="demo-heading"><div><h2 id="demo-title">OSAT in action</h2><p>Captured in OSAT. In development.</p></div><form method="dialog"><button className="close-button" aria-label="Close demo" autoFocus><Icon name="X" /></button></form></div><video ref={demo} className="osat-video" controls playsInline preload="none" poster="/assets/osat-private-client-work-poster.jpg" aria-label="OSAT private client work demonstration" tabIndex={0}><source src="/assets/osat-private-client-work-smooth.mp4" type="video/mp4" /></video>{demoError && <p className="demo-error">Use the play control, or <a href="/assets/osat-private-client-work-smooth.mp4">open the video</a>.</p>}<details className="demo-transcript"><summary>Demo description</summary><p>A client project stays in one OSAT workspace: open the tool ring, recover a clipboard item, find the brief, ask local AI about it, capture a next step, and connect the notes in Sky. The video has no audio.</p></details></dialog>
  </>;
}
