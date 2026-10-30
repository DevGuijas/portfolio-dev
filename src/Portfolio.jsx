import React, { useEffect, useRef, useState } from 'react';
import { api, External } from './shared.jsx';
import './original-fonts.css';
import './original.css';
import './portfolio.css';

// Classes, positions and transition directions retained from the supplied site.
const vertical = (current, step) => `transition-all ease-in-out duration-1100 w-screen h-screen fixed top-full left-0 ${current === step ? '-translate-y-full' : current > step ? '-translate-y-[200%]' : ''}`;
const reveal = (current, step, direction = '-translate-x-1/2') => `transition-all ease-in-out ${current >= step ? 'delay-900 duration-1400' : `delay-700 duration-100 opacity-0 ${direction}`}`;

function MenuIcon({ close }) {
  return <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true"><circle cx="30" cy="30" r="29" stroke="white" strokeWidth="2"/>{close ? <path d="m20 20 20 20m0-20L20 40" stroke="white" strokeWidth="3" strokeLinecap="round"/> : <path d="M20.75 22.4C20.75 21.6545 21.3544 21.05 22.1 21.05H39.65C40.3956 21.05 41 21.6545 41 22.4C41 23.1456 40.3956 23.75 39.65 23.75H22.1C21.3544 23.75 20.75 23.1456 20.75 22.4ZM39.65 29.15H15.35C14.6044 29.15 14 29.7545 14 30.5C14 31.2456 14.6044 31.85 15.35 31.85H39.65C40.3956 31.85 41 31.2456 41 30.5C41 29.7545 40.3956 29.15 39.65 29.15ZM39.65 37.25H27.5C26.7544 37.25 26.15 37.8545 26.15 38.6C26.15 39.3456 26.7544 39.95 27.5 39.95H39.65C40.3956 39.95 41 39.3456 41 38.6C41 37.8545 40.3956 37.25 39.65 37.25Z" fill="white"/>}</svg>;
}
function Header({ settings, current, menu, setMenu, links, go }) {
  const menuButton = useRef(null), menuPanel = useRef(null);
  useEffect(() => {
    if (!menu) return;
    menuPanel.current?.querySelector('a')?.focus();
    const trap = e => {
      if (e.key === 'Escape') { setMenu(false); menuButton.current?.focus(); }
      if (e.key === 'Tab') {
        const list = [menuButton.current, ...menuPanel.current.querySelectorAll('a')];
        const at = list.indexOf(document.activeElement);
        if (e.shiftKey && at <= 0) { e.preventDefault(); list.at(-1)?.focus(); }
        if (!e.shiftKey && at === list.length - 1) { e.preventDefault(); list[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', trap); return () => document.removeEventListener('keydown', trap);
  }, [menu]);
  return <>
    <header className={`fixed left-0 w-full h-[var(--header-height)] z-40 _pading_section_xl flex flex-row items-center justify-between transition-all duration-500 ease-in-out ${current >= 1 && !menu ? '-top-[var(--header-height)]' : 'top-0'}`} inert={current >= 1 && !menu}>
      <a href="#inicio" className="original-brand" onClick={e => { e.preventDefault(); go(0); }} aria-label={`${settings.handle} — início`}>{settings.handle}</a>
      <button ref={menuButton} type="button" className="w-fit h-fit z-50 rounded-full transition-colors duration-400" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} aria-controls="portfolio-menu" onClick={() => setMenu(v => !v)}><MenuIcon close={menu}/></button>
    </header>
    <nav ref={menuPanel} id="portfolio-menu" aria-label="Menu principal" aria-hidden={!menu} inert={!menu} className={`${menu ? '' : 'translate-x-full'} bg-gradient-to-b from-[rgba(5,0,16,0.98)] to-[rgba(24,24,24,0.98)] duration-800 transition-all ease-in-out w-screen h-screen fixed top-0 left-0 original-menu`}>
      <div className="flex flex-col items-end _pading_section_xl pt-[calc(var(--header-height)+3rem)] pb-8 h-screen box-border justify-between">{links.map((item, index) => <div className="group" key={item.id}><a href={`#${item.id}`} onClick={e => { e.preventDefault(); setMenu(false); go(item.step); }} className="group flex justify-end gap-2"><h2 className={`relative font-beviet font-bold text-end leading-tight original-menu-title ${current === item.step ? 'text-[#5ca7ff]' : ''}`}>{item.label}</h2><span className="text-[#5ca7ff] font-rubik font-normal tracking-widest translate-y-1 original-menu-number">{String(index + 1).padStart(2, '0')}</span></a></div>)}</div>
    </nav>
  </>;
}
function Home({ s, current, step, next }) {
  return <section id="inicio" className={`${vertical(current, step)} flex items-center justify-center`} inert={current !== step} aria-hidden={current !== step} aria-label={`${s.name} — ${s.role}`}>
    {s.portrait && <img src={s.portrait} alt={s.portraitAlt} className="absolute bottom-0 left-1/2 -translate-x-1/2 home-portrait" fetchPriority="high"/>}
    <button type="button" onClick={next} className={`${current >= step ? '' : 'opacity-0 translate-x-15'} delay-1800 duration-1000 ease-in-out transition-all h-fit w-fit flex flex-row items-center gap-3 right-[calc(var(--pading-section-xl))] bottom-[5vh] md:bottom-[9rem] absolute scroll-original`}>
      <span className="font-beviet text-[1.2rem] text-DSScrollDownText font-normal">{s.scrollLabel}</span><svg className="animate-bounce" width="36" height="42" viewBox="0 0 36 42" aria-hidden="true"><path d="M18 2v35M5 24l13 13 13-13" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
    </button>
    <h1 className="original-home-title"><span className={`text-[9rem] md:text-[12rem] 2xl:text-[18rem] transparent-text-stroke text-inter hero-word-1 delay-1000 absolute duration-800 h-fit top-[var(--header-height)] md:top-[calc(var(--header-height)/1.5)] 2xl:top-[var(--header-height)] transition-all ease-in-out ${current >= step ? 'left-[calc(var(--pading-section-xl))] md:left-[calc(var(--pading-section-xl)+10rem)]' : 'left-0 opacity-0'}`}>{s.heroWord1}</span><span className={`text-[9rem] md:text-[12rem] 2xl:text-[18rem] transparent-text-stroke text-inter delay-1400 absolute duration-1600 h-fit top-1/2 -translate-y-1/2 md:-translate-y-3/4 transition-all ease-in-out ${current >= step ? 'right-[calc(var(--pading-section-xl))] md:right-[calc(var(--pading-section-xl)+10rem)]' : 'right-0 opacity-0'}`}>{s.heroWord2}</span><span className={`text-[9rem] md:text-[12rem] 2xl:text-[18rem] transparent-text-stroke text-inter delay-1800 absolute duration-2400 h-fit bottom-[10vh] md:bottom-[8rem] 2xl:bottom-[15rem] transition-all ease-in-out ${current >= step ? 'left-[calc(var(--pading-section-xl))] md:left-[calc(var(--pading-section-xl)+10rem)]' : 'left-0 opacity-0'}`}>{s.heroWord3}</span></h1>
  </section>;
}
function About({ s, current, step }) {
  return <section id="sobre" className={`${vertical(current, step)} gap-6 2xl:gap-[6rem] flex flex-col items-center justify-center`} inert={current !== step} aria-hidden={current !== step}>
    <div className="original-content-scroll"><div className="pl-[var(--pading-section-xl)] flex flex-row justify-between"><h2 className={`font-beviet font-light text-[1.8rem] md:text-[2.8rem] 2xl:text-[5.6rem] text-[#CCCCCC] tracking-[2.5%] pr-[var(--pading-section-xl)] ${reveal(current, step)}`}>{s.aboutTitle}</h2></div>
    <div className="_pading_section_xl w-full flex flex-col xl:flex-row justify-between gap-[3.2rem] xl:gap-[6rem] original-about-columns">
      <div className={`w-full flex items-center flex-col xl:w-1/2 ${reveal(current, step, 'translate-y-full')}`}>{s.aboutImage && <img src={s.aboutImage} alt={s.aboutImageAlt} className="max-w-[46rem] xl:max-w-[1200rem] w-[80%] about-portrait" loading="lazy"/>}</div>
      <div className={`font-beviet text-[1.6rem] md:text-[2.4rem] 2xl:text-[3rem] text-[#CCCCCC] tracking-[2.5%] w-full xl:w-1/2 about-copy-text ${reveal(current, step, 'translate-x-full')}`}><p className="preserve-lines">{s.aboutText}</p><p className="about-identity">{s.name}<br/>{s.role}{s.location ? ` · ${s.location}` : ''}</p></div>
    </div></div>
  </section>;
}
function Skills({ s, current, step }) {
  return <section id="habilidades" className={`${vertical(current, step)} gap-[6rem] lg:pt-0 flex flex-col items-center justify-center`} inert={current !== step} aria-hidden={current !== step}>
    <div className="_pading_section_xl w-full flex flex-col lg:flex-row justify-between gap-6 original-content-scroll">
      <div className="flex flex-col justify-start items-start w-full lg:w-[40%] gap-6"><h2 className={`font-beviet text-[1.6rem] sm:text-[2rem] font-medium text-[#CCCCCC] tracking-[2.5%] ${reveal(current, step)}`}>{s.skillsTitle}</h2><div className="w-full h-fit"><div className="h-[0.1rem] w-full"/><div className={`h-[0.1rem] w-full bg-[#878787] -translate-y-[0.1rem] ${reveal(current, step)}`}/></div><p className={`font-beviet text-[1.8rem] font-medium sm:text-[2.4rem] xl:text-[4.8rem] text-[#CCCCCC] tracking-[2.5%] ${reveal(current, step)}`}>{s.skillsSubtitle}</p></div>
      <div className="w-full lg:w-[60%] lg:grid lg:grid-cols-2 lg:grid-rows-2 lg:gap-x-2 lg:gap-y-8 flex flex-col gap-2 technology-grid">{s.skills.map((skill, index) => { const card = s.skillDetails.find(item => item.name === skill); return <div key={`${skill}-${index}`} className={`lg:col-span-1 gap-2 flex flex-col h-fit transition-all ease-in-out ${current >= step ? `${['delay-500', 'delay-1000', 'delay-1500', 'delay-2000'][index % 4]} duration-1400` : 'delay-700 duration-100 opacity-0 translate-y-1/2'}`}><div className="h-[4.5rem] lg:h-[6.5rem] technology-logo">{card?.image ? <img src={card.image} alt={`Logo ${skill}`} loading="lazy"/> : <span className="skill-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>}</div><p className="font-rubik text-[1.6rem] lg:text-[1.8rem] xl:text-[2rem] text-[#CCCCCC] tracking-[2.5%]"><strong className="technology-name">{skill}</strong>{card?.description && <span>{card.description}</span>}</p>{card?.detail && <p className="font-rubik text-[1.6rem] lg:text-[1.8rem] xl:text-[2rem] text-[#5CA7FF] tracking-[2.5%]">{card.detail}</p>}</div>; })}</div>
    </div>
  </section>;
}
function Projects({ s, projects, current, step }) {
  const list = projects.length ? projects : [{ id: 'empty', title: s.projectsTitle, description: s.projectsDescription, tags: [], link: s.github, image: '', empty: true }];
  return <>{list.map((p, index) => <section id={index === 0 ? 'projetos' : `projeto-${p.id}`} key={p.id} aria-label={p.title} inert={current !== step + index} aria-hidden={current !== step + index} className={`transition-all gap-[6rem] lg:pt-0 flex flex-col items-center justify-center ease-in-out duration-1100 w-screen h-screen fixed ${index > 0 ? 'top-0 left-full' : 'top-full left-0'} ${current === step + index ? (index > 0 ? '-translate-x-full' : '-translate-y-full') : current > step + index ? (index === list.length - 1 ? (index > 0 ? '-translate-x-full -translate-y-full' : '-translate-y-[200%]') : index > 0 ? '-translate-x-[200%]' : '-translate-x-[200%] -translate-y-full') : ''}`}>
    {p.image && <div className="bg-cover bg-center w-[calc(100vw-var(--pading-section-xl))] lg:w-[50vw] h-screen absolute top-0 left-0 original-project-image"><img src={p.image} alt={`Capa de ${p.title}`} loading="lazy"/></div>}
    <div className={`w-[50vw] h-screen absolute top-0 left-[50vw] flex flex-col pl-4 justify-end transition-all ease-in-out duration-1100 delay-700 ${current >= step + index ? '' : 'translate-y-9'}`}><p className="font-rubik text-[1.6rem] lg:text-[1.8rem] xl:text-[11.8rem] 2xl:text-[12.8rem] font-bold text-white tracking-[2.5%] opacity-[3%]" aria-hidden="true">{p.tags[0] || 'PROJETOS'}</p></div>
    <div className={`lg:pl-[calc(var(--pading-section-xl)*1.8)] lg:pr-[calc(var(--pading-section-xl)*1)] p-[calc(var(--pading-section-xl)*1)] w-full h-full flex flex-col justify-center gap-8 z-10 transition-all ease-in-out duration-1100 delay-700 original-project-copy ${current >= step + index ? '' : 'translate-y-6 opacity-0'}`}><div className="project-text">
      <p className="font-rubik text-[1.8rem] lg:text-[2.4rem] xl:text-[2.8rem] 2xl:text-[3.2rem] font-bold text-[#5CA7FF] tracking-[2.5%]">{p.tags.join(' · ') || s.navProjects}</p>
      <h2 className="font-beviet text-[2rem] lg:text-[3.2rem] xl:text-[6rem] 2xl:text-[8rem] font-normal text-white tracking-[2.5%]">{p.title}</h2>
      <p className="font-rubik text-[1.6rem] lg:text-[1.8rem] xl:text-[3.2rem] 2xl:text-[3.6rem] font-normal text-white tracking-[2.5%] preserve-lines original-content-scroll project-description">{p.description}</p>
      <div className="original-project-links">{p.link && <External href={p.link}>{p.empty ? 'GitHub' : s.projectButton} ↗</External>}{p.repository && <External href={p.repository}>GitHub ↗</External>}</div>
    </div></div>
  </section>)}</>;
}
function Contact({ s, current, step }) {
  return <section id="contato" className={`${vertical(current, step)} flex flex-col items-center justify-center`} inert={current !== step} aria-hidden={current !== step}>
    <div className="_pading_section_xl h-full w-full flex flex-col justify-center gap-6 original-contact-content"><div className="original-content-scroll"><h2 className={`font-beviet text-[2.4rem] sm:text-[3.8rem] xl:text-[6.4rem] text-center tracking-[2.5%] ${reveal(current, step, 'translate-y-1/2')}`}><span className="font-normal text-[#b4b4b4]">{s.contactTitle}</span><br/><span className="font-extrabold text-white">{s.contactEmphasis}</span></h2>{s.contactDescription && <p className={`contact-description font-rubik ${reveal(current, step, 'translate-y-1/2')}`}>{s.contactDescription}</p>}<div className={`original-contact-links font-rubik ${reveal(current, step, 'translate-y-1/2')}`}>{s.email && <a href={`mailto:${s.email}`}>{s.email} ↗</a>}{s.instagram && <External href={s.instagram}><img src="/icons/instagram.png" alt=""/>Instagram ↗</External>}{s.linkedin && <External href={s.linkedin}><img src="/icons/linkedin.png" alt=""/>LinkedIn ↗</External>}</div></div></div>
    <footer className="_pading_section_xl w-full h-[120px] md:h-[90px] flex flex-row justify-center items-center text-center flex-wrap font-light text-base font-rubik original-footer">{s.github ? <External href={s.github}>{s.footer}</External> : s.footer}</footer>
  </section>;
}

function Experience({ data }) {
  const s = data.settings;
  const projects = [...data.projects].sort((a,b) => Number(b.featured) - Number(a.featured) || a.order - b.order || b.id - a.id);
  const aboutStep = s.showAbout ? 1 : -1;
  const skillsStep = s.showSkills ? 1 + Number(s.showAbout) : -1;
  const projectsStep = 1 + Number(s.showAbout) + Number(s.showSkills);
  const contactStep = projectsStep + Math.max(projects.length, 1);
  const total = contactStep + Number(s.showContact);
  const [current, setCurrent] = useState(0), [loading, setLoading] = useState(true), [menu, setMenu] = useState(false);
  const currentRef = useRef(0), locked = useRef(false), timer = useRef(null), touch = useRef(null), cursor = useRef(null), point = useRef(null);
  const links = [{ id: 'inicio', label: s.navHome, step: 0 }, ...(s.showAbout ? [{id:'sobre', label:s.navAbout,step:aboutStep}] : []), ...(s.showSkills ? [{id:'habilidades',label:s.navSkills,step:skillsStep}] : []), {id:'projetos',label:s.navProjects,step:projectsStep}, ...(s.showContact ? [{id:'contato',label:s.navContact,step:contactStep}] : [])];
  function go(index) {
    const next = Math.max(0, Math.min(total - 1, index));
    if (next === currentRef.current || locked.current) return;
    locked.current = true; currentRef.current = next; setCurrent(next);
    window.scrollTo({ top: next * window.innerHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    timer.current = setTimeout(() => { locked.current = false; }, 750);
  }
  useEffect(() => {
    const timeout = setTimeout(() => { setLoading(false); window.scrollTo(0,0); }, 1000);
    return () => { clearTimeout(timeout); clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    if (loading) return;
    function canScrollInside(target, dy) {
      const element = target.closest?.('.original-content-scroll');
      return element && element.scrollHeight > element.clientHeight + 2 && (dy > 0 ? element.scrollTop + element.clientHeight < element.scrollHeight - 2 : element.scrollTop > 0);
    }
    const wheel = e => {
      if (menu) { e.preventDefault(); return; }
      if (canScrollInside(e.target, e.deltaY)) return;
      e.preventDefault(); if (Math.abs(e.deltaY) >= 30) go(currentRef.current + Math.sign(e.deltaY));
    };
    const start = e => { touch.current = e.touches[0]?.clientY ?? null; };
    const end = e => { if (menu || touch.current == null) return; const delta = touch.current - e.changedTouches[0].clientY; touch.current = null; if (Math.abs(delta) > 40 && !canScrollInside(e.target, delta)) go(currentRef.current + Math.sign(delta)); };
    const key = e => {
      if (menu || ['INPUT','TEXTAREA','BUTTON','A'].includes(e.target.tagName)) return;
      if (['ArrowDown','PageDown','ArrowRight',' '].includes(e.key)) { e.preventDefault(); go(currentRef.current + 1); }
      if (['ArrowUp','PageUp','ArrowLeft'].includes(e.key)) { e.preventDefault(); go(currentRef.current - 1); }
      if (e.key === 'Home') { e.preventDefault(); go(0); }
      if (e.key === 'End') { e.preventDefault(); go(total-1); }
      if (e.key === 'Escape') setMenu(true);
    };
    const resize = () => window.scrollTo({ top: currentRef.current * window.innerHeight, behavior: 'instant' });
    window.addEventListener('wheel', wheel, {passive:false}); window.addEventListener('touchstart', start, {passive:true}); window.addEventListener('touchend', end, {passive:true}); window.addEventListener('keydown', key); window.addEventListener('resize', resize);
    return () => { window.removeEventListener('wheel',wheel); window.removeEventListener('touchstart',start); window.removeEventListener('touchend',end); window.removeEventListener('keydown',key); window.removeEventListener('resize',resize); };
  }, [loading, menu, total]);
  useEffect(() => {
    const move = e => { if (!cursor.current || !point.current) return; cursor.current.style.left = `${e.clientX + 60}px`; cursor.current.style.top = `${e.clientY + 60}px`; point.current.style.left = `${e.clientX - 4.5}px`; point.current.style.top = `${e.clientY - 4.5}px`; };
    document.addEventListener('mousemove',move); return () => document.removeEventListener('mousemove',move);
  }, []);
  return <>
    {!loading && <><main className="w-full not_show_scrollbar"><div aria-hidden="true">{Array.from({length:total},(_,index) => <div className="section_snap h-screen flex items-center justify-center" key={index}/>)}</div><Home s={s} current={current} step={0} next={() => go(1)}/>{s.showAbout && <About s={s} current={current} step={aboutStep}/>} {s.showSkills && <Skills s={s} current={current} step={skillsStep}/>}<Projects s={s} projects={projects} current={current} step={projectsStep}/>{s.showContact && <Contact s={s} current={current} step={contactStep}/>}</main><Header settings={s} current={current} menu={menu} setMenu={setMenu} links={links} go={go}/><button className="keyboard-menu" onClick={() => setMenu(true)}>Abrir navegação</button></>}
    <div className={`${loading ? '' : 'translate-x-full'} bg-[#5838FF] duration-800 transition-all ease-in-out w-screen h-screen fixed top-0 left-0 z-50`} aria-hidden="true"/>
    <div ref={cursor} className="cursor flex items-center justify-center" aria-hidden="true"/><div ref={point} className="cursor-point" aria-hidden="true"/>
  </>;
}
export function Portfolio() {
  const [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => { api('/api/site').then(value => { setData(value); document.title = value.settings.seoTitle; document.querySelector('meta[name="description"]').content = value.settings.seoDescription; }).catch(e => setError(e.message)); }, []);
  if (error) return <main className="public-load"><p role="alert">{error}</p><button onClick={() => location.reload()}>Tentar novamente</button></main>;
  if (!data) return <div className="bg-[#5838FF] w-screen h-screen fixed top-0 left-0" role="status" aria-label="Carregando portfólio"/>;
  return <Experience data={data}/>;
}
