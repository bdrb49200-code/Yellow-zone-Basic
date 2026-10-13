'use strict';
const {db,esc,list,save,safeURL}=SM,$=s=>document.querySelector(s);
const specs={
 sm_products:{title:'الألعاب والتجهيزات وقطع الغيار',fields:[['name_ar','اسم المنتج'],['category','القسم الرئيسي','select','games:ألعاب|parts:قطع الغيار|safety:السلامة والحماية'],['group_key','القسم الداخلي','select','slides:الزحاليق|climbing:التسلق|interactive:الألعاب التفاعلية|rides:الألعاب الدوارة|roadplay:ألعاب الطرق والتمثيل|softplay:السوفت بلاي|challenge:ألعاب التحدي|trampoline:الترامبولين|sand:الرمل وملحقاته|flooring:الأرضيات والحماية|foam:الفوم والحماية|installation:لوازم التركيب|safety:الحواجز والسلامة|inflatable:الألعاب الهوائية|other:منتجات أخرى'],['price','السعر بالريال','number'],['price_visible','إظهار السعر للعميل','checkbox'],['discount_percent','نسبة الخصم %','number'],['unit_ar','وحدة البيع'],['image','رابط صورة المنتج','text'],['gallery','صور إضافية: رابط في كل سطر','textarea'],['options_ar','الخيارات المتاحة (ألوان / مقاسات)','textarea'],['aliases','كلمات البحث المشابهة'],['description_ar','الوصف','textarea'],['featured','منتج مميز','checkbox'],['published','منشور','checkbox']]},
 sm_centers:{title:'المراكز وأعمالنا',fields:[['name_ar','اسم المركز'],['city_ar','المدينة'],['logo','رابط شعار المركز'],['gallery','صور المعرض: رابط في كل سطر والترتيب من الأعلى للأسفل','textarea'],['image','رابط الصورة','text'],['published','منشور','checkbox']]},
 sm_pages:{title:'الصفحات والبنرات',fields:[['title_ar','العنوان'],['body_ar','المحتوى','textarea'],['image','رابط صورة أو بنر','text'],['published','منشور','checkbox']]},
 sm_settings:{title:'إعدادات الموقع',fields:[['brand_ar','اسم المؤسسة'],['whatsapp','واتساب بصيغة دولية بدون +'],['instagram','رابط إنستغرام','url'],['phone','رقم الاتصال'],['logo','رابط شعار الموقع'],['facebook','فيسبوك','url'],['tiktok','تيك توك','url'],['youtube','يوتيوب','url'],['catalog','رابط الكتالوج','url'],['payment_ar','تعليمات الدفع','textarea'],['shipping_ar','تفاصيل الشحن','textarea']]},
 sm_orders:{title:'الطلبات',fields:[['status','حالة الطلب','select','pending:جديد|reviewing:قيد المراجعة|quoted:تم إرسال السعر|completed:مكتمل|cancelled:ملغي']]}
}
let table='sm_products',rows=[],editing=null,demo=false,busy=false,productCategory='games',productGroup='all';const demoData=structuredClone(SM_SEED);demoData.sm_orders=[];
function notify(t){$('#message').textContent=t;$('#message').style.display='block';setTimeout(()=>$('#message').style.display='none',5000)}
function start(){ $('#login').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;$('#mode').textContent='متصل بقاعدة البيانات — التعديلات المنشورة تظهر للعملاء عند تحديث الصفحة.';$('#tabs').innerHTML=adminTabs.map(t=>`<button data-table="${t.table}" ${t.category?`data-product-category="${t.category}"`:''}>${t.label}</button>`).join('');load();}
async function load(){try{rows=demo?demoData[table]:await list(table);const sectionTitle=table==='sm_products'?(productCategoryLabels[productCategory]||'المنتجات'):specs[table].title;$('#heading').textContent=sectionTitle;$('#new').hidden=table==='sm_orders'||(table==='sm_settings'&&rows.length>0);$('#new').textContent=table==='sm_products'?'+ إضافة منتج':'إضافة';document.querySelectorAll('#tabs [data-table]').forEach(b=>{const sameTable=b.dataset.table===table;b.classList.toggle('active',sameTable)});render()}catch(e){notify('تعذر التحميل: '+e.message)}}
const orderStatusLabels={pending:'جديد',reviewing:'قيد المراجعة',quoted:'تم إرسال السعر',completed:'مكتمل',cancelled:'ملغي'};
const productGroupLabels={slides:'الزحاليق',climbing:'التسلق',interactive:'الألعاب التفاعلية',rides:'الألعاب الدوارة',roadplay:'ألعاب الطرق والتمثيل',softplay:'السوفت بلاي',challenge:'ألعاب التحدي',trampoline:'الترامبولين',sand:'الرمل وملحقاته',flooring:'الأرضيات والحماية',foam:'الفوم والحماية',installation:'لوازم التركيب',safety:'الحواجز والسلامة',inflatable:'الألعاب الهوائية',other:'منتجات أخرى'};
const adminTabs=[
 {table:'sm_products',label:'المنتجات'},
 {table:'sm_centers',label:'المراكز وأعمالنا'},
 {table:'sm_pages',label:'الصفحات والبنرات'},
 {table:'sm_settings',label:'إعدادات الموقع'},
 {table:'sm_orders',label:'الطلبات'}
];
const productCategoryLabels={games:'الألعاب',parts:'قطع الغيار',safety:'السلامة والحماية'};
function productGroupLabel(value){
 if(!value)return 'منتجات أخرى';
 if(productGroupLabels[value])return productGroupLabels[value];
 if(String(value).startsWith('custom:'))return String(value).slice(7)||'قسم جديد';
 return String(value);
}
function productGroupValueFromName(name){
 const clean=String(name||'').trim();
 if(!clean)return 'other';
 const found=Object.entries(productGroupLabels).find(([,label])=>label===clean);
 return found?found[0]:'custom:'+clean;
}
const quickProductFields=['name_ar','group_key','price','price_visible','description_ar','published'];
const advancedProductFields=['discount_percent','unit_ar','image','gallery','options_ar','aliases','featured'];
const productGroupsByCategory={
 games:['slides','climbing','interactive','rides','roadplay','softplay','challenge','trampoline','inflatable','other'],
 parts:['installation','slides','climbing','trampoline','sand','other'],
 safety:['flooring','foam','safety','other']
};
const defaultProductGroup={games:'rides',parts:'installation',safety:'safety'};

