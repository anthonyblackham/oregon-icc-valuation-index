// Oregon ICC Valuation Index. Data: data/sections.geojson, data/interurban.geojson, data/oregon.geojson (built by build_data.py)
(async function(){
const get=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u+" "+r.status);return r.json()});
const [DATA,IU,OREGON]=await Promise.all([get("data/sections.geojson"),get("data/interurban.geojson"),get("data/oregon.geojson")]);


const TOWNS=[["Portland",-122.68,45.52],["Salem",-123.03,44.94],["Eugene",-123.09,44.05],["Medford",-122.87,42.33],["Klamath Falls",-121.78,42.22],["Bend",-121.31,44.06],["The Dalles",-121.18,45.6],["Pendleton",-118.79,45.67],["La Grande",-118.09,45.32],["Baker",-117.83,44.78],["Ontario",-116.96,44.03],["Coos Bay",-124.22,43.37],["Roseburg",-123.34,43.22],["Astoria",-123.83,46.19],["Albany",-123.1,44.64]];
const tag=p=>p.section_tag||"";
const FCOL={"Southern Pacific Company":"#2f6cab","Oregon Washington":"#a8322a","Oregon Trunk":"#2d7a4f","Spokane Portland and Seattle":"#d07020","Northern Pacific":"#7a4fa0","Northern Pacific Terminal Company of Oregon":"#b06db8","Portland Traction (manual addition)":"#2a8a96","No bundle found":"#8f877b"};
const fcol=f=>FCOL[f]||"#8a8530";
const F=DATA.features;F.forEach(f=>{const p=f.properties;p.drawn=!!f.geometry});
const label=p=>p.line||[p.from_terminus,p.to_terminus].filter(Boolean).join(" – ");
const code=p=>[p.operator_as_printed,p.valuation].filter(Boolean).join(" ")||"(unnumbered)";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const byFiled=d3.group(F,f=>f.properties.filed_under);
const LAST=["Portland Traction (manual addition)","No bundle found"];
const FILED=[...byFiled.keys()].sort((a,b)=>(LAST.indexOf(a)-LAST.indexOf(b))||(byFiled.get(b).length-byFiled.get(a).length)||a.localeCompare(b));
const pf=p=>(p.section_tag||"").split(/[- ]/)[0];
const vsort=(a,b)=>pf(a).localeCompare(pf(b))||(a.valuation||"zz").localeCompare(b.valuation||"zz",undefined,{numeric:true});
let selected=null,openId=null;
const syncInfo=()=>document.querySelectorAll("tr.r").forEach(r=>r.querySelector(".info").setAttribute("aria-expanded",+r.dataset.id===openId));

const sel=document.getElementById("filed");
FILED.forEach(f=>{const o=document.createElement("option");o.value=f;o.textContent=`${f} (${byFiled.get(f).length})`;sel.appendChild(o)});
function visible(p){const fv=sel.value,q=document.getElementById("q").value.trim().toLowerCase();
  if(fv&&p.filed_under!==fv)return false;
  if(q){const hay=[tag(p),p.valuation,p.line,p.operator,p.operator_as_printed,p.from_terminus,p.to_terminus,p.nara_bundle,p.filed_under].join(" ").toLowerCase();if(!hay.includes(q))return false}
  return true}

