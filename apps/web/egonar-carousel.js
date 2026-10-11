(function(){
function initCarousel(root){
 const slides=[...root.querySelectorAll('.egonar-carousel-slide')]; if(slides.length<2)return;
 const dots=[...root.querySelectorAll('[data-carousel-dot]')]; let index=slides.findIndex(x=>x.classList.contains('is-active')); if(index<0)index=0;
 let timer;
 const show=i=>{index=(i+slides.length)%slides.length;slides.forEach((s,n)=>s.classList.toggle('is-active',n===index));dots.forEach((d,n)=>d.classList.toggle('is-active',n===index));};
 const start=()=>{clearInterval(timer);timer=setInterval(()=>show(index+1),Number(root.dataset.carouselInterval)||5000)};
 root.querySelector('[data-carousel-prev]')?.addEventListener('click',()=>{show(index-1);start()});
 root.querySelector('[data-carousel-next]')?.addEventListener('click',()=>{show(index+1);start()});
 dots.forEach(d=>d.addEventListener('click',()=>{show(Number(d.dataset.carouselDot)||0);start()}));
 root.addEventListener('mouseenter',()=>clearInterval(timer));root.addEventListener('mouseleave',start);show(index);start();
}
document.querySelectorAll('[data-carousel]').forEach(initCarousel);
})();