import {facts} from './facts.js';

// Every figure here is copied from a primary source: the model's own paper, its
// official configuration file, or its vendor model card. Nothing is inferred
// from secondary reporting. `null` means no primary source states the figure;
// the table prints those as an em dash rather than a guess. Layer, width, head
// and expert counts come from the configuration; parameter counts and context
// lengths come from the paper or the model card where the configuration does
// not carry them. Context is the architectural maximum, not a serving default.

const arxiv=id=>({label:'Paper',url:'https://arxiv.org/abs/'+id});
const hfConfig=repo=>({label:'Official config',url:`https://huggingface.co/${repo}/blob/main/config.json`});
const hfCard=repo=>({label:'Model card',url:'https://huggingface.co/'+repo});

export const lineage=[
 {id:'transformer',family:'Transformer',name:'Transformer (base)',released:'2017-06',baseline:true,
  params:{total:65e6,active:65e6},layers:12,layerNote:'6 encoder + 6 decoder',hidden:512,heads:8,
  attention:'Dense multi-head, 8 heads × 64',feedForward:'Dense, width 2,048',experts:null,
  context:null,contextNote:'No fixed limit stated in the paper',position:'Added sinusoids',norm:'Post-LayerNorm',activation:'ReLU',
  departure:null,
  sources:[arxiv('1706.03762')]},

 {id:'glm-130b',family:'GLM',name:'GLM-130B',released:'2022-10',
  params:{total:130e9,active:130e9},layers:70,hidden:12288,heads:96,
  attention:'Dense multi-head, 96 heads × 128',feedForward:'Dense GeGLU, width 32,768',experts:null,
  context:2048,position:'Rotary (RoPE)',norm:'DeepNorm, post-LN',activation:'GeGLU',
  departure:'Same dense block, scaled 2,000× and re-normed for stability at 130B.',
  sources:[arxiv('2210.02414'),{label:'Official config',url:'https://github.com/THUDM/GLM-130B/blob/main/configs/model_glm_130b.sh'}]},

 {id:'chatglm2-6b',family:'GLM',name:'ChatGLM2-6B',released:'2023-06',
  params:{total:6e9,active:6e9},layers:28,hidden:4096,heads:32,
  attention:'Multi-query, 32 heads / 2 KV groups',feedForward:'Dense SwiGLU, width 13,696',experts:null,
  context:32768,position:'Rotary (RoPE)',norm:'RMSNorm',activation:'SwiGLU',
  departure:'Shrinks the KV cache by giving 32 query heads only 2 KV groups.',
  sources:[arxiv('2406.12793'),hfConfig('zai-org/chatglm2-6b')]},

 {id:'chatglm3-6b',family:'GLM',name:'ChatGLM3-6B',released:'2023-10',
  params:{total:6e9,active:6e9},layers:28,hidden:4096,heads:32,
  attention:'Multi-query, 32 heads / 2 KV groups',feedForward:'Dense SwiGLU, width 13,696',experts:null,
  context:8192,position:'Rotary (RoPE)',norm:'RMSNorm',activation:'SwiGLU',
  departure:'Same block as ChatGLM2-6B; the published config differs only in length.',
  sources:[arxiv('2406.12793'),hfConfig('zai-org/chatglm3-6b')]},

 {id:'deepseek-llm-67b',family:'DeepSeek',name:'DeepSeek LLM 67B',released:'2024-01',
  params:{total:67e9,active:67e9},layers:95,hidden:8192,heads:64,
  attention:'Grouped-query, 64 heads / 8 KV groups',feedForward:'Dense SwiGLU, width 22,016',experts:null,
  context:4096,position:'Rotary (RoPE)',norm:'RMS pre-norm',activation:'SwiGLU',
  departure:'Still fully dense: every parameter runs for every token.',
  sources:[arxiv('2401.02954'),hfConfig('deepseek-ai/deepseek-llm-67b-base')]},

 {id:'deepseek-v2',family:'DeepSeek',name:'DeepSeek-V2',released:'2024-05',
  params:{total:236e9,active:21e9},layers:60,hidden:5120,heads:128,
  attention:'Multi-head latent (MLA), 128 heads, KV rank 512',feedForward:'MoE, 160 routed + 2 shared, 6 active, width 1,536',
  experts:{routed:160,shared:2,active:6,hidden:1536},
  context:163840,position:'Rotary + YaRN',norm:'RMS pre-norm',activation:'SwiGLU',
  departure:'Two departures at once: one latent KV per token, and a sparse expert FFN.',
  sources:[arxiv('2405.04434'),hfConfig('deepseek-ai/DeepSeek-V2')]},

 {id:'glm-4-9b',family:'GLM',name:'GLM-4-9B',released:'2024-06',
  params:{total:9e9,active:9e9},layers:40,hidden:4096,heads:32,
  attention:'Multi-query, 32 heads / 2 KV groups',feedForward:'Dense SwiGLU, width 13,696',experts:null,
  context:8192,position:'Rotary (RoPE)',norm:'RMSNorm',activation:'SwiGLU',
  departure:'Deeper than ChatGLM3 at the same width; still dense, still multi-query.',
  sources:[arxiv('2406.12793'),hfConfig('zai-org/glm-4-9b')]},

 {id:'deepseek-v3',family:'DeepSeek',name:'DeepSeek-V3',released:'2024-12',
  params:{total:671e9,active:37e9},layers:61,hidden:7168,heads:128,
  attention:'Multi-head latent (MLA), 128 heads, KV rank 512',feedForward:'MoE, 256 routed + 1 shared, 8 active, width 2,048',
  experts:{routed:256,shared:1,active:8,hidden:2048},
  context:163840,position:'Rotary + YaRN',norm:'RMS pre-norm',activation:'SwiGLU',
  departure:'Loss-free routing balance, FP8 weights and one multi-token-prediction head.',
  sources:[arxiv('2412.19437'),hfConfig('deepseek-ai/DeepSeek-V3')]},

 {id:'kimi-k1.5',family:'Kimi',name:'Kimi k1.5',released:'2025-01',
  params:null,layers:null,hidden:null,heads:null,
  attention:null,feedForward:null,experts:null,
  context:131072,position:null,norm:null,activation:null,
  departure:'A reinforcement-learning report: it publishes no architecture at all.',
  sources:[arxiv('2501.12599')]},

 {id:'kimi-k2',family:'Kimi',name:'Kimi K2',released:'2025-07',
  params:{total:1e12,active:32e9},layers:61,hidden:7168,heads:64,
  attention:'Multi-head latent (MLA), 64 heads, KV rank 512',feedForward:'MoE, 384 routed + 1 shared, 8 active, width 2,048',
  experts:{routed:384,shared:1,active:8,hidden:2048},
  context:131072,position:'Rotary + YaRN',norm:'RMS pre-norm',activation:'SwiGLU',
  departure:'DeepSeek-V3 proportions, halved head count, and 384 experts to reach 1T.',
  sources:[arxiv('2507.20534'),hfConfig('moonshotai/Kimi-K2-Instruct')]},

 {id:'glm-4.5',family:'GLM',name:'GLM-4.5',released:'2025-07',
  params:{total:355e9,active:32e9},layers:92,hidden:5120,heads:96,
  attention:'Grouped-query, 96 heads / 8 KV groups, QK-norm',feedForward:'MoE, 160 routed + 1 shared, 8 active, width 1,536',
  experts:{routed:160,shared:1,active:8,hidden:1536},
  context:131072,position:'Rotary, half-width',norm:'RMSNorm',activation:'SwiGLU',
  departure:'GLM goes sparse: 92 narrow layers instead of DeepSeek-style width.',
  sources:[arxiv('2508.06471'),hfConfig('zai-org/GLM-4.5')]},

 {id:'glm-5',family:'GLM',name:'GLM-5',released:'2026-02',
  params:{total:744e9,active:40e9},layers:78,hidden:6144,heads:64,
  attention:'MLA + sparse indexer, 32 index heads × 128, top-2,048',feedForward:'MoE, 256 routed + 1 shared, 8 active, width 2,048',
  experts:{routed:256,shared:1,active:8,hidden:2048},
  context:202752,position:'Rotary, interleaved',norm:'RMSNorm',activation:'SwiGLU',
  departure:'Swaps grouped-query for latent KV plus a learned index over the context.',
  sources:[arxiv('2602.15763'),hfCard('zai-org/GLM-5'),hfConfig('zai-org/GLM-5')]},

 {id:'deepseek-v4-flash',family:'DeepSeek',name:'DeepSeek-V4-Flash',released:'2026-04',
  params:{total:284e9,active:13e9},layers:43,hidden:4096,heads:64,
  attention:'Sparse indexed, 64 heads × 512, one KV head, top-512, window 128',
  feedForward:'MoE, 256 routed + 1 shared, 6 active, width 2,048 (FP4)',
  experts:{routed:256,shared:1,active:6,hidden:2048},
  context:1048576,position:'Rotary + YaRN',norm:'Hyper-connections, RMS pre-norm',activation:'Clamped SwiGLU',
  departure:'A single shared KV head and a learned index: attention stops reading everything.',
  sources:[hfCard('deepseek-ai/DeepSeek-V4-Flash'),hfConfig('deepseek-ai/DeepSeek-V4-Flash')]},

 {id:'deepseek-v4-pro',family:'DeepSeek',name:'DeepSeek-V4-Pro',released:'2026-04',
  params:{total:1.6e12,active:49e9},layers:61,hidden:7168,heads:128,
  attention:'Sparse indexed, 128 heads × 512, one KV head, top-1,024, window 128',
  feedForward:'MoE, 384 routed + 1 shared, 6 active, width 3,072 (FP4)',
  experts:{routed:384,shared:1,active:6,hidden:3072},
  context:1048576,position:'Rotary + YaRN',norm:'Hyper-connections, RMS pre-norm',activation:'Clamped SwiGLU',
  departure:'The same sparse attention at 1.6T, with 49B of it active per token.',
  sources:[hfCard('deepseek-ai/DeepSeek-V4-Pro'),hfConfig('deepseek-ai/DeepSeek-V4-Pro')]},

 {id:'kimi-k3',family:'Kimi',name:'Kimi K3',released:'2026-07',
  params:{total:2.8e12,active:104e9},layers:93,hidden:7168,heads:96,
  attention:'69 Kimi Delta Attention + 24 gated MLA layers, 96 heads',
  feedForward:'MoE, 896 routed + 2 shared, 16 active, width 3,072',
  experts:{routed:896,shared:2,active:16,hidden:3072},
  context:1048576,position:'Rotary (RoPE)',norm:'RMSNorm, attention residuals',activation:'SiTU-GLU',
  departure:'Most layers drop softmax attention entirely for a linear recurrence.',
  sources:[hfCard('moonshotai/Kimi-K3'),hfConfig('moonshotai/Kimi-K3')]},

 {id:'deepseek-v4.1-flash',family:'DeepSeek',name:'DeepSeek-V4.1-Flash',released:'2026-09',scene:true,
  params:{total:facts.deepseek.backboneParameters,active:null,
   note:'552B backbone plus 196B Engram; 8B active in prefill, 16B in decode'},
  layers:facts.deepseek.layers,layerNote:`${facts.deepseek.encoder} encoder + ${facts.deepseek.decoder} decoder`,
  hidden:facts.deepseek.hidden,heads:facts.deepseek.heads,
  attention:`Sparse indexed, ${facts.deepseek.heads} heads × ${facts.deepseek.headDim}, top-${facts.deepseek.topk}, window ${facts.deepseek.window}`,
  feedForward:`MoE, ${facts.deepseek.routedExperts} routed + ${facts.deepseek.sharedExperts} shared, ${facts.deepseek.activeExperts} active, width ${facts.deepseek.expertHidden.toLocaleString('en-US')}`,
  experts:{routed:facts.deepseek.routedExperts,shared:facts.deepseek.sharedExperts,active:facts.deepseek.activeExperts,hidden:facts.deepseek.expertHidden},
  context:facts.deepseek.context,position:'Rotary + YaRN',norm:`Single-Pass mHC, ${facts.deepseek.residualStreams} streams`,activation:'Clamped SwiGLU',
  departure:'Reuses one layer’s global KV across five more, and adds an addressable memory.',
  sources:[{label:'Technical report',url:facts.sources.report},{label:'Official config',url:facts.sources.config}]},
];

