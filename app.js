'use strict';
const content=window.STEM_CONTENT;
const safeUrl=(value)=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}};
const formUrl=(value)=>{const u=safeUrl(value);if(!u)return '';const h=new URL(u).hostname;return h==='forms.gle'||h==='docs.google.com'?u:''};
const drawings={bridge:'<path d="M65 175H435M65 170L140 60L215 170L290 60L365 170L435 60M140 60H435M140 60V170M290 60V170M435 60V170"/><path d="M80 180V208M415 180V208"/>',house:'<path d="M140 105L250 35L360 105V205H140ZM140 105H360M250 35V135L360 205M140 205L250 135M200 205V145H235V205"/><path d="M278 118H320V156H278Z"/>',curve:'<path d="M65 205H440M95 215V30M110 188Q260 -75 410 188M145 139V188M200 74V188M260 56V188M320 82V188M375 137V188M110 188H410"/>',box:'<path d="M150 80L275 40L375 95L245 140ZM150 80V185L245 225L375 175V95M245 140V225M205 63L309 120V201M195 100L321 66"/>'};
function art(type){return '<svg viewBox="0 0 500 260" aria-hidden="true"><circle cx="390" cy="70" r="39" fill="#e5be69" opacity=".6"/><g stroke="#395f50" stroke-width="3" stroke-linejoin="round" fill="none">'+(drawings[type]||drawings.bridge)+'</g></svg>'}
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el}
let level='all';const root=document.querySelector('#products'),dialog=document.querySelector('#preview');
function render(){root.replaceChildren();const term=document.querySelector('#search').value.toLocaleLowerCase('vi').trim();let count=0;for(const p of content.products){if(level!=='all'&&p.level!==level)continue;if(term&&!`${p.title} ${p.id} ${p.topic} ${p.grades}`.toLocaleLowerCase('vi').includes(term))continue;count++;const card=node('article',undefined,'product');const cover=node('div',undefined,'cover '+(Object.hasOwn(drawings,p.art)?p.art:'bridge'));cover.innerHTML=art(p.art);cover.append(node('span',p.level+' · '+p.grades,'pill'),node('span',p.id,'cover-id'));const body=node('div',undefined,'product-body');body.append(node('div',p.topic,'meta'),node('h3',p.title),node('p',p.description),node('div','Trọn bộ: Kế hoạch bài dạy + Bản thiết kế STEM · 2 PDF','bundle-label'));const bottom=node('div',undefined,'card-bottom');bottom.append(node('span',new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p.price) + ' / bộ','price'));const actions=node('div',undefined,'actions'),sample=node('button','Xem mẫu');const pages=(p.previews||[]).filter(s=>typeof s==='string'&&(/^data:image\/(png|jpeg|webp);base64,/.test(s)||safeUrl(s))).slice(0,2);sample.disabled=pages.length===0;sample.title=pages.length?'Xem trước tối đa hai trang':'Chưa có bản xem mẫu';sample.onclick=()=>{document.querySelector('#preview-title').textContent=p.title;const area=document.querySelector('#preview-pages');area.replaceChildren(...pages.map((src,i)=>{const img=node('img');img.src=src;img.alt=`${p.title} — trang mẫu ${i+1}`;return img}));dialog.showModal()};actions.append(sample);const buy=node('button','Xem bộ tài liệu →','buy');buy.onclick=()=>openProduct(p);actions.append(buy);bottom.append(actions);body.append(bottom);const reviewButton=node('button',reviewSummary(p.id),'review-link');reviewButton.onclick=()=>openReviews(p);body.append(reviewButton);card.append(cover,body);root.append(card)}document.querySelector('#empty').hidden=count!==0}
document.querySelectorAll('[data-brand]').forEach(el=>el.textContent=content.brand||'STEM–Toán');if(content.contact)document.querySelector('#contact').textContent=content.contact;document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=b.dataset.level;document.querySelectorAll('[data-level]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});render()});document.querySelector('#search').addEventListener('input',render);document.querySelector('#close-preview').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});render();

const unlockedProducts = new Set();
function openProduct(product) {
  let detail=document.querySelector('#product-detail');
  if(!detail){detail=node('dialog');detail.id='product-detail';document.body.append(detail)}
  detail.replaceChildren();
  const heading=node('div',undefined,'dialog-head'),close=node('button','✕');
  close.setAttribute('aria-label','Đóng chi tiết');close.onclick=()=>detail.close();
  heading.append(node('h2',product.title),close);
  detail.append(heading,node('p',new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(product.price)+' / bộ · Gồm cả hai tài liệu'));
  const unlocked=unlockedProducts.has(product.id);
  for(const [title,url] of [['Kế hoạch bài dạy',product.lessonPdf],['Bản thiết kế STEM',product.designPdf]]){
    const section=node('section');section.append(node('h3',title));
    if(!unlocked)section.append(node('p','Mở bản đầy đủ sau thanh toán.'));
    else if(!safeUrl(url))section.append(node('p','PDF đang cập nhật.'));
    else{const link=node('a','Xem PDF ↗','button');link.href=safeUrl(url);link.target='_blank';link.rel='noopener noreferrer';section.append(link)}
    detail.append(section);
  }
  if(!unlocked){const pay=node('button','Thanh toán cả bộ','button');pay.onclick=()=>{detail.close();payDemo(product)};detail.append(pay)}
  detail.showModal();
}
