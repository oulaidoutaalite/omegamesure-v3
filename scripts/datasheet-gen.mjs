import crypto from 'node:crypto'
import fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const CACHE = 'C:/Users/oulai/AppData/Local/Temp/omx-diag/imgcache'
fs.mkdirSync(CACHE, { recursive: true })
function envVal(k){const m=fs.readFileSync('.env','utf8').match(new RegExp('^'+k+'="?([^"\\n]*)"?','m'));return m?m[1]:undefined}
const urls=[envVal('DATABASE_URL'),envVal('DIRECT_URL')].filter(Boolean)

async function fetchRetry(url,opt,n=5){for(let i=0;i<n;i++){try{const r=await fetch(url,opt);if(r.ok)return r;if(r.status<500&&r.status!==429)return r}catch{}await new Promise(r=>setTimeout(r,1500))}return null}
async function toDataUri(url){
  const key=CACHE+'/'+crypto.createHash('md5').update(url).digest('hex')
  try{if(fs.existsSync(key))return fs.readFileSync(key,'utf8')}catch{}
  const r=await fetchRetry(url);if(!r)return null
  const buf=Buffer.from(await r.arrayBuffer());const ct=r.headers.get('content-type')||'image/jpeg'
  const uri=`data:${ct};base64,${buf.toString('base64')}`;try{fs.writeFileSync(key,uri)}catch{};return uri
}
async function withDb(fn){let out,done=false;for(const url of urls){if(done)break;const db=new PrismaClient({datasources:{db:{url}}});try{out=await fn(db);done=true}catch(e){console.log('  db fail '+(url.includes('6543')?'6543':'5432')+': '+(e.message||'').split('\n').slice(-1)[0].slice(0,50))}finally{await db.$disconnect()}}if(!done)throw new Error('DB indisponible');return out}

// 1) Read storage creds + the Balances products
const data = await withDb(async(db)=>{
  const rows=await db.siteConfig.findMany({where:{key:{in:['storage.url','storage.key']}},select:{key:true,value:true}})
  const m=Object.fromEntries(rows.map(r=>[r.key,r.value]))
  const cat=await db.category.findUnique({where:{slug:process.argv[2]||'balances-bascules'},select:{id:true}})
  const products=await db.product.findMany({where:{categoryId:cat.id},select:{id:true,slug:true,name:true,model:true,shortDescription:true,description:true,images:true,specs:true,datasheetUrl:true}})
  return {url:m['storage.url'],key:m['storage.key'],products}
})
console.log('creds:'+(data.url&&data.key?'ok':'MANQUANT')+' · produits:'+data.products.length)
if(!data.url||!data.key){console.log('Pas de creds storage');process.exit(1)}

// 2) Logo
let logo=null
try{const h=await fetchRetry('https://www.omegamesure.com/');const html=h?await h.text():'';const mm=html.match(/https:\/\/[^"'\\]+supabase\.co[^"'\\]*logo[^"'\\]*\.png/i);if(mm)logo=await toDataUri(mm[0])}catch{}

