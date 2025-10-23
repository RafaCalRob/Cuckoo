import{p as $}from"./chunk-4BMEZGHF-KieXOWV_.js";import{C as B,s as S,g as D,n as F,o as _,b as z,c as P,_ as l,l as y,D as v,E as T,t as W,H as E,k as A}from"./MermaidPreview-CX3oxt-0.js";import{p as I}from"./radar-MK3ICKWK-B57vnsek.js";import"./premium-CHh0JHCP.js";import"./user-config-B2p-VbRf.js";import"./merge-CpUPYoWF.js";import"./map-ByswxN6x.js";import"./_baseUniq-Cpwc2P36.js";import"./uniqBy-Cgm_lAH2.js";import"./min-DsEQ3uiE.js";import"./reduce-BLoHwvCR.js";import"./clone-DYru4j1C.js";(function(){try{var t=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},e=new t.Error().stack;e&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[e]="b4500663-4f5f-47d6-868c-c3d22e1214e2",t._sentryDebugIdIdentifier="sentry-dbid-b4500663-4f5f-47d6-868c-c3d22e1214e2")}catch{}})();var x={packet:[]},m=structuredClone(x),N=B.packet,L=l(()=>{const t=v({...N,...T().packet});return t.showBits&&(t.paddingY+=10),t},"getConfig"),Y=l(()=>m.packet,"getPacket"),H=l(t=>{t.length>0&&m.packet.push(t)},"pushWord"),M=l(()=>{W(),m=structuredClone(x)},"clear"),h={pushWord:H,getPacket:Y,getConfig:L,clear:M,setAccTitle:S,getAccTitle:D,setDiagramTitle:F,getDiagramTitle:_,getAccDescription:z,setAccDescription:P},O=1e4,G=l(t=>{$(t,h);let e=-1,r=[],s=1;const{bitsPerRow:i}=h.getConfig();for(let{start:a,end:o,label:p}of t.blocks){if(o&&o<a)throw new Error(`Packet block ${a} - ${o} is invalid. End must be greater than start.`);if(a!==e+1)throw new Error(`Packet block ${a} - ${o??a} is not contiguous. It should start from ${e+1}.`);for(e=o??a,y.debug(`Packet block ${a} - ${e} with label ${p}`);r.length<=i+1&&h.getPacket().length<O;){const[b,c]=K({start:a,end:o,label:p},s,i);if(r.push(b),b.end+1===s*i&&(h.pushWord(r),r=[],s++),!c)break;({start:a,end:o,label:p}=c)}}h.pushWord(r)},"populate"),K=l((t,e,r)=>{if(t.end===void 0&&(t.end=t.start),t.start>t.end)throw new Error(`Block start ${t.start} is greater than block end ${t.end}.`);return t.end+1<=e*r?[t,void 0]:[{start:t.start,end:e*r-1,label:t.label},{start:e*r,end:t.end,label:t.label}]},"getNextFittingBlock"),R={parse:l(async t=>{const e=await I("packet",t);y.debug(e),G(e)},"parse")},U=l((t,e,r,s)=>{const i=s.db,a=i.getConfig(),{rowHeight:o,paddingY:p,bitWidth:b,bitsPerRow:c}=a,u=i.getPacket(),n=i.getDiagramTitle(),g=o+p,d=g*(u.length+1)-(n?0:o),f=b*c+2,k=E(e);k.attr("viewbox",`0 0 ${f} ${d}`),A(k,d,f,a.useMaxWidth);for(const[w,C]of u.entries())X(k,C,w,a);k.append("text").text(n).attr("x",f/2).attr("y",d-g/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),X=l((t,e,r,{rowHeight:s,paddingX:i,paddingY:a,bitWidth:o,bitsPerRow:p,showBits:b})=>{const c=t.append("g"),u=r*(s+a)+a;for(const n of e){const g=n.start%p*o+1,d=(n.end-n.start+1)*o-i;if(c.append("rect").attr("x",g).attr("y",u).attr("width",d).attr("height",s).attr("class","packetBlock"),c.append("text").attr("x",g+d/2).attr("y",u+s/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(n.label),!b)continue;const f=n.end===n.start,k=u-2;c.append("text").attr("x",g+(f?d/2:0)).attr("y",k).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",f?"middle":"start").text(n.start),f||c.append("text").attr("x",g+d).attr("y",k).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(n.end)}},"drawWord"),j={draw:U},q={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},J=l(({packet:t}={})=>{const e=v(q,t);return`
	.packetByte {
		font-size: ${e.byteFontSize};
	}
	.packetByte.start {
		fill: ${e.startByteColor};
	}
	.packetByte.end {
		fill: ${e.endByteColor};
	}
	.packetLabel {
		fill: ${e.labelColor};
		font-size: ${e.labelFontSize};
	}
	.packetTitle {
		fill: ${e.titleColor};
		font-size: ${e.titleFontSize};
	}
	.packetBlock {
		stroke: ${e.blockStrokeColor};
		stroke-width: ${e.blockStrokeWidth};
		fill: ${e.blockFillColor};
	}
	`},"styles"),ct={parser:R,db:h,renderer:j,styles:J};export{ct as diagram};
//# sourceMappingURL=diagram-VNBRO52H-agYLS-Vk.js.map
