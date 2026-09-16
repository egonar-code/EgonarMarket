(()=>{const platform=document.body?.classList.contains('food-page')?'food':document.body?.classList.contains('travel-page')?'travel':'marketplace';const config={marketplace:{id:'marketplace',name:'EgonarMarket',ai:'Egonar AI',currency:'FCFA'},food:{id:'food',name:'Saveurs',ai:'Saveurs AI',currency:'FCFA'},travel:{id:'travel',name:'Évasion',ai:'Évasion AI',currency:'FCFA'}};window.EgonarPlatform=config[platform];
const load=(src)=>{const s=document.createElement('script');s.src=src;document.head.appendChild(s)};
load('i18n.js');load('language-switch.js');})();
