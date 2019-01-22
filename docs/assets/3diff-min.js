const diffType={mechanical:{id:"edit",ins:"INS",del:"DEL"},structural:{id:"structural",punctuation:"PUNCTUATION",textInsert:"TEXTINSERT",textDelete:"TEXTDELETE",wordchange:"WORDCHANGE",textReplace:"TEXTREPLACE",insert:"INSERT",delete:"DELETE",move:"MOVE",noop:"NOOP",wrap:"WRAP",unwrap:"UNWRAP",split:"SPLIT",join:"JOIN",replace:"REPLACE"},semantic:{id:"semantic"},newTextId:"new",oldTextId:"old"},algorithms={diffMatchPatch:"diff_match_patch"},regexp={punctuation:"^[\\!\\\"\\#\\$\\%\\&'\\(\\)\\*\\+\\,\\-\\.\\/\\:\\;\\=\\?\\@\\[\\]\\^\\_\\`\\{\\|\\}\\~ ]?[A-z]?$",wordchange:"^\\S*$",tagSelector:"<[.A-z]?[^(><.)]+>",unclosedTagSelector:"<[.A-z]?[^(><.)]+",unopenedTagSelector:"[.A-z]?[^(><.)]+>",textSelector:"[A-z\\s]*",lowercaseLetter:"[a-z]+",tagElements:"[<>/?]",splitJoin:"^[\\s]*<[.A-z]?[^(><.)]+><[.A-z]?[^(><.)]+>[\\s]*$"},TBD="TBD",globalUser="SAURON";class DiffAlgorithmSelector{constructor(t,e,n){let s;switch(n){case algorithms.diffMatchPatch:s=new DiffMatchPatchAdapter(t,e);break;default:s=null}return s}}class Adapter{constructor(t,e){this.oldText=t,this.newText=e}makeDiff(t){this.threeDiff=new ThreeDiff(t,this.oldText,this.newText)}getMechanicalOperations(){return this.threeDiff.getMechanicalOperations()}getStructuralOperations(){return this.threeDiff.getStructuralOperations()}}class DiffMatchPatchAdapter extends Adapter{constructor(t,e){super(t,e);let n=new diff_match_patch;this.diffs=n.diff_main(t,e),n.diff_cleanupSemantic(this.diffs),this.patches=n.patch_make(this.diffs),this.runDiffAlgorithm()}runDiffAlgorithm(){this.makeDiff(this._getMechanicalOps())}_getMechanicalOps(){let t=[];for(let e of this.patches){let n=e.start1,s=e.diffs;s.map((e,i)=>{if(i>0){let t=s[i-1];-1!==t[0]&&(n+=parseInt(t[1].length))}if(0!==e[0]){let s=1===e[0]?diffType.mechanical.ins:diffType.mechanical.del;t.push(new MechanicalDiff(s,e[1],n,t.length))}})}return t}}class Diff{constructor(t,e){this.id=this._setId(t,e)}_setId(t,e){let n=`${t}-`,s=4-(++e).toString().length;for(;s>0;)n+="0",s--;return n+e}getText(t,e){return e}}class MechanicalDiff extends Diff{constructor(t,e,n,s){super(diffType.mechanical.id,s),this.op=t,this.content=e,this.pos=n}getWord(t){let e=t.substring(0,this.pos),n=t.substring(this.op===diffType.mechanical.ins?this.pos+this.content.length:this.pos,t.length);return e=e.split(/\s/)[e.split(/\s/).length-1],n=n.split(/\s/)[0],this.op===diffType.mechanical.ins&&(e+=this.content),e+n}isEnclosedInTag(t,e){let n=this.op===diffType.mechanical.ins?t:e;return RegExp(`<[A-z]+[A-z\\d\\=\\"\\s]*${this.content}[A-z\\d\\=\\"\\s]*>`).test(n)}}class StructuralDiff extends Diff{constructor(t,e,n=globalUser){super(diffType.structural.id,t),this.op=TBD,this.by=n,this.timestamp=Date.now(),this.items=[e]}setOperation(t){this.op=t}addItem(t){this.items.push(t)}}class ThreeDiff{constructor(t,e,n){this.listMechanicalOperations=t,this.listStructuralOperations=[],this.listSemanticOperations=[],this.oldText=e,this.newText=n,this.structuralRules=[(t,e=null)=>{if(null===e)return!1;let n=t.isEnclosedInTag(this.newText,this.oldText),s=e.isEnclosedInTag(this.newText,this.oldText);return!(!n||!s)&&(t.content===e.content&&diffType.structural.noop)},(t,e=null)=>null!==e&&(e.content.trim()===t.content.trim()&&e.pos!==t.pos&&t.op!==e.op&&diffType.structural.move),(t,e=null)=>{if(null===e)return!1;if(!RegExp(regexp.tagSelector).test(t.content)&&!RegExp(regexp.tagSelector).test(e.content)&&t.op===e.op)return!1;if(t.content.replace(RegExp(regexp.tagElements,"g"),"")!==e.content.replace(RegExp(regexp.tagElements,"g"),""))return!1;let n=t.op===diffType.mechanical.ins?this.newText:this.oldText,s=Math.min(t.pos+t.content.length,e.pos+e.content.length),i=Math.max(t.pos,e.pos);n.substring(s,i);return t.op===diffType.mechanical.ins?diffType.structural.wrap:diffType.structural.unwrap},(t,e=null)=>{if(null!==e)return!1;if(!RegExp(regexp.splitJoin).test(t.content))return!1;let n,s=[],i=RegExp(regexp.tagSelector,"g");for(;null!==(n=i.exec(t.content));)s.push(n[0]);return t.op===diffType.mechanical.ins?diffType.structural.split:diffType.structural.join},(t,e=null)=>{if(null===e)return!1;let n=t.isEnclosedInTag(this.newText,this.oldText),s=e.isEnclosedInTag(this.newText,this.oldText);return!(!n||!s)&&diffType.structural.replace},(t,e=null)=>{if(null!==e)return!1;if(!RegExp(regexp.tagSelector).test(t.content))return!1;let n,s=[],i=RegExp(regexp.tagSelector,"g");for(;null!==(n=i.exec(t.content));)s.push(n[0]);if(s.length%2!=0)return!1;let r=s[0].replace(RegExp(regexp.tagElements,"g"),""),l=s[s.length-1].replace(RegExp(regexp.tagElements,"g"),"");if(r.split(/\s/)[0]!==l)return!1;let o=t.op===diffType.mechanical.ins?diffType.structural.insert:diffType.structural.delete;return!!RegExp(`^${regexp.textSelector}<${r}>.*</${l}>${regexp.textSelector}$`).test(t.content)&&o},(t,e=null)=>null!==e&&(t.pos===e.pos&&(t.op!==e.op&&(!(!RegExp(regexp.punctuation).test(t.content)||!RegExp(regexp.punctuation).test(e.content))&&diffType.structural.punctuation))),(t,e=null)=>!1,(t,e=null)=>null!==e&&(t.content!==e.content&&t.pos===e.pos&&t.op!==e.op&&diffType.structural.textReplace),(t,e=null)=>{if(null!==e)return!1;let n=t.getWord(this.newText);return!!RegExp(regexp.wordchange).test(n)&&diffType.structural.wordchange},(t,e=null)=>{if(null===e)return!1;let n=t.getWord(this.newText);if(RegExp(regexp.tagSelector).test(e.content))return!1;let s=e.getWord(this.newText);return!(""===n||""===s||!RegExp(regexp.wordchange).test(n)||!RegExp(regexp.wordchange).test(s)||n!==s)&&diffType.structural.wordchange},(t,e=null)=>null===e&&(t.op===diffType.mechanical.ins?diffType.structural.textInsert:diffType.structural.textDelete)],this._executeStructuralAnalysis()}_executeStructuralAnalysis(){let t=this.listMechanicalOperations.slice(0);for(;t.length>0;){let e=!1,n=t.splice(0,1)[0],s=new StructuralDiff(this.listStructuralOperations.length,n);for(let i=0;i<t.length;i++){let r=t[i];for(let l of this.structuralRules){let o=l(n,r);if(this._checkRuleResulCorrectness(o)){s.setOperation(o),s.addItem(t.splice(i,1)[0]),e=!0,i--;break}}if(s.op!==diffType.structural.wordchange||s.op!==diffType.structural.replace)break}if(!e)for(let t of this.structuralRules){let e=t(n);if(this._checkRuleResulCorrectness(e)){s.setOperation(e);break}}this.listStructuralOperations.push(s)}}_setOldsNews(){for(let t of this.listStructuralOperations){let e=t.items,n=this._getContextBoundariesNew(this.newText,e[0],e[e.length-1]),s=n.leftContext;e.map((t,n)=>{let i=e[n+1];t.op===diffType.mechanical.ins?(s+=t.content,void 0!==i&&(s+=this.newText.substring(t.pos+t.content.length,i.pos))):void 0!==i&&(s+=this.newText.substring(t.pos,i.pos))}),s+=n.rightContext;let i=this._getContextBoundariesOld(this.oldText,e[0],e[e.length-1]).leftContext;e.map((t,n)=>{let s=e[n+1];t.op===diffType.mechanical.ins?void 0!==s&&(i+=this.oldText.substring(t.pos,s.pos-t.content.length)):(i+=t.content,void 0!==s&&(i+=this.oldText.substring(t.pos+t.content.length,s.pos+t.content.length)))}),i+=n.rightContext,t.new=s,t.old=i}}_getContextBoundariesNew(t,e,n){const s=e.pos,i=n.pos+(n.op===diffType.mechanical.ins?n.content.length:0),r=s<10?0:10,l=i+10<t.length?i+10:t.length;let o=t.substring(r,s).split(/\s/),c=t.substring(i,l).split(/\s/);return{leftContext:o[o.length-1],rightContext:c[0]}}_getContextBoundariesOld(t,e,n){const s=e.pos,i=n.pos+(n.op===diffType.mechanical.del?n.content.length:0),r=s<10?0:10,l=i+10<t.length?i+10:t.length;let o=t.substring(r,s).split(/\s/),c=t.substring(i,l).split(/\s/);return{leftContext:o[o.length-1],rightContext:c[0]}}_checkRuleResulCorrectness(t){return!1!==t&&(null!==t&&void 0!==t)}getMechanicalOperations(){return this.listMechanicalOperations}getStructuralOperations(){return this.listStructuralOperations}}