export const baseline=lineage.find(m=>m.baseline);

export function formatParameters(n){
 if(n===null||n===undefined)return null;
 if(n>=1e12)return +(n/1e12).toFixed(1)+'T';
 if(n>=1e9)return Math.round(n/1e9)+'B';
 return Math.round(n/1e6)+'M';
}

export function formatReleased(released){
 const [year,month]=released.split('-');
 return ['January','February','March','April','May','June','July','August','September','October','November','December'][+month-1]+' '+year;
}

// Exact token counts, so no rounding convention is implied.
export const formatContext=n=>n===null?null:n.toLocaleString('en-US');

const cell=v=>v===null||v===undefined?'<td class="unstated">—</td>':'<td>'+v+'</td>';
const name=m=>`<th scope="row">${m.name}${m.baseline?' <span class="tag">2017 baseline</span>':''}${m.scene?' <span class="tag">in the 3D scene</span>':''}</th>`;

const scaleRow=m=>`<tr${m.baseline?' class="baseline"':''}>${name(m)}${cell(formatReleased(m.released))}${cell(m.params&&formatParameters(m.params.total))}${cell(m.params&&formatParameters(m.params.active))}${cell(m.layers&&(m.layerNote?`${m.layers} <small>(${m.layerNote})</small>`:m.layers))}${cell(m.hidden&&m.hidden.toLocaleString('en-US'))}${cell(formatContext(m.context))}</tr>`;

