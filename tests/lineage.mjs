import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lineage,baseline,lineageHTML,formatParameters,formatContext,formatReleased} from '../dist/lineage.js';
import {facts} from '../dist/facts.js';
import {logScale,parameterChart,contextChart,parameterTicks,contextTicks,chartPalette} from '../dist/lineage-chart.js';
const root=new URL('../',import.meta.url);
const configs=JSON.parse(await readFile(new URL('tests/fixtures/lineage-configs.json',root),'utf8'));
const checks=[];
function check(name,fn){fn();checks.push(name);}

// Published counts only. A row may say nothing, but it may not say something unsourced.
const primaryHosts=['arxiv.org','huggingface.co','github.com'];
check('Every model cites at least one primary source and cites nothing else',()=>{
 assert.equal(new Set(lineage.map(m=>m.id)).size,lineage.length);
 for(const m of lineage){
  assert.ok(m.sources.length>=1,m.id);
  for(const s of m.sources){
   assert.ok(s.url.startsWith('https://'),m.id+' '+s.url);
   assert.ok(primaryHosts.includes(new URL(s.url).hostname.replace(/^www\./,'')),m.id+' '+s.url);
   assert.ok(s.label,m.id);
  }
 }
});

check('The 2017 base model is the single baseline, and rows run oldest to newest',()=>{
 assert.equal(lineage.filter(m=>m.baseline).length,1);
 assert.equal(baseline.id,'transformer');
 assert.equal(baseline,lineage[0]);
 assert.equal(baseline.params.total,65e6);
 assert.equal(baseline.sources[0].url,'https://arxiv.org/abs/1706.03762');
 const dates=lineage.map(m=>m.released);
 assert.deepEqual(dates,[...dates].sort());
 for(const m of lineage)assert.match(m.released,/^20\d\d-(0[1-9]|1[0-2])$/);
});

check('Layer, width, head, expert and context counts match the frozen official configurations',()=>{
 const covered=Object.keys(configs);
 assert.ok(covered.length>=13,'fixture coverage');
 for(const id of covered){
  const m=lineage.find(m=>m.id===id),c=configs[id];
  assert.ok(m,id);
  assert.equal(m.layers,c.num_hidden_layers??c.num_layers,id+' layers');
  assert.equal(m.hidden,c.hidden_size,id+' hidden');
  assert.equal(m.heads,c.num_attention_heads,id+' heads');
  assert.equal(m.context,c.max_position_embeddings??c.seq_length,id+' context');
  if(m.experts){
   assert.equal(m.experts.routed,c.n_routed_experts??c.num_experts,id+' routed');
   assert.equal(m.experts.shared,c.n_shared_experts??c.num_shared_experts,id+' shared');
   assert.equal(m.experts.active,c.num_experts_per_tok??c.num_experts_per_token,id+' active');
   assert.equal(m.experts.hidden,c.moe_intermediate_size,id+' expert width');
   // The prose column must repeat the same numbers it summarises.
   for(const n of [m.experts.routed,m.experts.shared,m.experts.active])assert.match(m.feedForward,new RegExp('\\b'+n+'\\b'),id+' '+n);
  }else assert.ok(!('n_routed_experts' in c)&&!('num_experts' in c),id+' has experts in its config');
 }
});

check('Dense models activate every parameter; sparse models activate a published subset',()=>{
 for(const m of lineage){
  if(!m.params)continue;
  if(m.params.active===null){assert.ok(m.params.note,m.id);continue;}
  assert.ok(m.params.active<=m.params.total,m.id);
  if(m.experts){
   assert.ok(m.params.active<m.params.total,m.id+' is sparse but activates everything');
   assert.ok(m.experts.active<m.experts.routed,m.id);
  }else assert.equal(m.params.active,m.params.total,m.id+' is dense but activates a subset');
 }
});

check('Unpublished figures are null, never a placeholder',()=>{
 const placeholder=/^(n\/?a|unknown|tbd|\?|-|—|)$/i;
 for(const m of lineage)for(const [key,value] of Object.entries(m)){
  if(value===null||typeof value!=='string')continue;
  assert.ok(!placeholder.test(value.trim()),`${m.id}.${key}`);
 }
 assert.equal(baseline.context,null,'the 2017 paper states no fixed context limit');
});

check('Kimi k1.5 is the only row whose architecture was never published',()=>{
 const silent=lineage.filter(m=>m.layers===null);
 assert.deepEqual(silent.map(m=>m.id),['kimi-k1.5']);
 const [k]=silent;
 assert.equal(k.params,null);
 assert.equal(k.attention,null);
 assert.equal(k.context,131072,'the report does state the context length it scales to');
 assert.deepEqual(k.sources.map(s=>s.url),['https://arxiv.org/abs/2501.12599']);
});

check('The V4.1 Flash row stays tied to the facts the 3D scene renders',()=>{
 const scene=lineage.filter(m=>m.scene);
 assert.deepEqual(scene.map(m=>m.id),['deepseek-v4.1-flash']);
 const [m]=scene,d=facts.deepseek;
 for(const [a,b] of [['layers','layers'],['hidden','hidden'],['heads','heads'],['context','context']])assert.equal(m[a],d[b],a);
 assert.deepEqual(m.experts,{routed:d.routedExperts,shared:d.sharedExperts,active:d.activeExperts,hidden:d.expertHidden});
 assert.equal(m.params.total,d.backboneParameters);
 assert.match(m.params.note,/196B Engram/);
});

