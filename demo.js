'use strict';
const demoKey='stem-demo-v1';
let demoState={reviews:[],usedVideos:[],coupon:false};
try{const saved=JSON.parse(localStorage.getItem(demoKey));if(saved&&Array.isArray(saved.reviews)&&Array.isArray(saved.usedVideos)&&typeof saved.coupon==='boolean'){demoState={reviews:saved.reviews.filter(r=>r&&typeof r.product==='string'&&typeof r.name==='string'&&typeof r.text==='string'&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=5&&typeof r.video==='string'),usedVideos:saved.usedVideos.filter(v=>typeof v==='string'),coupon:saved.coupon}}}catch{}
function saveDemo(){try{localStorage.setItem(demoKey,JSON.stringify(demoState));return true}catch{return false}}
function reviewSummary(id){const rows=demoState.reviews.filter(r=>r.product===id);return rows.length?`★ ${(rows.reduce((a,r)=>a+r.stars,0)/rows.length).toFixed(1)} · ${rows.length} đánh giá thử — Xem / viết đánh giá`:'☆ Chưa có đánh giá · Viết đánh giá thử'}
let reviewedProduct=null,lastPayment=null;
const comboSelection=new Set();
function comboQuote(products,hasVideo){
 const unique=[...new Map(products.map(p=>[p.id,p])).values()];
 const comboRate=unique.length>=5?.2:unique.length>=3?.1:0;
 const useVideo=Boolean(hasVideo)&&comboRate<.2;
 const rate=useVideo?.2:comboRate;
 const subtotal=unique.reduce((sum,p)=>sum+Number(p.price),0);
 const total=unique.reduce((sum,p)=>sum+Math.round(Number(p.price)*(1-rate)),0);
 return {products:unique,comboRate,useVideo,rate,subtotal,total,saving:subtotal-total};
}
function selectedCombo(){return content.products.filter(p=>comboSelection.has(p.id)&&!unlockedProducts.has(p.id))}
function refreshCombo(){
 let bar=document.querySelector('#combo-bar');
 if(!bar){bar=node('section',undefined,'combo-bar');bar.id='combo-bar';document.querySelector('#kho').append(bar)}
 const q=comboQuote(selectedCombo(),demoState.coupon);
 let cartButton=document.querySelector('#cart-nav');if(!cartButton){cartButton=node('button',undefined,'seller-nav');cartButton.id='cart-nav';cartButton.onclick=()=>bar.scrollIntoView({behavior:'smooth',block:'center'});document.querySelector('nav').append(cartButton)}cartButton.textContent='Giỏ hàng ('+q.products.length+')';
 bar.replaceChildren(node('strong','Giỏ hàng của bạn'),node('p','3–4 bộ giảm 10% · Từ 5 bộ giảm 20%. Ưu đãi video không cộng dồn; áp dụng mức cao hơn.'));
 if(!q.products.length){bar.append(node('p','Giỏ hàng đang trống. Bấm “Thêm vào giỏ” trên sản phẩm bạn muốn mua.'));return}
 for(const p of q.products){const row=node('div',undefined,'payment-product-row'),remove=node('button','Bỏ khỏi giỏ','review-link');remove.onclick=()=>{comboSelection.delete(p.id);render()};row.append(node('span',p.title+' · '+money(p.price)),remove);bar.append(row)}
 bar.append(node('p',`${q.products.length} bộ · Giá gốc ${money(q.subtotal)} · Giảm ${q.rate*100}% (${money(q.saving)}) · Còn ${money(q.total)}`));
 const pay=node('button','Xem đơn & thanh toán','button');pay.onclick=()=>showCheckout(selectedCombo());const clear=node('button','Xóa giỏ hàng','review-link');clear.onclick=()=>{comboSelection.clear();render()};bar.append(pay,clear);
}
function showCheckout(products){
 const q=comboQuote(products.filter(p=>!unlockedProducts.has(p.id)),demoState.coupon);if(!q.products.length)return;
 let d=document.querySelector('#checkout-dialog');if(!d){d=node('dialog');d.id='checkout-dialog';document.body.append(d)}d.replaceChildren();
 const heading=node('div',undefined,'dialog-head'),close=node('button','✕');close.setAttribute('aria-label','Đóng thanh toán');close.onclick=()=>d.close();heading.append(node('h2','Kiểm tra đơn hàng'),close);d.append(heading);
 for(const p of q.products)d.append(node('p',p.title+' — '+money(p.price)+' / bộ'));
 d.append(node('p','Tạm tính: '+money(q.subtotal)),node('p',`${q.useVideo?'Ưu đãi video':'Ưu đãi combo'} ${q.rate*100}%: −${money(q.saving)}`),node('h3','Tổng thanh toán: '+money(q.total)));
 const confirm=node('button','Xác nhận thanh toán · '+money(q.total),'button');confirm.onclick=()=>{d.close();payProducts(q.products)};d.append(confirm);d.showModal();
}
function payDemo(p){showCheckout([p])}
function payProducts(products){
 const q=comboQuote(products.filter(p=>!unlockedProducts.has(p.id)),demoState.coupon);if(!q.products.length)return;
 for(const p of q.products){unlockedProducts.add(p.id);recordMarketplaceSale(p,q.rate);comboSelection.delete(p.id)}
 if(q.useVideo)demoState.coupon=false;
 saveDemo();lastPayment=q.products[0];
 document.querySelector('#payment-message').textContent=`Đã chọn ${q.products.length} bộ: ${q.products.map(p=>p.title).join(', ')}. Giá gốc ${money(q.subtotal)} · ${q.useVideo?'Ưu đãi video':'Ưu đãi combo'} ${q.rate*100}% · Tổng ${money(q.total)}.`;
 let links=document.querySelector('#payment-products');if(!links){links=node('div');links.id='payment-products';document.querySelector('#payment-message').after(links)}links.replaceChildren();
 for(const p of q.products){const row=node('div',undefined,'payment-product-row'),view=node('button','Xem hai PDF','button'),review=node('button','Đánh giá','review-link');view.onclick=()=>{document.querySelector('#payment-dialog').close();openProduct(p)};review.onclick=()=>{document.querySelector('#payment-dialog').close();openReviews(p)};row.append(node('strong',p.title),view,review);links.append(row)}
 document.querySelector('#payment-files').hidden=true;document.querySelector('#payment-review').hidden=true;
 render();document.querySelector('#payment-dialog').showModal();
}
function showReviewList(){const list=document.querySelector('#reviews-list');list.replaceChildren();const rows=demoState.reviews.filter(r=>r.product===reviewedProduct.id);if(!rows.length)list.append(node('p','Chưa có đánh giá thử cho bộ này.'));for(const r of rows){const item=node('article',undefined,'review-item');item.append(node('strong',`${r.name} · ${r.stars}/5 sao`),node('p',r.text));if(safeUrl(r.video)){const a=node('a','Xem video bài dạy ↗');a.href=safeUrl(r.video);a.target='_blank';a.rel='noopener noreferrer';item.append(a)}item.append(node('small','Đánh giá mô phỏng · Chưa xác minh mua hàng'));list.append(item)}}
function openReviews(p){reviewedProduct=p;document.querySelector('#reviews-title').textContent='Đánh giá · '+p.title;document.querySelector('#review-form').reset();document.querySelector('#review-status').textContent=demoState.coupon?'Bạn đang có ưu đãi thử 20% cho lượt mua tiếp theo.':'';showReviewList();document.querySelector('#reviews-dialog').showModal()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
document.querySelector('#payment-review').onclick=()=>{document.querySelector('#payment-dialog').close();openReviews(lastPayment)};
document.querySelector('#review-form').onsubmit=e=>{e.preventDefault();if(!reviewedProduct)return;const name=document.querySelector('#review-name').value.trim(),text=document.querySelector('#review-text').value.trim(),raw=document.querySelector('#review-video').value.trim(),video=raw?safeUrl(raw):'',stars=Number(document.querySelector('#review-stars').value),status=document.querySelector('#review-status');if(!name||!text){status.textContent='Bạn hãy nhập tên và nội dung đánh giá.';return}if(raw&&!video){status.textContent='Vui lòng dùng đường dẫn video HTTPS hợp lệ.';return}demoState.reviews.push({product:reviewedProduct.id,name,text,stars,video});let message='Đã thêm đánh giá thử. ';if(video){if(demoState.usedVideos.includes(video))message+='Video này đã nhận ưu đãi thử trước đó.';else if(demoState.coupon)message+='Bạn đã có ưu đãi 20% chờ sử dụng; ưu đãi không cộng dồn.';else{demoState.coupon=true;demoState.usedVideos.push(video);message+='Bạn nhận được ưu đãi thử 20% cho lần mua tiếp theo.'}}const stored=saveDemo();if(!stored)message+=' Trình duyệt không cho lưu: dữ liệu chỉ giữ đến khi tải lại trang.';document.querySelector('#review-form').reset();status.textContent=message;showReviewList();render()};
document.querySelector('#reset-demo').onclick=()=>{if(!confirm('Xóa toàn bộ đánh giá thử và ưu đãi trên trình duyệt này?'))return;demoState={reviews:[],usedVideos:[],coupon:false};saveDemo();showReviewList();render();document.querySelector('#review-status').textContent='Đã xóa dữ liệu trải nghiệm.'};

document.querySelector('#payment-files').onclick=()=>{document.querySelector('#payment-dialog').close();openProduct(lastPayment)};