const mechanismRow=m=>`<tr${m.baseline?' class="baseline"':''}>${name(m)}${cell(m.attention)}${cell(m.feedForward)}${cell(m.position)}${cell(m.norm)}</tr>`;

const sourceItem=m=>`<li><strong>${m.name}</strong> ${m.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener">${s.label} ↗</a>`).join(' · ')}</li>`;

export const lineageHTML=`<p>Sixteen published architectures, oldest first, each read against <a href="${baseline.sources[0].url}" target="_blank" rel="noopener">Attention Is All You Need ↗</a>. Every figure is copied from a primary source — the model's own paper, its official configuration file, or its vendor model card. An em dash means no primary source states that figure; nothing here is filled in from secondary reporting.</p>
<h3>Scale</h3><div class="lineage-scroll"><table><thead><tr><th scope="col">Model</th><th scope="col">Released</th><th scope="col">Total</th><th scope="col">Active</th><th scope="col">Layers</th><th scope="col">Width</th><th scope="col">Context</th></tr></thead><tbody>${lineage.map(scaleRow).join('')}</tbody></table></div>
<p style="margin-top:12px">Active parameters are those that run for a single token. For the dense models the two columns are equal, which is the whole point of the comparison: the 2017 block spends every parameter on every token, and so does everything up to DeepSeek-V2. Context is the architectural maximum in the configuration, not a serving default; the 2017 paper states no fixed limit.</p>
<h3>Mechanism</h3><div class="lineage-scroll"><table><thead><tr><th scope="col">Model</th><th scope="col">Attention</th><th scope="col">Feed-forward</th><th scope="col">Position</th><th scope="col">Normalisation</th></tr></thead><tbody>${lineage.map(mechanismRow).join('')}</tbody></table></div>
<h3>What each one changed</h3><table><tbody>${lineage.filter(m=>!m.baseline).map(m=>`<tr><th scope="row">${m.name}</th><td>${m.departure}</td></tr>`).join('')}</tbody></table>
<h3>Reading this honestly</h3><p>Four things this table is not. It is not a benchmark: no row here is evidence that one model answers better than another. It is not a cost comparison; active parameters are not FLOPs, and quantisation, routing overhead and serving stack all move the real number. It is not complete — attention and feed-forward are summarised in one line each, and training data, objectives, tokenizers and post-training are omitted entirely. And the families are not strictly comparable: Kimi k1.5 publishes no architecture, so most of its row is blank, while the DeepSeek and GLM rows are drawn from full configuration files.</p><p style="margin-top:12px">Where a paper and its own configuration file disagree, the table follows the configuration: GLM-5's report counts 80 layers, its published config 78. Parameter counts are as published; vendors count embedding and multi-token-prediction weights differently, so totals across families carry some slack. The 3D scene shows only the 2017 base model and DeepSeek-V4.1-Flash; the other fourteen rows are data, not geometry.</p>
<h3>Sources</h3><ul class="lineage-sources">${lineage.map(sourceItem).join('')}</ul>`;
