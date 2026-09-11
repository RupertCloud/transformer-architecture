// Dot and dumbbell plots over the lineage data. Position-encoded on a log axis,
// so no mark implies a length measured from zero. Every value drawn here is the
// same published figure the tables print; a model with no published figure gets
// a stated reason in the plot area, never a dropped row or an invented mark.

// Validated for this dialog surface (#101f2d, dark): lightness band, chroma
// floor, CVD separation, normal-vision floor and contrast all pass.
export const chartPalette={total:'#35a79b',active:'#bd8130',grid:'#263748',axis:'#8fa5b6',ink:'#c8dbe8',absent:'#5f7a8c'};

const LABEL_WIDTH=152, PLOT_RIGHT=620, ROW=21, AXIS=28, WIDTH=720;

const escape=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// A log scale, because the data spans 65M to 2.8T and 2K to 1M.
export function logScale(min,max,left=LABEL_WIDTH+6,right=PLOT_RIGHT){
 const lo=Math.log10(min),span=Math.log10(max)-lo;
 return value=>left+(Math.log10(value)-lo)/span*(right-left);
}

export const parameterTicks=[{v:1e8,label:'100M'},{v:1e9,label:'1B'},{v:1e10,label:'10B'},{v:1e11,label:'100B'},{v:1e12,label:'1T'}];
export const contextTicks=[{v:2048,label:'2K'},{v:16384,label:'16K'},{v:131072,label:'128K'},{v:1048576,label:'1M'}];

function frame(title,description,rows,ticks,scale,body,legend=''){
 const height=AXIS+rows*ROW+10;
 const grid=ticks.map(t=>{const x=scale(t.v).toFixed(1);
  return `<line x1="${x}" y1="${AXIS-8}" x2="${x}" y2="${height-8}" stroke="${chartPalette.grid}"/><text x="${x}" y="${AXIS-14}" text-anchor="middle" fill="${chartPalette.axis}" font-size="11">${t.label}</text>`}).join('');
 return `<figure class="lineage-figure"><figcaption>${escape(title)}</figcaption>${legend}
<svg viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${escape(description)}" preserveAspectRatio="xMidYMid meet"><desc>${escape(description)}</desc>${grid}${body}</svg></figure>`;
}

const rowLabel=(m,y)=>`<text x="${LABEL_WIDTH}" y="${y+4}" text-anchor="end" fill="${chartPalette.ink}" font-size="12">${escape(m.name)}</text>`;
const absent=(x,y,text)=>`<text x="${x}" y="${y+4}" fill="${chartPalette.absent}" font-size="11" font-style="italic">${escape(text)}</text>`;
const dot=(x,y,fill,label)=>`<circle cx="${x.toFixed(1)}" cy="${y}" r="4.5" fill="${fill}" stroke="#101f2d" stroke-width="2"><title>${escape(label)}</title></circle>`;

export function parameterChart(lineage,formatParameters){
 const plotted=lineage.filter(m=>m.params);
 const scale=logScale(6e7,8e12);
 const biggest=Math.max(...plotted.map(m=>m.params.total));
 const body=lineage.map((m,i)=>{
  const y=AXIS+i*ROW+ROW/2, parts=[rowLabel(m,y)];
  if(!m.params)parts.push(absent(scale(6e7),y,'no architecture published'));
  else{
   const total=scale(m.params.total);
   if(m.params.active!==null){
    const active=scale(m.params.active);
    parts.push(`<line x1="${active.toFixed(1)}" y1="${y}" x2="${total.toFixed(1)}" y2="${y}" stroke="${chartPalette.grid}" stroke-width="2"/>`);
    parts.push(dot(active,y,chartPalette.active,`${m.name}: ${formatParameters(m.params.active)} active per token`));
   }
   parts.push(dot(total,y,chartPalette.total,`${m.name}: ${formatParameters(m.params.total)} total`));
   // Drawing one lone dot would read as "dense"; say the published figures instead.
   if(m.params.active===null&&m.activeNote)parts.push(`<text x="${(total+10).toFixed(1)}" y="${y+4}" fill="${chartPalette.absent}" font-size="11">${escape(m.activeNote+' active')}</text>`);
   // Direct-label only the extremes; the table above carries every other number.
   if(m.baseline||m.params.total===biggest)parts.push(`<text x="${(total+10).toFixed(1)}" y="${y+4}" fill="${chartPalette.axis}" font-size="11">${escape(formatParameters(m.params.total))}</text>`);
  }
  return parts.join('');
 }).join('');
 const legend=`<p class="lineage-legend"><span><i style="background:${chartPalette.active}"></i>Active per token</span><span><i style="background:${chartPalette.total}"></i>Total parameters</span></p>`;
 return frame('Total parameters against the parameters that run for one token',
  'Dumbbell plot, one row per model, oldest at the top, on a logarithmic parameter axis. Dense models show a single dot because total and active are the same number. From DeepSeek-V2 onward the two dots separate, and the gap is the mixture-of-experts sparsity.',
  lineage.length,parameterTicks,scale,body,legend);
}

export function contextChart(lineage,formatContext){
 const scale=logScale(1800,4e6);
 const plotted=lineage.filter(m=>m.context!==null);
 // Label the shortest and the longest once each; four rows share the 1M maximum.
 const longest=Math.max(...plotted.map(m=>m.context)),shortest=Math.min(...plotted.map(m=>m.context));
 const labelled=new Set();
 const body=lineage.map((m,i)=>{
  const y=AXIS+i*ROW+ROW/2, parts=[rowLabel(m,y)];
  if(m.context===null)parts.push(absent(scale(1800),y,'no fixed limit stated in the paper'));
  else{
   const x=scale(m.context);
   parts.push(dot(x,y,chartPalette.total,`${m.name}: ${formatContext(m.context)} tokens`));
   if((m.context===longest||m.context===shortest)&&!labelled.has(m.context)&&labelled.add(m.context))parts.push(`<text x="${(x+10).toFixed(1)}" y="${y+4}" fill="${chartPalette.axis}" font-size="11">${escape(formatContext(m.context))}</text>`);
  }
  return parts.join('');
 }).join('');
 return frame('Context window, in tokens',
  'Dot plot, one row per model, oldest at the top, on a logarithmic token axis. The published maximum runs from 2,048 tokens in GLM-130B to 1,048,576 in the 2026 models.',
  lineage.length,contextTicks,scale,body);
}
