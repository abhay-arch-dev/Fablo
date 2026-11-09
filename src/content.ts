// Loads content.json, fills the page, then starts main.js (which needs the finished DOM).
(async()=>{
  interface Link{label:string;href?:string;whatsapp?:string}
  const res=await fetch('content.json',{cache:'no-cache'});
  const c=await res.json();
  const $=(sel:string)=>document.querySelector(sel) as HTMLElement;
  const waIcon='<svg class="wa-i" aria-hidden="true"><use href="#wa"/></svg>';
  const waHref=(msg:string)=>`https://wa.me/${String(c.contact.whatsappNumber).replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
  const esc=(s:string)=>s.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));

  // A link: WhatsApp (opens in new tab, with icon) or a normal href
  const link=(l:Link,cls='')=>l.whatsapp
    ?`<a class="${cls}" href="${waHref(l.whatsapp)}" target="_blank" rel="noopener">${cls?waIcon:''}${esc(l.label)}</a>`
    :`<a class="${cls}" href="${esc(l.href??'#')}"${/^https?:/.test(l.href??'')?' rel="noopener"':''}>${esc(l.label)}</a>`;
  const waBtn=(l:{label:string;whatsapp:string},cls='btn wa')=>link(l,cls);

  // Plain text fields: <el data-c="hero.eyebrow">
  document.querySelectorAll<HTMLElement>('[data-c]').forEach(el=>{
    const v=el.dataset.c!.split('.').reduce((o:any,k)=>o?.[k],c);
    if(typeof v==='string')el.textContent=v;
  });

  document.title=c.meta.title;
  document.querySelector('meta[name=description]')?.setAttribute('content',c.meta.description);

  $('#nav').innerHTML=c.nav.map((l:Link)=>link(l)).join('');
  $('#headerCta').outerHTML=waBtn(c.headerCta,'nav-cta');

  const h=c.hero;
  $('#heroActions').innerHTML=waBtn(h.orderButton)+link(h.primaryLink,'btn')+link(h.secondaryLink,'btn secondary');
  $('#chapters').innerHTML=c.videoChapters.map((ch:{label:string;time:number})=>`<button type="button" data-t="${ch.time}">${esc(ch.label)}</button>`).join('');

  // Ticker repeats the phrases so the loop is seamless
  const tick=c.ticker.map((t:string)=>`<span>${esc(t)} <i>✦</i></span>`).join('');
  $('#ticker').innerHTML=tick.repeat(4);

  $('#flavors').innerHTML=c.flavours.items.map((f:any)=>`
    <article class="flavor ${esc(f.color)}">
      <div class="flavor-copy"><small>${esc(f.tag)}</small><h3>${esc(f.name)}</h3><p>${esc(f.text)}</p>${waBtn({label:f.button,whatsapp:f.whatsapp})}</div>
      <img class="flavor-product" src="${esc(f.image)}" alt="${esc(f.imageAlt)}">
    </article>`).join('');

  const s=c.story;
  $('#storyTitle').innerHTML=s.titleLines.map(esc).join('<br>');
  $('#storyText').innerHTML=s.paragraphs.map((p:string)=>`<p>${esc(p)}</p>`).join('')+waBtn(s.button);

  $('#values').innerHTML=c.values.items.map((v:any)=>`<div class="value"><div class="num">${esc(v.label)}</div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join('');
  $('#whyCta').innerHTML=waBtn(c.values.button);

  const k=c.connect;
  $('#connectText').innerHTML=k.textLines.map(esc).join('<br>');
  $('#connectActions').innerHTML=waBtn(k.orderButton)+waBtn(k.contactButton,'btn')
    +`<a class="btn secondary" href="mailto:${esc(c.contact.email)}?subject=${encodeURIComponent(c.contact.emailSubject)}">${esc(c.contact.email)} ↗</a>`;

  $('#footLinks').innerHTML=c.footer.links.map((l:Link)=>link(l)).join('');
  $('#waFab').outerHTML=`<a aria-label="${esc(c.floatingButton.label)}" class="wa-fab" href="${waHref(c.floatingButton.whatsapp)}" target="_blank" rel="noopener">${waIcon}<b>${esc(c.floatingButton.label)}</b></a>`;

  const main=document.createElement('script');
  main.src='js/main.js';
  document.body.appendChild(main);
})().catch(err=>console.error('Could not load content.json',err));
