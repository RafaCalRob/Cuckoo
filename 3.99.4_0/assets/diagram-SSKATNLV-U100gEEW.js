import{p as _}from"./chunk-4BMEZGHF-KieXOWV_.js";import{C as D,_ as l,s as S,g as k,n as E,o as R,b as F,c as G,l as P,D as $,E as b,t as z,H,K as V}from"./MermaidPreview-CX3oxt-0.js";import{p as W}from"./radar-MK3ICKWK-B57vnsek.js";import"./premium-CHh0JHCP.js";import"./user-config-B2p-VbRf.js";import"./merge-CpUPYoWF.js";import"./map-ByswxN6x.js";import"./_baseUniq-Cpwc2P36.js";import"./uniqBy-Cgm_lAH2.js";import"./min-DsEQ3uiE.js";import"./reduce-BLoHwvCR.js";import"./clone-DYru4j1C.js";(function(){try{var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},t=new e.Error().stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="27737179-8998-4aea-813e-d8817b5c7b16",e._sentryDebugIdIdentifier="sentry-dbid-27737179-8998-4aea-813e-d8817b5c7b16")}catch{}})();var h={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},w={axes:[],curves:[],options:h},m=structuredClone(w),B=D.radar,j=l(()=>$({...B,...b().radar}),"getConfig"),C=l(()=>m.axes,"getAxes"),K=l(()=>m.curves,"getCurves"),N=l(()=>m.options,"getOptions"),U=l(e=>{m.axes=e.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),X=l(e=>{m.curves=e.map(t=>({name:t.name,label:t.label??t.name,entries:Y(t.entries)}))},"setCurves"),Y=l(e=>{if(e[0].axis==null)return e.map(a=>a.value);const t=C();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(a=>{const r=e.find(n=>{var o;return((o=n.axis)==null?void 0:o.$refText)===a.name});if(r===void 0)throw new Error("Missing entry for axis "+a.label);return r.value})},"computeCurveEntries"),Z=l(e=>{var a,r,n,o,i;const t=e.reduce((s,c)=>(s[c.name]=c,s),{});m.options={showLegend:((a=t.showLegend)==null?void 0:a.value)??h.showLegend,ticks:((r=t.ticks)==null?void 0:r.value)??h.ticks,max:((n=t.max)==null?void 0:n.value)??h.max,min:((o=t.min)==null?void 0:o.value)??h.min,graticule:((i=t.graticule)==null?void 0:i.value)??h.graticule}},"setOptions"),q=l(()=>{z(),m=structuredClone(w)},"clear"),f={getAxes:C,getCurves:K,getOptions:N,setAxes:U,setCurves:X,setOptions:Z,getConfig:j,clear:q,setAccTitle:S,getAccTitle:k,setDiagramTitle:E,getDiagramTitle:R,getAccDescription:F,setAccDescription:G},J=l(e=>{_(e,f);const{axes:t,curves:a,options:r}=e;f.setAxes(t),f.setCurves(a),f.setOptions(r)},"populate"),Q={parse:l(async e=>{const t=await W("radar",e);P.debug(t),J(t)},"parse")},tt=l((e,t,a,r)=>{const n=r.db,o=n.getAxes(),i=n.getCurves(),s=n.getOptions(),c=n.getConfig(),d=n.getDiagramTitle(),u=H(t),p=et(u,c),g=s.max??Math.max(...i.map(y=>Math.max(...y.entries))),x=s.min,v=Math.min(c.width,c.height)/2;at(p,o,v,s.ticks,s.graticule),rt(p,o,v,c),M(p,o,i,x,g,s.graticule,c),T(p,i,s.showLegend,c),p.append("text").attr("class","radarTitle").text(d).attr("x",0).attr("y",-c.height/2-c.marginTop)},"draw"),et=l((e,t)=>{const a=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,n={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return e.attr("viewbox",`0 0 ${a} ${r}`).attr("width",a).attr("height",r),e.append("g").attr("transform",`translate(${n.x}, ${n.y})`)},"drawFrame"),at=l((e,t,a,r,n)=>{if(n==="circle")for(let o=0;o<r;o++){const i=a*(o+1)/r;e.append("circle").attr("r",i).attr("class","radarGraticule")}else if(n==="polygon"){const o=t.length;for(let i=0;i<r;i++){const s=a*(i+1)/r,c=t.map((d,u)=>{const p=2*u*Math.PI/o-Math.PI/2,g=s*Math.cos(p),x=s*Math.sin(p);return`${g},${x}`}).join(" ");e.append("polygon").attr("points",c).attr("class","radarGraticule")}}},"drawGraticule"),rt=l((e,t,a,r)=>{const n=t.length;for(let o=0;o<n;o++){const i=t[o].label,s=2*o*Math.PI/n-Math.PI/2;e.append("line").attr("x1",0).attr("y1",0).attr("x2",a*r.axisScaleFactor*Math.cos(s)).attr("y2",a*r.axisScaleFactor*Math.sin(s)).attr("class","radarAxisLine"),e.append("text").text(i).attr("x",a*r.axisLabelFactor*Math.cos(s)).attr("y",a*r.axisLabelFactor*Math.sin(s)).attr("class","radarAxisLabel")}},"drawAxes");function M(e,t,a,r,n,o,i){const s=t.length,c=Math.min(i.width,i.height)/2;a.forEach((d,u)=>{if(d.entries.length!==s)return;const p=d.entries.map((g,x)=>{const v=2*Math.PI*x/s-Math.PI/2,y=A(g,r,n,c),I=y*Math.cos(v),O=y*Math.sin(v);return{x:I,y:O}});o==="circle"?e.append("path").attr("d",L(p,i.curveTension)).attr("class",`radarCurve-${u}`):o==="polygon"&&e.append("polygon").attr("points",p.map(g=>`${g.x},${g.y}`).join(" ")).attr("class",`radarCurve-${u}`)})}l(M,"drawCurves");function A(e,t,a,r){const n=Math.min(Math.max(e,t),a);return r*(n-t)/(a-t)}l(A,"relativeRadius");function L(e,t){const a=e.length;let r=`M${e[0].x},${e[0].y}`;for(let n=0;n<a;n++){const o=e[(n-1+a)%a],i=e[n],s=e[(n+1)%a],c=e[(n+2)%a],d={x:i.x+(s.x-o.x)*t,y:i.y+(s.y-o.y)*t},u={x:s.x-(c.x-i.x)*t,y:s.y-(c.y-i.y)*t};r+=` C${d.x},${d.y} ${u.x},${u.y} ${s.x},${s.y}`}return`${r} Z`}l(L,"closedRoundCurve");function T(e,t,a,r){if(!a)return;const n=(r.width/2+r.marginRight)*3/4,o=-(r.height/2+r.marginTop)*3/4,i=20;t.forEach((s,c)=>{const d=e.append("g").attr("transform",`translate(${n}, ${o+c*i})`);d.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${c}`),d.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}l(T,"drawLegend");var nt={draw:tt},st=l((e,t)=>{let a="";for(let r=0;r<e.THEME_COLOR_LIMIT;r++){const n=e[`cScale${r}`];a+=`
		.radarCurve-${r} {
			color: ${n};
			fill: ${n};
			fill-opacity: ${t.curveOpacity};
			stroke: ${n};
			stroke-width: ${t.curveStrokeWidth};
		}
		.radarLegendBox-${r} {
			fill: ${n};
			fill-opacity: ${t.curveOpacity};
			stroke: ${n};
		}
		`}return a},"genIndexStyles"),ot=l(e=>{const t=V(),a=b(),r=$(t,a.themeVariables),n=$(r.radar,e);return{themeVariables:r,radarOptions:n}},"buildRadarStyleOptions"),it=l(({radar:e}={})=>{const{themeVariables:t,radarOptions:a}=ot(e);return`
	.radarTitle {
		font-size: ${t.fontSize};
		color: ${t.titleColor};
		dominant-baseline: hanging;
		text-anchor: middle;
	}
	.radarAxisLine {
		stroke: ${a.axisColor};
		stroke-width: ${a.axisStrokeWidth};
	}
	.radarAxisLabel {
		dominant-baseline: middle;
		text-anchor: middle;
		font-size: ${a.axisLabelFontSize}px;
		color: ${a.axisColor};
	}
	.radarGraticule {
		fill: ${a.graticuleColor};
		fill-opacity: ${a.graticuleOpacity};
		stroke: ${a.graticuleColor};
		stroke-width: ${a.graticuleStrokeWidth};
	}
	.radarLegendText {
		text-anchor: start;
		font-size: ${a.legendFontSize}px;
		dominant-baseline: hanging;
	}
	${st(t,a)}
	`},"styles"),$t={parser:Q,db:f,renderer:nt,styles:it};export{$t as diagram};
//# sourceMappingURL=diagram-SSKATNLV-U100gEEW.js.map
