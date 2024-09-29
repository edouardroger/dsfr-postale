(function(e,u){typeof exports=="object"&&typeof module<"u"?module.exports=u(require("vue")):typeof define=="function"&&define.amd?define(["vue"],u):(e=typeof globalThis<"u"?globalThis:e||self,e.DsfrPostale=u(e.Vue))})(this,function(e){"use strict";const u=e.defineComponent({name:"DsfrPostale",props:{label:{type:String,required:!0},inputId:{type:String,required:!0}},emits:["addressSelected"],setup(t,{emit:a}){const i=e.ref(""),n=e.ref([]),s=e.ref(-1),c=e.ref([]),l=e.computed(()=>s.value>=0?`suggestion-${s.value}`:""),d=o=>/\s[a-zA-Z]/.test(o),p=async()=>{if(!d(i.value)){n.value=[],s.value=-1;return}try{const r=await(await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(i.value)}`)).json();n.value=r.features,c.value=r.features,s.value=-1}catch(o){console.error("Erreur lors de la r\xE9cup\xE9ration des suggestions:",o)}},b=o=>{n.value.length!==0&&(o.key==="ArrowDown"?s.value=(s.value+1)%n.value.length:o.key==="ArrowUp"?s.value=(s.value-1+n.value.length)%n.value.length:o.key==="Enter"&&s.value>=0?g(s.value):o.key==="Escape"&&(n.value=[],s.value=-1))},g=o=>{const r=c.value[o].properties,k={label:r.label,housenumber:r.housenumber,street:r.street,postcode:r.postcode,city:r.city,citycode:r.citycode,lat:c.value[o].geometry.coordinates[1],lng:c.value[o].geometry.coordinates[0]};i.value=r.label,n.value=[],a("addressSelected",k)};return{query:i,suggestions:n,activeIndex:s,activeDescendant:l,getAdresseSuggestions:p,handleKeyDown:b,selectAddress:g}}}),w="",f=(t,a)=>{const i=t.__vccOpts||t;for(const[n,s]of a)i[n]=s;return i},y=["for"],m=["aria-expanded","id","aria-activedescendant"],h={role:"listbox",id:"suggestions",class:"suggestions"},v=["id","aria-selected","onClick"];function D(t,a,i,n,s,c){return e.openBlock(),e.createElementBlock("div",null,[e.createElementVNode("label",{for:t.inputId,class:"fr-label"},e.toDisplayString(t.label),9,y),e.withDirectives(e.createElementVNode("input",{type:"text",class:"fr-input",role:"combobox","aria-haspopup":"listbox","aria-owns":"suggestions","aria-expanded":t.suggestions.length>0,id:t.inputId,"onUpdate:modelValue":a[0]||(a[0]=l=>t.query=l),onInput:a[1]||(a[1]=(...l)=>t.getAdresseSuggestions&&t.getAdresseSuggestions(...l)),onKeydown:a[2]||(a[2]=(...l)=>t.handleKeyDown&&t.handleKeyDown(...l)),"aria-autocomplete":"list","aria-controls":"suggestions","aria-activedescendant":t.activeDescendant,autocomplete:"off"},null,40,m),[[e.vModelText,t.query]]),e.withDirectives(e.createElementVNode("ul",h,[(e.openBlock(!0),e.createElementBlock(e.Fragment,null,e.renderList(t.suggestions,(l,d)=>(e.openBlock(),e.createElementBlock("li",{key:d,id:"suggestion-"+d,role:"option","aria-selected":d===t.activeIndex,onClick:p=>t.selectAddress(d)},e.toDisplayString(l.properties.label),9,v))),128))],512),[[e.vShow,t.suggestions.length>0]])])}return f(u,[["render",D],["__scopeId","data-v-1d8680dd"]])});