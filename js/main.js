"use strict";
const byId = (id) => document.getElementById(id);
const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches && !calm;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/* Scroll reveals */
document.querySelectorAll('.section-top,.flavor,.value,.story-art,.story-copy,.cta>*').forEach(el => {
    el.classList.add('reveal');
    const i = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--d', Math.min(i, 3) * .1 + 's');
});
const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) {
    e.target.classList.add('in');
    seen.unobserve(e.target);
} }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach(el => seen.observe(el));
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
/* Header, progress bar, hero fade */
const head = document.querySelector('header'), bar = byId('progress');
const onScroll = () => {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    head.classList.toggle('stuck', y > innerHeight * .7);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    root.style.setProperty('--hero', clamp(y / innerHeight, 0, 1).toFixed(3));
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
/* Mobile menu */
const menuBtn = byId('menuBtn'), nav = byId('nav');
const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    head.classList.toggle('stuck', open || scrollY > innerHeight * .7);
};
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', e => { if (e.target.closest('a'))
    setMenu(false); });
/* Background video */
const video = byId('filmVideo'), player = byId('player');
const playBtn = byId('playBtn'), muteBtn = byId('muteBtn');
const scrub = byId('scrub'), chapters = [...document.querySelectorAll('#chapters button')];
let scrubbing = false;
const seek = (t) => {
    if (!video.duration)
        return;
    video.currentTime = clamp(t, 0, video.duration - .05);
    paint();
};
const paint = () => {
    const d = video.duration || 10, t = video.currentTime;
    if (!scrubbing)
        scrub.value = String(t / d * 1000);
    scrub.style.setProperty('--v', Number(scrub.value) / 10 + '%');
    const active = chapters.filter(b => Number(b.dataset.t) <= t + .05).pop();
    chapters.forEach(b => b.classList.toggle('on', b === active));
};
const syncPlay = () => {
    player.classList.toggle('paused', video.paused);
    playBtn.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
};
const start = () => { const p = video.play(); if (p)
    p.catch(syncPlay); };
video.addEventListener('timeupdate', paint);
video.addEventListener('play', syncPlay);
video.addEventListener('pause', syncPlay);
playBtn.addEventListener('click', () => video.paused ? start() : video.pause());
muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    player.classList.toggle('unmuted', !video.muted);
    muteBtn.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    if (!video.muted)
        start();
});
scrub.addEventListener('pointerdown', () => { scrubbing = true; });
scrub.addEventListener('input', () => seek(Number(scrub.value) / 1000 * video.duration));
addEventListener('pointerup', () => { scrubbing = false; });
chapters.forEach(b => b.addEventListener('click', () => { seek(Number(b.dataset.t)); start(); }));
syncPlay();
paint();
if (!calm)
    start();
/* Tap bursts on the hero */
const heroEl = byId('home'), canvas = byId('sparks'), ctx = canvas.getContext('2d');
const COLORS = ['#fff5dc', '#f6c9b8', '#e9a9b6', '#ffffff', '#2a2320'];
let bits = [], raf = 0;
const sizeCanvas = () => {
    const r = Math.min(devicePixelRatio || 1, 2);
    canvas.width = heroEl.clientWidth * r;
    canvas.height = heroEl.clientHeight * r;
    ctx.setTransform(r, 0, 0, r, 0, 0);
};
addEventListener('resize', sizeCanvas);
sizeCanvas();
const tick = () => {
    ctx.clearRect(0, 0, heroEl.clientWidth, heroEl.clientHeight);
    bits = bits.filter(b => b.life > 0);
    bits.forEach(b => {
        b.vy += .16;
        b.x += b.vx;
        b.y += b.vy;
        b.spin += b.vs;
        b.life -= .016;
        ctx.save();
        ctx.globalAlpha = clamp(b.life * 2, 0, 1);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.spin);
        ctx.fillStyle = b.c;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.s, b.s * .72, 0, 0, 7);
        ctx.fill();
        ctx.restore();
    });
    raf = bits.length ? requestAnimationFrame(tick) : 0;
};
const burst = (x, y) => {
    if (calm)
        return;
    for (let i = 0; i < 34; i++) {
        const a = Math.random() * 6.28, v = 2 + Math.random() * 6;
        bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, s: 2 + Math.random() * 6, c: COLORS[i % COLORS.length], spin: a, vs: Math.random() * .3 - .15, life: .8 + Math.random() * .6 });
    }
    if (!raf)
        raf = requestAnimationFrame(tick);
};
/* Drag the hero to scrub, tap it to burst */
let drag = null;
heroEl.addEventListener('pointerdown', e => {
    if (e.target.closest('a,button,input') || e.button)
        return;
    drag = { x: e.clientX, t: video.currentTime, moved: false, wasPaused: video.paused };
});
heroEl.addEventListener('pointermove', e => {
    if (!drag)
        return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 10) {
        drag.moved = true;
        video.pause();
        heroEl.classList.add('dragging');
        heroEl.setPointerCapture(e.pointerId);
    }
    if (drag.moved && !video.seeking)
        seek(drag.t + dx / heroEl.clientWidth * video.duration);
});
const endDrag = (e) => {
    if (!drag)
        return;
    if (drag.moved) {
        heroEl.classList.remove('dragging');
        if (!drag.wasPaused)
            start();
    }
    else if (e.type === 'pointerup') {
        const r = heroEl.getBoundingClientRect();
        burst(e.clientX - r.left, e.clientY - r.top);
    }
    drag = null;
};
heroEl.addEventListener('pointerup', endDrag);
heroEl.addEventListener('pointercancel', endDrag);
/* Pointer depth, desktop only */
if (finePointer) {
    const film = byId('film');
    addEventListener('pointermove', e => {
        film.style.setProperty('--px', (.5 - e.clientX / innerWidth) * 18 + 'px');
        film.style.setProperty('--py', (.5 - e.clientY / innerHeight) * 12 + 'px');
    }, { passive: true });
    document.querySelectorAll('.flavor,.story-art,.value').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg');
            card.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 6 + 'deg');
            card.style.setProperty('--gx', (e.clientX - r.left) / r.width * 100 + '%');
            card.style.setProperty('--gy', (e.clientY - r.top) / r.height * 100 + '%');
        });
        card.addEventListener('pointerleave', () => { card.style.removeProperty('--ry'); card.style.removeProperty('--rx'); });
    });
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('pointermove', e => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--mx', (e.clientX - r.left - r.width / 2) * .12 + 'px');
            btn.style.setProperty('--my', (e.clientY - r.top - r.height / 2) * .2 + 'px');
        });
        btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
    });
}