function rows(){const tb=document.getElementById("rows");tb.innerHTML="";let n=0;
  FILED.forEach(fd=>{const items=byFiled.get(fd).map(f=>f.properties).filter(visible).sort(vsort);if(!items.length)return;n+=items.length;
    const g=document.createElement("tr");g.className="g";g.style.setProperty("--gc",fcol(fd));g.innerHTML=`<td colspan="5">${esc(fd)}<span>${items.length}</span></td>`;tb.appendChild(g);
    items.forEach(p=>{const r=document.createElement("tr");r.className="r"+(p.id===selected?" on":"");r.dataset.id=p.id;r.tabIndex=0;r.style.setProperty("--gc",fcol(fd));
      r.innerHTML=`<td><span class="tag">${esc(tag(p)||"—")}</span></td><td class="nm">${label(p)?esc(label(p)):'<span style="color:var(--muted)">termini not recorded</span>'}${p.drawn?"":'<span class="nd">not drawn</span>'}</td>`+
        (p.nara_bundle?`<td class="n code">${esc(p.nara_bundle)}</td><td class="n code">${esc(p.nara_vs||"—")}</td>`:`<td class="n none">—</td><td class="n none">—</td>`)+`<td class="i"><button class="info" aria-label="More about ${esc(tag(p))}" aria-expanded="${p.id===openId}">i</button></td>`;
      r.querySelector(".info").onclick=e=>{e.stopPropagation();openId=openId===p.id?null:p.id;if(selected!==p.id)select(p.id);else{card(openId!=null?F.find(x=>x.properties.id===openId):null);syncInfo()}};
      r.onclick=()=>select(p.id);r.onkeydown=e=>{if(e.key==="Enter")select(p.id)};
      r.onmouseenter=()=>gLn.selectAll("path").classed("hl",d=>d.properties.id===p.id);r.onmouseleave=()=>gLn.selectAll("path").classed("hl",false);
      tb.appendChild(r)})});
  document.getElementById("count").textContent=`${n} of ${F.length} sections`;
  if(openId!=null)card(F.find(x=>x.properties.id===openId));}

const svg=d3.select("#map"),g=svg.append("g");
const gLand=g.append("g"),gTown=g.append("g"),gIU=g.append("g"),gCas=g.append("g"),gLn=g.append("g"),gHit=g.append("g"),gLab=g.append("g");
let W,H,proj,path;
function draw(){const r=svg.node().getBoundingClientRect();W=r.width;H=r.height;
  proj=d3.geoConicConformal().parallels([43,45.5]).rotate([120.5,0]).fitExtent([[24,24],[W-24,H-24]],OREGON);path=d3.geoPath(proj);
  gLand.selectAll("*").remove();
  gLand.append("path").attr("class","grat").attr("d",path(d3.geoGraticule().step([1,1]).extent([[-125,41.5],[-116,46.5]])()));
  gLand.append("path").attr("class","land").attr("d",path(OREGON));
  gTown.selectAll("*").remove();
  TOWNS.forEach(([n,x,y])=>{const[px,py]=proj([x,y]);const t=gTown.append("g").attr("class","townp").attr("data-x",px).attr("data-y",py);t.append("circle").attr("r",2).attr("fill","var(--landedge)");t.append("text").attr("class","town").attr("x",4).attr("y",-4).text(n)});
  gIU.selectAll("*").remove();
  IU.features.forEach(f=>{const d=path(f);gIU.append("path").attr("class","iu-cas").attr("d",d);gIU.append("path").attr("class","iu").attr("d",d);
    gIU.append("path").attr("class","hit").attr("d",d).on("mouseenter",e=>iuTip(f,e)).on("mousemove",e=>iuTip(f,e)).on("mouseleave",()=>{tip.hidden=true});
    const c=f.geometry.coordinates,m=proj(c[Math.floor(c.length/2)]);const t=gIU.append("g").attr("class","iu-lab").attr("data-x",m[0]).attr("data-y",m[1]);const nm=f.properties.name.split(", ");t.append("text").text(/Branch/.test(nm[1]||"")?nm[1]:nm[0])});
  gIU.style("display",document.getElementById("iu").checked?null:"none");
  const drawn=F.filter(f=>f.geometry);
  gCas.selectAll("path").data(drawn,f=>f.properties.id).join("path").attr("class","cas").attr("d",path);
  gLn.selectAll("path").data(drawn,f=>f.properties.id).join("path").attr("class",f=>"ln"+(f.properties.geometry_unmatched?" unm":"")).attr("d",path).attr("stroke",f=>fcol(f.properties.filed_under));
  gHit.selectAll("path").data(drawn,f=>f.properties.id).join("path").attr("class","hit").attr("d",path)
    .on("mouseenter",(e,f)=>hover(f,e)).on("mousemove",(e,f)=>hover(f,e)).on("mouseleave",()=>hover(null)).on("click",(e,f)=>select(f.properties.id));
  const labs=gLab.selectAll("g.lab").data(drawn.filter(f=>tag(f.properties)&&f.properties.valuation),f=>f.properties.id).join(e=>{const x=e.append("g").attr("class","lab");x.append("rect");x.append("text");return x});
  labs.each(function(f){const pt=midpoint(f);this.dataset.x=pt[0];this.dataset.y=pt[1];const t=this.querySelector("text");t.textContent=tag(f.properties);const w=t.getComputedTextLength()+10;
    d3.select(this).select("rect").attr("x",-w/2).attr("y",-8).attr("width",w).attr("height",16).attr("rx",8).attr("stroke",fcol(f.properties.filed_under))}).on("click",(e,f)=>select(f.properties.id));
  restyle();applyZoom(d3.zoomTransform(svg.node()));}