check('Every requested family version is present',()=>{
 const ids=f=>lineage.filter(m=>m.family===f).map(m=>m.id);
 assert.deepEqual(ids('DeepSeek'),['deepseek-llm-67b','deepseek-v2','deepseek-v3','deepseek-v4-flash','deepseek-v4-pro','deepseek-v4.1-flash']);
 assert.deepEqual(ids('Kimi'),['kimi-k1.5','kimi-k2','kimi-k3']);
 assert.deepEqual(ids('GLM'),['glm-130b','chatglm2-6b','chatglm3-6b','glm-4-9b','glm-4.5','glm-5']);
 assert.deepEqual(ids('Transformer'),['transformer']);
 assert.deepEqual(lineage.filter(m=>m.departure===null).map(m=>m.id),['transformer'],'only the baseline departs from nothing');
 assert.equal(lineage.length,16);
});

check('Figures format as published, without inventing precision',()=>{
 assert.equal(formatParameters(65e6),'65M');
 assert.equal(formatParameters(67e9),'67B');
 assert.equal(formatParameters(1e12),'1T');
 assert.equal(formatParameters(1.6e12),'1.6T');
 assert.equal(formatParameters(2.8e12),'2.8T');
 assert.equal(formatParameters(null),null);
 assert.equal(formatContext(1048576),'1,048,576');
 assert.equal(formatContext(202752),'202,752');
 assert.equal(formatContext(null),null);
 assert.equal(formatReleased('2017-06'),'June 2017');
 assert.equal(formatReleased('2026-09'),'September 2026');
});

check('The rendered tables cover every model, every source and mark unstated cells',()=>{
 for(const m of lineage){
  assert.ok(lineageHTML.includes(m.name),m.id);
  if(m.departure)assert.ok(lineageHTML.includes(m.departure),m.id+' departure');
  for(const s of m.sources)assert.ok(lineageHTML.includes(s.url),m.id+' '+s.url);
 }
 assert.ok(lineageHTML.includes('class="unstated">—'),'unstated cells render as an em dash');
 assert.ok(lineageHTML.includes('2017 baseline')&&lineageHTML.includes('in the 3D scene'));
 assert.ok(lineageHTML.includes(baseline.sources[0].url),'the baseline paper is linked in the opening line');
 // Kimi k1.5 contributes the most blanks; the table must not quietly drop it.
 assert.ok(lineageHTML.includes('Kimi k1.5'));
 assert.ok(!/undefined|NaN|\[object/.test(lineageHTML));
});

check('The log scale is monotonic and pins its domain to the plot area',()=>{
 const scale=logScale(100,1e6,10,610);
 assert.equal(scale(100),10);
 assert.equal(scale(1e6),610);
 assert.equal(scale(1000).toFixed(1),'160.0');
 let previous=-Infinity;
 for(const v of [100,500,1000,50000,1e6]){const x=scale(v);assert.ok(x>previous,String(v));previous=x;}
});

check('Both charts draw a row for every model and never drop one for missing data',()=>{
 const marks=svg=>[...svg.matchAll(/<circle cx="([\d.]+)"/g)].map(m=>+m[1]);
 for(const [svg,ticks,plottable] of [
  [parameterChart(lineage,formatParameters),parameterTicks,lineage.filter(m=>m.params)],
  [contextChart(lineage,formatContext),contextTicks,lineage.filter(m=>m.context!==null)]]){
  for(const m of lineage)assert.ok(svg.includes('>'+m.name+'<'),m.id+' row label');
  const drawn=marks(svg);
  assert.ok(drawn.length>=plottable.length,'a mark per plottable model');
  // Nothing escapes the plot area, and every tick sits inside it too.
  const [,width]=svg.match(/viewBox="0 0 (\d+)/).map(Number);
  for(const x of drawn)assert.ok(x>=150&&x<=width,'mark inside the plot: '+x);
  for(const t of ticks)assert.ok(svg.includes('>'+t.label+'<'),'tick '+t.label);
 }
});

check('A model with no published figure gets a stated reason, not a mark',()=>{
 const parameters=parameterChart(lineage,formatParameters),context=contextChart(lineage,formatContext);
 assert.ok(parameters.includes('no architecture published'),'Kimi k1.5 says why it has no dumbbell');
 assert.ok(context.includes('no fixed limit stated in the paper'),'the 2017 row says why it has no dot');
 // A lone total dot would read as dense, so V4.1 states its prefill/decode figures.
 const v41=lineage.find(m=>m.id==='deepseek-v4.1-flash');
 assert.equal(v41.params.active,null);
 assert.ok(parameters.includes(v41.activeNote+' active'),'V4.1 states its published active figures');
});

check('Marks carry a hover label and extremes are direct-labelled once each',()=>{
 const parameters=parameterChart(lineage,formatParameters),context=contextChart(lineage,formatContext);
 for(const svg of [parameters,context]){
  const dots=(svg.match(/<circle /g)||[]).length,titles=(svg.match(/<title>/g)||[]).length;
  assert.equal(dots,titles,'every mark has a hover label');
 }
 const visible=(svg,text)=>(svg.match(new RegExp('font-size="11">'+text+'<','g'))||[]).length;
 assert.equal(visible(context,'1,048,576'),1,'four models share the 1M maximum; label it once');
 assert.equal(visible(context,'2,048'),1);
 assert.equal(visible(parameters,'2.8T'),1);
 assert.equal(visible(parameters,'65M'),1);
});

check('The chart palette is the one validated against this dialog surface',()=>{
 assert.equal(chartPalette.total,'#35a79b');
 assert.equal(chartPalette.active,'#bd8130');
 assert.notEqual(chartPalette.total,chartPalette.active);
});

console.log(checks.map(c=>'  ✓ '+c).join('\n'));
console.log(`Lineage: ${checks.length} checks over ${lineage.length} models passed.`);