function sheetHtml(p,imgData){
  const lines=(p.description||'').split('\n').map(l=>l.trim()).filter(Boolean)
  const body=lines.map(l=>{const i=l.indexOf(' : ');if(i>0)return `<div class="row"><span class="k">${l.slice(0,i)}</span><span class="v">${l.slice(i+3)}</span></div>`;return `<p class="pt">${l}</p>`}).join('')
  const sp=(p.specs&&Array.isArray(p.specs.rows)&&p.specs.rows.length)?p.specs:null
  const specsHtml=sp?`<h2>Spécifications par modèle</h2><table class="spectab"><thead><tr>${sp.columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${sp.rows.map(r=>`<tr>${r.map((c,j)=>`<td class="${j===0?'m':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:A4;margin:0 0 13mm 0}*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#23202a}
  .top{height:26mm;background:#2E2A52;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 14mm}
  .top .lg{background:#fff;border-radius:8px;padding:5px 9px}.top .lg img{height:38px;display:block}.top .lg .fb{font-weight:800;color:#2E2A52}
  .top .k{font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:.9}
  .wrap{padding:10mm 14mm}
  h1{font-size:24px;color:#2E2A52;font-weight:800;line-height:1.2}
  .ref{font-family:Consolas,monospace;font-size:12px;color:#EA8423;font-weight:700;margin-top:6px;word-break:break-word}
  .photo{margin:8mm 0;height:88mm;display:flex;align-items:center;justify-content:center;border:1px solid #eee;border-radius:14px;background:#fff}
  .photo img{max-height:84mm;max-width:88%;object-fit:contain}
  .nophoto{color:#bbb}
  h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#EA8423;font-weight:700;border-bottom:2px solid #2E2A52;padding-bottom:5px;margin-bottom:8px}
  .row{display:flex;gap:10px;padding:5px 0;border-bottom:1px solid #f0eef5;font-size:13px}
  .row .k{flex:0 0 42%;color:#2E2A52;font-weight:700}.row .v{flex:1;color:#333}
  .pt{font-size:13px;color:#555;margin-top:10px;line-height:1.5}
  .spectab{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px}
  .spectab thead{display:table-header-group}
  .spectab tr{break-inside:avoid;page-break-inside:avoid}
  h2{break-after:avoid;page-break-after:avoid}
  .spectab th{background:#2E2A52;color:#fff;text-align:left;padding:5px 8px;font-weight:700;white-space:nowrap}
  .spectab td{padding:5px 8px;border-bottom:1px solid #eee}
  .spectab td.m{font-weight:700;color:#2E2A52;font-family:Consolas,monospace}
  .foot{position:fixed;bottom:0;left:0;right:0;height:9mm;background:#2E2A52;color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;gap:8px}
  </style></head><body>
  <div class="top"><div class="lg">${logo?`<img src="${logo}"/>`:'<span class="fb">Ω OMEGA MESURE</span>'}</div><div class="k">Fiche technique</div></div>
  <div class="wrap">
    <h1>${p.name}</h1><div class="ref">Réf. : ${p.model||'—'}</div>
    <div class="photo">${imgData?`<img src="${imgData}"/>`:'<span class="nophoto">photo</span>'}</div>
    ${specsHtml}<h2>Caractéristiques techniques</h2>${body}
  </div>
  <div class="foot">OMEGA MESURE ET INSTRUMENTATION · Distributeur agréé · Bouskoura, Maroc · contact@omegamesure.com · www.omegamesure.com</div>
  </body></html>`
}

async function upload(slug,buf){
  const obj=`datasheets/${slug}.pdf`
  const r=await fetchRetry(`${data.url}/storage/v1/object/media/${obj}`,{method:'POST',headers:{apikey:data.key,Authorization:`Bearer ${data.key}`,'Content-Type':'application/pdf','x-upsert':'true','cache-control':'31536000'},body:buf})
  if(!r||!r.ok){const t=r?await r.text().catch(()=>''):'no resp';return {ok:false,err:(r?r.status:'')+' '+t.slice(0,80)}}
  return {ok:true,url:`${data.url}/storage/v1/object/public/media/${obj}`}
}

// 3) Generate + upload
const arg=process.argv[3]
const todo=arg==='all'?data.products:arg?data.products.filter(p=>p.slug===arg):data.products.filter(p=>!p.datasheetUrl)
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']})
const results=[]
for(const p of todo){
  const imgs=Array.isArray(p.images)?p.images:[]
  const imgUrl=imgs[0]?.url
  const imgData=imgUrl?await toDataUri(imgUrl):null
  const page=await browser.newPage()
  await page.setContent(sheetHtml(p,imgData),{waitUntil:'networkidle0',timeout:60000})
  const buf=Buffer.from(await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true}))
  await page.close()
  const up=await upload(p.slug,buf)
  results.push({id:p.id,slug:p.slug,...up})
  console.log('  '+(up.ok?'✓':'✗')+' '+p.slug+(up.ok?'':' — '+up.err))
}
await browser.close()

// 4) Update products datasheetUrl
const ok=results.filter(r=>r.ok)
const ver=Date.now()
await withDb(async(db)=>{ for(const r of ok){ await db.product.update({where:{id:r.id},data:{datasheetUrl:r.url+'?v='+ver}}) } })
console.log(`\nFiches générées & liées : ${ok.length}/${data.products.length}`)