function midpoint(f){const c=path.centroid(f);let best=null,bd=1e18;const cs=f.geometry.type==="LineString"?[f.geometry.coordinates]:f.geometry.coordinates;cs.forEach(l=>{const m=proj(l[Math.floor(l.length/2)]);const d=(m[0]-c[0])**2+(m[1]-c[1])**2;if(d<bd){bd=d;best=m}});return best}
function restyle(){const vis=f=>visible(f.properties)?null:"none";
  gLn.selectAll("path").classed("sel",f=>f.properties.id===selected).style("display",vis);gCas.selectAll("path").style("display",vis);gHit.selectAll("path").style("display",vis);
  gLab.selectAll("g.lab").classed("on",f=>f.properties.id===selected).style("display",vis);cull()}
function applyZoom(t){g.attr("transform",t);
  gTown.selectAll("g.townp").attr("transform",function(){return `translate(${this.dataset.x},${this.dataset.y}) scale(${1/t.k})`});
  gLab.selectAll("g.lab").attr("transform",function(){return `translate(${this.dataset.x},${this.dataset.y}) scale(${1/t.k})`});
  gLand.select(".grat").attr("stroke-width",.6/t.k);
  gIU.selectAll("g.iu-lab").attr("transform",function(){return `translate(${this.dataset.x},${this.dataset.y}) scale(${1/t.k})`})}
let cullT;function cull(){clearTimeout(cullT);cullT=setTimeout(()=>{const placed=[];const nodes=gLab.selectAll("g.lab").nodes().filter(n=>n.style.display!=="none");
  nodes.sort((a,b)=>(d3.select(b).datum().properties.id===selected)-(d3.select(a).datum().properties.id===selected));
  nodes.forEach(n=>{n.classList.remove("cull");const r=n.getBoundingClientRect();if(placed.some(q=>r.left<q.right+2&&r.right>q.left-2&&r.top<q.bottom+1&&r.bottom>q.top-1))n.classList.add("cull");else placed.push(r)})},60)}
const zoom=d3.zoom().scaleExtent([1,40]).on("zoom",e=>{applyZoom(e.transform);cull()});
svg.call(zoom);
d3.select("#zi").on("click",()=>svg.transition().duration(250).call(zoom.scaleBy,2));
d3.select("#zo").on("click",()=>svg.transition().duration(250).call(zoom.scaleBy,.5));
d3.select("#zr").on("click",()=>svg.transition().duration(350).call(zoom.transform,d3.zoomIdentity));
const tip=document.getElementById("tip");
function iuTip(f,e){const r=svg.node().getBoundingClientRect();tip.hidden=false;tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px";tip.textContent=`${f.properties.name} · ${f.properties.operator}${f.properties.note?" · "+f.properties.note:""}`}
function hover(f,e){gLn.selectAll("path").classed("hl",d=>f&&d===f);if(!f){tip.hidden=true;return}
  const r=svg.node().getBoundingClientRect();tip.hidden=false;tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px";
  tip.textContent=`${tag(f.properties)} · ${label(f.properties)}${f.properties.nara_bundle?` · Bundle ${f.properties.nara_bundle}`:""}`}

function select(id,fly=true){if(id===selected&&fly){selected=null;openId=null;card(null);syncInfo();restyle();document.querySelectorAll("tr.r.on").forEach(r=>r.classList.remove("on"));return}
  selected=id;const f=F.find(x=>x.properties.id===id);restyle();
  document.querySelectorAll("tr.r").forEach(r=>r.classList.toggle("on",+r.dataset.id===id));if(openId!==id)openId=null;card(openId===id?f:null);syncInfo();
  const row=document.querySelector(`tr.r[data-id="${id}"]`);row&&(row.nextElementSibling||row).scrollIntoView({block:"nearest"});row&&row.scrollIntoView({block:"nearest"});
  if(fly&&f&&f.geometry){const[[x0,y0],[x1,y1]]=path.bounds(f);const t=d3.zoomTransform(svg.node());
    const sx0=t.applyX(x0),sx1=t.applyX(x1),sy0=t.applyY(y0),sy1=t.applyY(y1);
    if(sx0<0||sy0<0||sx1>W||sy1>H||(sx1-sx0)<24&&(sy1-sy0)<24){const k=Math.max(1,Math.min(12,.5/Math.max((x1-x0)/W,(y1-y0)/H,.002)));
      svg.transition().duration(500).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2))}}}