const translationFields={
 sm_products:[['name_ar','name_en'],['unit_ar','unit_en'],['description_ar','description_en'],['options_ar','options_en']],
 sm_centers:[['name_ar','name_en'],['city_ar','city_en']],
 sm_pages:[['title_ar','title_en'],['body_ar','body_en']],
 sm_settings:[['brand_ar','brand_en'],['payment_ar','payment_en'],['shipping_ar','shipping_en']]
};
let translationWarning=false;
async function translateRow(kind,row){
 const pairs=translationFields[kind]||[];if(!pairs.length)return row;
 if(demo||!db){for(const[a,b]of pairs)if(!row[b])row[b]=row[a]||'';return row;}
 const texts=pairs.map(([a])=>String(row[a]||''));
 for(let attempt=0;attempt<2;attempt++){
  try{
   const {data,error}=await db.functions.invoke('sm-admin-translate',{body:{texts}});
   if(!error&&data&&Array.isArray(data.translations)&&data.translations.length===pairs.length){
    pairs.forEach(([a,b],i)=>row[b]=String(data.translations[i]||row[a]||'').trim());
    return row;
   }
  }catch{}
  if(attempt===0)await new Promise(r=>setTimeout(r,700));
 }
 translationWarning=true;
 for(const[a,b]of pairs)if(!String(row[b]||'').trim())row[b]=String(row[a]||'').trim();
 return row;
}
function selectOptions(raw,val){return String(raw||'').split('|').filter(Boolean).map(item=>{const i=item.indexOf(':'),value=i<0?item:item.slice(0,i),label=i<0?item:item.slice(i+1);return `<option value="${esc(value)}" ${String(val)===value?'selected':''}>${esc(label)}</option>`}).join('')}
function orderMoney(n){return new Intl.NumberFormat('ar-SA',{maximumFractionDigits:2}).format(Number(n)||0)+' ر.س'}
function orderDate(v){try{return new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch{return v||''}}
function orderField(label,value){if(value===undefined||value===null||String(value).trim()==='')return '';return `<div class="orderField"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`}
function orderItems(items){if(!Array.isArray(items)||!items.length)return '<p class="orderEmpty">لا توجد منتجات في الطلب.</p>';return `<div class="orderItems">${items.map((item,i)=>{const name=item.name_ar||item.name_en||`منتج ${i+1}`,qty=Number(item.quantity)||0,price=Number(item.unit_price)||0,list=Number(item.list_price??price)||0,pct=Number(item.discount_percent)||0;return `<div class="orderItem"><div><strong>${esc(name)}</strong><small>الكمية: ${esc(qty)}${pct?` · خصم ${esc(pct)}%`:''}</small></div><div class="orderItemPrice">${pct?`<span class="oldOrderPrice">${orderMoney(list)} × ${esc(qty)}</span>`:`<span>${orderMoney(price)} × ${esc(qty)}</span>`}<b>${orderMoney(price*qty)}</b></div></div>`}).join('')}</div>`}
function orderCard(r){
 const c=r.contact&&typeof r.contact==='object'?r.contact:{};
 const phone=c.recipient_phone||c.phone||r.phone||'',wa=SM.saPhone(phone),status=orderStatusLabels[r.status]||r.status||'',subtotal=Number(r.estimated_subtotal)||0,vat=Number(r.vat_amount)||Math.round(subtotal*.15*100)/100,total=Number(r.estimated_total)||Math.round((subtotal+vat)*100)/100,discount=Number(r.discount_total)||0;
 const customerName=r.contact_name||c.contact_name||r.company||c.company||'عميل';
 const companyName=r.company||c.company||'';
 return `<details class="orderCard"><summary class="orderSummary"><div class="orderSummaryMain"><span class="orderCustomerName">${esc(customerName)}</span>${companyName&&companyName!==customerName?`<small>${esc(companyName)}</small>`:''}<small>${esc(orderDate(r.created_at))}</small></div><div class="orderSummaryMeta"><span class="statusBadge status-${esc(r.status||'pending')}">${esc(status)}</span><span class="orderNumber">#${esc(String(r.id||'').slice(0,8))}</span><span class="summaryHint">اضغط لعرض البيانات</span></div></summary><div class="orderDetails"><div class="orderSection"><h4>بيانات التواصل</h4><div class="orderFields">${orderField('اسم المؤسسة',r.company||c.company)}${orderField('اسم المسؤول',r.contact_name||c.contact_name)}${orderField('الرقم الضريبي',c.tax_number)}${orderField('العنوان الوطني',c.national_address||c.address)}${orderField('اسم المستلم',c.recipient_name)}${orderField('جوال المستلم',c.recipient_phone||r.phone)}</div></div>${c.notes?`<div class="orderSection"><h4>ملاحظات العميل</h4><p class="orderNotes">${esc(c.notes)}</p></div>`:''}<div class="orderSection"><h4>المنتجات</h4>${orderItems(r.items)}</div><div class="orderBottom"><div class="orderTotalsAdmin">${discount>0?`<div><span>إجمالي الخصومات</span><b>− ${orderMoney(discount)}</b></div>`:''}<div><span>الإجمالي قبل الضريبة</span><b>${orderMoney(subtotal)}</b></div><div><span>ضريبة القيمة المضافة 15%</span><b>${orderMoney(vat)}</b></div><div class="grand"><span>الإجمالي شامل الضريبة</span><strong>${orderMoney(total)}</strong></div></div><div class="orderActions">${wa?`<a class="whatsapp orderWhatsApp" href="https://wa.me/${wa}" target="_blank" rel="noopener">واتساب العميل</a>`:''}<button data-edit="${esc(r.id)}">تغيير حالة الطلب</button><button class="danger" data-delete-order="${esc(r.id)}">حذف الطلب</button></div></div></div></details>`
}
function render(){
 const q=$('#search').value.trim();
 const categoryBar=$('#productCategories');
 let shown=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
 if(table==='sm_products'){
  shown=shown.filter(r=>r.category===productCategory);
  if(productGroup!=='all')shown=shown.filter(r=>(r.group_key||'other')===productGroup);
  categoryBar.hidden=false;
  const sectionRows=rows.filter(r=>r.category===productCategory);
  const counts={all:sectionRows.length};sectionRows.forEach(r=>{const g=r.group_key||'other';counts[g]=(counts[g]||0)+1});
  const knownForCategory=productGroupsByCategory[productCategory]||[];
  const presentGroups=[...new Set([...knownForCategory.filter(g=>counts[g]),...sectionRows.map(r=>r.group_key||'other')])];
  const mainCats=Object.entries(productCategoryLabels).map(([key,label])=>`<button data-product-category-inner="${key}" class="mainCategoryBtn ${productCategory===key?'active':''}">${label}<small>${rows.filter(r=>r.category===key).length}</small></button>`).join('');
  const groupBtns=[['all','الكل'],...presentGroups.map(g=>[g,productGroupLabel(g)])].map(([key,label])=>`<button data-product-group="${esc(key)}" class="${productGroup===key?'active':''}">${esc(label)}<small>${counts[key]||0}</small></button>`).join('');
  categoryBar.innerHTML=`<div class="categoryLevel mainCategoryLevel">${mainCats}</div><div class="categoryLevel subCategoryLevel">${groupBtns}<button type="button" class="addGroupBtn" data-add-product-group>+ إضافة قسم</button></div>`;
 }else categoryBar.hidden=true;
 $('#stats').innerHTML=`<span>السجلات: ${shown.length}${table==='sm_products'?` في ${productCategoryLabels[productCategory]}`:shown.length!==rows.length?` من ${rows.length}`:''}</span><span>القسم: ${table==='sm_products'?(productGroup==='all'?'الكل':productGroupLabel(productGroup)):specs[table].title}</span>`;
 if(table==='sm_orders'){
  $('#records').innerHTML=shown.length?shown.map(orderCard).join(''):'<article>لا توجد طلبات مطابقة.</article>';
  return;
 }
 const catLabel={games:'ألعاب',parts:'قطع الغيار',safety:'السلامة والحماية'};
 $('#records').innerHTML=shown.length?shown.map(r=>`<article>${r.image?`<img src="${esc(safeURL(r.image))}" alt="">`:''}<div class="body"><h3>${esc(r.name_ar||r.title_ar||r.brand_ar||r.company||r.id)}</h3><p>${esc(r.city_ar||(table==='sm_products'?`${productGroupLabel(r.group_key)}`:r.slug||r.status||''))}</p>${table==='sm_products'?(r.price_visible===false?'<p class="requestPriceAdmin">السعر عند الطلب</p>':`<p>${esc(r.price)} ر.س / ${esc(r.unit_ar||'حبة')}${Number(r.discount_percent)>0?` · خصم ${esc(r.discount_percent)}%`:''}</p>`):(r.price!=null?`<p>${esc(r.price)} ر.س / ${esc(r.unit_ar)}</p>`:'')}${r.published===false?'<small>مخفي عن العملاء</small>':''}</div><div class="actions"><button data-edit="${esc(r.id)}">تعديل</button>${['sm_products','sm_centers','sm_pages'].includes(table)?`<button class="danger" data-delete="${esc(r.id)}">حذف</button>`:''}</div></article>`).join(''):'<article>لا توجد سجلات مطابقة.</article>';
}
function fieldHTML(def,editingRow){
 const [key,label,type='text',options]=def;
 let raw=editingRow[key];
 if(key==='gallery')raw=(editingRow.gallery||[]).join('\n');
 if(raw===undefined||raw===null||raw===''){
  if(type==='checkbox')raw=['price_visible','published'].includes(key);
  else if(key==='unit_ar')raw='حبة';
  else if(key==='group_key')raw='other';
  else raw='';
 }
 let control;
 if(type==='textarea')control=`<textarea name="${key}" rows="4">${esc(raw)}</textarea>`;
 else if(type==='select'){
  if(key==='group_key'){
   const values=[...(productGroupsByCategory[productCategory]||[]),...rows.filter(r=>r.category===productCategory).map(r=>r.group_key).filter(Boolean)];
   const unique=[...new Set(values)];
   const display=productGroupLabel(raw);
   control=`<input name="group_key_label" value="${esc(display==='منتجات أخرى'&&raw==='other'?'منتجات أخرى':display)}" list="groupKeyList" placeholder="اكتب اسم القسم أو اختاره"><datalist id="groupKeyList">${unique.map(g=>`<option value="${esc(productGroupLabel(g))}"></option>`).join('')}</datalist><input name="${key}" type="hidden" value="${esc(raw)}">`;
  }else control=`<select name="${key}">${selectOptions(options,raw)}</select>`;
 }
 else control=`<input name="${key}" type="${type}" ${type==='checkbox'?(raw?'checked':''):`value="${esc(raw)}"`} ${type==='number'?'min="0" step="0.01"':''} ${['name_ar','title_ar','brand_ar'].includes(key)?'required':''}>`;
 return `<label class="${type==='textarea'?'wide':''}">${label}${control}</label>`;
}
function edit(id){
 editing=rows.find(r=>String(r.id)===id)||{};
 if(table==='sm_products'&&!editing.id){editing.category=productCategory;editing.unit_ar='حبة';editing.price_visible=true;editing.published=true;editing.group_key=productGroup!=='all'?productGroup:(defaultProductGroup[productCategory]||'other');editing.discount_percent=0;editing.gallery=[];editing.featured=false;}
 $('#formError').textContent='';
 $('#editTitle').textContent=table==='sm_products'?(editing.id?'تعديل المنتج':'إضافة منتج'):'تعديل';
 if(table==='sm_products'){
  const defs=specs.sm_products.fields;
  const map=Object.fromEntries(defs.map(d=>[d[0],d]));
  const quick=quickProductFields.map(k=>fieldHTML(map[k],editing)).join('');
  const advanced=advancedProductFields.map(k=>fieldHTML(map[k],editing)).join('');
  $('#fields').innerHTML=`<div class="autoTranslateNote">الإضافة السريعة: اكتب الاسم، اختار أو اكتب اسم القسم، حط السعر والصورة، واحفظ. لو كتبت قسم جديد هيظهر تلقائيًا في القائمة.</div><input type="hidden" name="category" value="${esc(productCategory)}">${quick}<label class="wide quickUpload">صورة المنتج<input type="file" id="upload" accept="image/png,image/jpeg,image/webp"><small>اختار الصورة من جهازك مباشرة.</small></label><details class="advancedFields wide"><summary>إعدادات إضافية (اختياري)</summary><div class="advancedGrid">${advanced}<label class="wide">رفع صور إضافية للمنتج<input id="productGalleryUpload" type="file" multiple accept="image/png,image/jpeg,image/webp"></label></div></details>`;
 }else{
  $('#fields').innerHTML=`<div class="autoTranslateNote">اكتب بالعربي فقط — الترجمة الإنجليزية تُنشأ تلقائيًا عند الحفظ وتظهر للعميل عند اختيار English.</div>`+specs[table].fields.map(def=>fieldHTML(def,editing)).join('');
  if(['sm_centers','sm_pages'].includes(table))$('#fields').insertAdjacentHTML('beforeend','<label class="wide">رفع صورة (PNG / JPEG / WebP، حتى 5 ميجابايت)<input type="file" id="upload" accept="image/png,image/jpeg,image/webp"><small>أو استخدم رابط صورة موجودة بالأعلى.</small></label>');
  if(table==='sm_centers')$('#fields').insertAdjacentHTML('beforeend','<label class="wide">رفع صور المعرض (تضاف بعد الصور الحالية)<input id="galleryUpload" type="file" multiple accept="image/png,image/jpeg,image/webp"></label><label>رفع شعار المركز<input id="logoUpload" type="file" accept="image/png,image/jpeg,image/webp"></label>');
  if(table==='sm_settings')$('#fields').insertAdjacentHTML('beforeend','<label>رفع شعار الموقع<input id="logoUpload" type="file" accept="image/png,image/jpeg,image/webp"></label>');
 }
 $('#editor').showModal();
}
$('#editForm').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;translationWarning=false;const saveButton=$('#save'),oldSaveText=saveButton.textContent;saveButton.disabled=true;saveButton.textContent=table==='sm_orders'?'جاري الحفظ...':'جاري الترجمة والحفظ...';try{const row={...editing};for(const[k,,type]of specs[table].fields){const el=e.target.elements[k];if(!el)continue;row[k]=type==='checkbox'?el.checked:type==='number'?Number(el.value):el.value.trim();}if(table==='sm_products'){row.category=productCategory;const label=e.target.elements.group_key_label?.value||'';row.group_key=productGroupValueFromName(label);}if(['sm_centers','sm_products'].includes(table)){row.gallery=String(row.gallery||'').split('\n').map(x=>x.trim()).filter(Boolean);if(row.gallery.some(x=>!safeURL(x)))throw Error('رابط صورة غير صالح');}if(!row.id)row.id=table==='sm_settings'?'global':crypto.randomUUID();if(table==='sm_pages'&&!row.slug)row.slug='page-'+Date.now();if(table!=='sm_orders')await translateRow(table,row);const file=$('#upload')?.files[0];if(file){if(file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('صيغة الصورة أو حجمها غير مناسب');if(demo)throw Error('رفع الصور يحتاج ربط قاعدة البيانات. يمكنك تجربة رابط صورة في المعاينة.');else{const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type],path=`${crypto.randomUUID()}.${ext}`;const {error}=await db.storage.from('sm-media').upload(path,file,{contentType:file.type});if(error)throw error;row.image=db.storage.from('sm-media').getPublicUrl(path).data.publicUrl;}}if(table==='sm_products')for(const file of Array.from($('#productGalleryUpload')?.files||[]))row.gallery.push(await uploadImage(file));if($('#logoUpload')?.files[0])row.logo=await uploadImage($('#logoUpload').files[0]);if(table==='sm_centers')for(const file of Array.from($('#galleryUpload')?.files||[]))row.gallery.push(await uploadImage(file));if(demo){const i=demoData[table].findIndex(r=>r.id===row.id);if(i<0)demoData[table].push(row);else demoData[table][i]=row;}else if(table==='sm_orders'){const{error}=await db.from(table).update({status:row.status}).eq('id',row.id);if(error)throw error;}else await save(table,row);$('#editor').close();await load();notify(demo?'تم تعديل المعاينة المحلية':translationWarning?'تم الحفظ. تعذر تحديث الإنجليزية مؤقتًا وسيُعاد المحاولة عند التعديل القادم.':'تم الحفظ والترجمة تلقائيًا')}catch(err){$('#formError').textContent=err.message}finally{busy=false;saveButton.disabled=false;saveButton.textContent=oldSaveText}};
$('#tabs').onclick=e=>{const b=e.target.closest('[data-table]');if(!b)return;table=b.dataset.table;if(table==='sm_products'){productCategory='games';productGroup='all';}$('#search').value='';load()};
$('#productCategories').onclick=e=>{
 const cat=e.target.closest('[data-product-category-inner]');
 if(cat){productCategory=cat.dataset.productCategoryInner;productGroup='all';load();return;}
 const b=e.target.closest('[data-product-group]');if(b){productGroup=b.dataset.productGroup;render();return;}
 if(e.target.closest('[data-add-product-group]')){const name=prompt('اكتب اسم القسم الجديد، مثال: ألعاب مائية');if(!name?.trim())return;productGroup=productGroupValueFromName(name);edit('');}
};
$('#new').onclick=()=>edit('');$('#close').onclick=()=>$('#editor').close();$('#refresh').onclick=load;$('#search').oninput=render;
$('#records').onclick=async e=>{
 const editBtn=e.target.closest('[data-edit]');
 const deleteBtn=e.target.closest('[data-delete]');
 const deleteOrderBtn=e.target.closest('[data-delete-order]');
 if(editBtn)edit(editBtn.dataset.edit);
 if(deleteBtn&&confirm('حذف هذا السجل؟ يمكنك إخفاؤه بدل الحذف من شاشة التعديل.')){
  try{const id=deleteBtn.dataset.delete;if(demo)demoData[table]=demoData[table].filter(r=>r.id!==id);else{const{error}=await db.from(table).delete().eq('id',id);if(error)throw error}await load();notify('تم الحذف')}catch(err){notify('تعذر الحذف: '+err.message)}
 }
 if(deleteOrderBtn){
  const id=deleteOrderBtn.dataset.deleteOrder;
  const order=rows.find(r=>String(r.id)===String(id));
  const c=order?.contact&&typeof order.contact==='object'?order.contact:{};
  const name=order?.contact_name||c.contact_name||order?.company||c.company||'العميل';
  if(!confirm(`حذف طلب ${name} نهائيًا؟ لا يمكن التراجع عن الحذف.`))return;
  try{const{error}=await db.from('sm_orders').delete().eq('id',id);if(error)throw error;await load();notify('تم حذف الطلب نهائيًا')}catch(err){notify('تعذر حذف الطلب: '+err.message)}
 }
};
$('#logout').onclick=async()=>{if(db)await db.auth.signOut();location.reload()};
const loginErrorMessage=code=>({invalid_credentials:'اسم المستخدم أو كلمة المرور غير صحيحة.',too_many_attempts:'محاولات دخول كثيرة. انتظر 15 دقيقة ثم جرّب مرة أخرى.',forbidden:'هذا الحساب غير مصرح له بدخول الإدارة.',server_config:'إعدادات تسجيل الدخول غير مكتملة.',server_error:'حدث خطأ في تسجيل الدخول. جرّب مرة أخرى.'}[code]||'تعذر تسجيل الدخول. جرّب مرة أخرى.');
function timeout(promise,ms=15000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('انتهت مهلة الاتصال. تأكد من الإنترنت ثم جرّب مرة أخرى.')),ms))])}
$('#loginForm').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,errorBox=$('#loginError'),button=form.querySelector('button');errorBox.textContent='';if(!db){errorBox.textContent='تعذر الاتصال بقاعدة البيانات.';return}const username=form.elements.username.value.trim().toLowerCase(),password=form.elements.password.value;if(!username||!password){errorBox.textContent='اكتب اسم المستخدم وكلمة المرور.';return}button.disabled=true;button.textContent='جاري التحقق...';try{const result=await timeout(db.functions.invoke('sm-admin-login',{body:{username,password}}));const payload=result?.data;if(result?.error&&!payload)throw Error('تعذر الوصول لخدمة تسجيل الدخول.');if(!payload?.ok){errorBox.textContent=loginErrorMessage(payload?.error);return}if(!payload.access_token||!payload.refresh_token)throw Error('تعذر إنشاء جلسة الدخول.');const{data:setData,error:setError}=await timeout(db.auth.setSession({access_token:payload.access_token,refresh_token:payload.refresh_token}));if(setError||!setData?.session)throw Error('تعذر إنشاء جلسة الدخول.');const{data:adminRow,error:adminError}=await timeout(db.from('sm_admins').select('user_id').eq('user_id',setData.user.id).maybeSingle());if(adminError||!adminRow){await db.auth.signOut();throw Error('هذا الحساب غير مصرح له بدخول الإدارة.');}sessionStorage.setItem('sm-admin-username',username);form.password.value='';start()}catch(err){errorBox.textContent=err.message||'تعذر تسجيل الدخول.'}finally{button.disabled=false;button.textContent='دخول'}};

async function uploadImage(file){if(!db)throw Error('رفع الصور يحتاج ربط قاعدة البيانات');if(file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('كل صورة يجب أن تكون PNG/JPEG/WebP وأقل من 5 ميجابايت');const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type],path=crypto.randomUUID()+'.'+ext;const {error}=await db.storage.from('sm-media').upload(path,file,{contentType:file.type});if(error)throw error;return db.storage.from('sm-media').getPublicUrl(path).data.publicUrl;}
async function restoreAdmin(){if(!db)return;const {data,error}=await db.auth.getUser();if(error||!data.user)return;const res=await db.from('sm_admins').select('user_id').eq('user_id',data.user.id).maybeSingle();if(res.data){history.replaceState(null,'',location.pathname);start()}else{await db.auth.signOut();notify('الحساب غير مصرح له بإدارة الموقع')}}restoreAdmin();
