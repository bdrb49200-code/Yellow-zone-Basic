'use strict';
window.SM = (() => {
  const config = window.SM_CONFIG || {};
  const db = config.url && config.key && window.supabase ? window.supabase.createClient(config.url,config.key,{auth:{storageKey:'sm-'+(document.body.dataset.admin?'admin':'customer')}}) : null;
  const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL = x => { try { const u=new URL(x,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''; } catch { return ''; } };
  const read = (key,fallback) => {try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const write = (key,val) => {try{localStorage.setItem(key,JSON.stringify(val))}catch{}};
  async function list(table) { if(!db) throw Error('لم يتم ربط قاعدة البيانات / Database not connected'); const {data,error}=await db.from(table).select('*');if(error)throw error;return data; }
  async function save(table,row) {const {data,error}=await db.from(table).upsert(row).select();if(error)throw error;return data;}
  const normalize = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const synonyms=[['زحليق','زحليقه','زحاليق','زحلاقه','slide','slides'],['سست','سوست','سسته','زنبرك','spring','springs'],['كور','كرات','كره','balls','ball'],['ترامبولين','ترمبولين','trampoline'],['اسفنج','فوم','foam'],['تسلق','climbing','climb']];
  const tokens = s => normalize(s).split(' ').filter(Boolean);
  function matches(p,q){const hay=normalize([p.name_ar,p.name_en,p.description_ar,p.description_en,p.aliases].join(' '));return tokens(q).every(t=>{const group=synonyms.find(g=>g.some(w=>normalize(w)===t));return (group||[t]).some(w=>hay.includes(normalize(w)));});}
  return {db,esc,safeURL,read,write,list,save,normalize,matches};
})();