function card(f){document.querySelectorAll("tr.det").forEach(r=>r.remove());if(!f)return;
  const p=f.properties,row=document.querySelector(`tr.r[data-id="${p.id}"]`);if(!row)return;
  const rr=p.nara_rrname?p.nara_rrname+(p.nara_otherrr?` (${p.nara_otherrr})`:""):p.operator;
  const vs=p.nara_vs||p.valuation||"",st=p.nara_state||"OR";
  const slip=`NARA II College Park, Cartographic. RG 134 valuation maps\nRailroad: ${rr}\nValuation section: ${vs}\nState: ${st}\nNARA bundle: ${p.nara_bundle||""}`;
  const approx=!p.drawn?"Not drawn on the map; extent could not be placed.":p.geometry_unmatched?"Drawn as a straight line; no track found to follow.":["low","medium","none"].includes(p.extent_confidence)?`Extent is approximate (${p.extent_confidence} confidence).`:"";
  const lines=[`Printed as <b>${esc(code(p))}</b>. ${p.nara_bundle?`NARA: ${esc(rr)}, ${esc(st)}.`:p.manual_addition?"Valued later; no original-series bundle.":"No original-series bundle found; ask NARA Cartographic."}`];
  if(p.successor)lines.push(esc(p.successor[0].toUpperCase()+p.successor.slice(1))+".");
  if(approx)lines.push(`<span class="warn">${esc(approx)}</span>`);
  const notes=[p.uncertainty_notes,p.ref_1964_sp_index?`1964 SP index: ${p.ref_1964_sp_index}.`:""].filter(Boolean);
  const d=document.createElement("tr");d.className="det";d.style.setProperty("--gc",row.style.getPropertyValue("--gc"));
  d.innerHTML=`<td colspan="5"><div class="det-in">${lines.map(l=>`<p>${l}</p>`).join("")}
    <div class="det-a">${p.nara_bundle?'<button class="copy">Copy pull-slip details</button>':""}${notes.length?`<details><summary>Notes</summary>${notes.map(n=>`<p>${esc(n)}</p>`).join("")}</details>`:""}</div></div></td>`;
  row.after(d);
  const cp=d.querySelector(".copy");if(cp)cp.onclick=e=>{e.stopPropagation();try{navigator.clipboard.writeText(slip).then(()=>{cp.textContent="Copied";setTimeout(()=>cp.textContent="Copy pull-slip details",1500)},()=>{cp.textContent="Copy failed"})}catch(err){cp.textContent="Copy failed"}};
}
sel.onchange=()=>{rows();restyle();svg.transition().duration(350).call(zoom.transform,d3.zoomIdentity)};
document.getElementById("iu").onchange=e=>{gIU.style("display",e.target.checked?null:"none");document.getElementById("kIU").hidden=!e.target.checked};
document.getElementById("q").oninput=()=>{rows();restyle()};
window.addEventListener("resize",()=>{svg.call(zoom.transform,d3.zoomIdentity);draw()});

rows();requestAnimationFrame(()=>{draw();select(F.find(f=>f.properties.valuation==="1"&&f.properties.operator.startsWith("Oregon &")).properties.id,false)});

})().catch(e=>{document.getElementById("rows").innerHTML=`<tr><td colspan="5" style="padding:16px;color:var(--bad)">Could not load the map data (${e.message}).</td></tr>`});
document.getElementById("aboutB").onclick=()=>document.getElementById("about").showModal();
