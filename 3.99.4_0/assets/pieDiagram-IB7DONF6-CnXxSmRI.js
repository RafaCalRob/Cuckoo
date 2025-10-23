import{p as U}from"./chunk-4BMEZGHF-KieXOWV_.js";import{aa as S,a2 as M,aA as j,C as H,n as Z,o as q,s as J,g as K,c as Q,b as X,_ as d,l as _,t as Y,d as ee,D as te,H as ae,O as re,k as ne}from"./MermaidPreview-CX3oxt-0.js";import{p as ie}from"./radar-MK3ICKWK-B57vnsek.js";import{d as W}from"./arc-CI9Pnuom.js";import{o as se}from"./ordinal-CDnGzUfX.js";import"./premium-CHh0JHCP.js";import"./user-config-B2p-VbRf.js";import"./merge-CpUPYoWF.js";import"./map-ByswxN6x.js";import"./_baseUniq-Cpwc2P36.js";import"./uniqBy-Cgm_lAH2.js";import"./min-DsEQ3uiE.js";import"./reduce-BLoHwvCR.js";import"./clone-DYru4j1C.js";import"./init-DBeb8MCR.js";(function(){try{var e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},a=new e.Error().stack;a&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[a]="e2d86d99-4073-4451-b97c-769e4e417ea4",e._sentryDebugIdIdentifier="sentry-dbid-e2d86d99-4073-4451-b97c-769e4e417ea4")}catch{}})();function oe(e,a){return a<e?-1:a>e?1:a>=e?0:NaN}function le(e){return e}function ce(){var e=le,a=oe,f=null,o=S(0),p=S(M),x=S(0);function i(t){var r,l=(t=j(t)).length,c,w,h=0,u=new Array(l),n=new Array(l),y=+o.apply(this,arguments),D=Math.min(M,Math.max(-M,p.apply(this,arguments)-y)),m,T=Math.min(Math.abs(D)/l,x.apply(this,arguments)),b=T*(D<0?-1:1),g;for(r=0;r<l;++r)(g=n[u[r]=r]=+e(t[r],r,t))>0&&(h+=g);for(a!=null?u.sort(function(v,A){return a(n[v],n[A])}):f!=null&&u.sort(function(v,A){return f(t[v],t[A])}),r=0,w=h?(D-l*b)/h:0;r<l;++r,y=m)c=u[r],g=n[c],m=y+(g>0?g*w:0)+b,n[c]={data:t[c],index:r,value:g,startAngle:y,endAngle:m,padAngle:T};return n}return i.value=function(t){return arguments.length?(e=typeof t=="function"?t:S(+t),i):e},i.sortValues=function(t){return arguments.length?(a=t,f=null,i):a},i.sort=function(t){return arguments.length?(f=t,a=null,i):f},i.startAngle=function(t){return arguments.length?(o=typeof t=="function"?t:S(+t),i):o},i.endAngle=function(t){return arguments.length?(p=typeof t=="function"?t:S(+t),i):p},i.padAngle=function(t){return arguments.length?(x=typeof t=="function"?t:S(+t),i):x},i}var N=H.pie,z={sections:new Map,showData:!1,config:N},E=z.sections,F=z.showData,ue=structuredClone(N),de=d(()=>structuredClone(ue),"getConfig"),pe=d(()=>{E=new Map,F=z.showData,Y()},"clear"),ge=d(({label:e,value:a})=>{E.has(e)||(E.set(e,a),_.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),fe=d(()=>E,"getSections"),me=d(e=>{F=e},"setShowData"),he=d(()=>F,"getShowData"),P={getConfig:de,clear:pe,setDiagramTitle:Z,getDiagramTitle:q,setAccTitle:J,getAccTitle:K,setAccDescription:Q,getAccDescription:X,addSection:ge,getSections:fe,setShowData:me,getShowData:he},ye=d((e,a)=>{U(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),ve={parse:d(async e=>{const a=await ie("pie",e);_.debug(a),ye(a,P)},"parse")},Se=d(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),xe=Se,we=d(e=>{const a=[...e.entries()].map(o=>({label:o[0],value:o[1]})).sort((o,p)=>p.value-o.value);return ce().value(o=>o.value)(a)},"createPieArcs"),De=d((e,a,f,o)=>{_.debug(`rendering pie chart
`+e);const p=o.db,x=ee(),i=te(p.getConfig(),x.pie),t=40,r=18,l=4,c=450,w=c,h=ae(a),u=h.append("g");u.attr("transform","translate("+w/2+","+c/2+")");const{themeVariables:n}=x;let[y]=re(n.pieOuterStrokeWidth);y??(y=2);const D=i.textPosition,m=Math.min(w,c)/2-t,T=W().innerRadius(0).outerRadius(m),b=W().innerRadius(m*D).outerRadius(m*D);u.append("circle").attr("cx",0).attr("cy",0).attr("r",m+y/2).attr("class","pieOuterCircle");const g=p.getSections(),v=we(g),A=[n.pie1,n.pie2,n.pie3,n.pie4,n.pie5,n.pie6,n.pie7,n.pie8,n.pie9,n.pie10,n.pie11,n.pie12],C=se(A);u.selectAll("mySlices").data(v).enter().append("path").attr("d",T).attr("fill",s=>C(s.data.label)).attr("class","pieCircle");let G=0;g.forEach(s=>{G+=s}),u.selectAll("mySlices").data(v).enter().append("text").text(s=>(s.data.value/G*100).toFixed(0)+"%").attr("transform",s=>"translate("+b.centroid(s)+")").style("text-anchor","middle").attr("class","slice"),u.append("text").text(p.getDiagramTitle()).attr("x",0).attr("y",-(c-50)/2).attr("class","pieTitleText");const I=u.selectAll(".legend").data(C.domain()).enter().append("g").attr("class","legend").attr("transform",(s,$)=>{const k=r+l,L=k*C.domain().length/2,B=12*r,V=$*k-L;return"translate("+B+","+V+")"});I.append("rect").attr("width",r).attr("height",r).style("fill",C).style("stroke",C),I.data(v).append("text").attr("x",r+l).attr("y",r-l).text(s=>{const{label:$,value:k}=s.data;return p.getShowData()?`${$} [${k}]`:$});const R=Math.max(...I.selectAll("text").nodes().map(s=>(s==null?void 0:s.getBoundingClientRect().width)??0)),O=w+t+r+l+R;h.attr("viewBox",`0 0 ${O} ${c}`),ne(h,c,O,i.useMaxWidth)},"draw"),Ae={draw:De},Pe={parser:ve,db:P,renderer:Ae,styles:xe};export{Pe as diagram};
//# sourceMappingURL=pieDiagram-IB7DONF6-CnXxSmRI.js.map
