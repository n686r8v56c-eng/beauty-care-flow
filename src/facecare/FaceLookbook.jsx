import React,{useEffect,useRef,useState} from 'react';
import {Plus,Pin,Archive,ArchiveRestore,Link2,DollarSign,Copy,X,Check,Type,ImagePlus} from 'lucide-react';
import {loadFace,saveFace,photoStorage} from './storage.js';
import './FaceLookbook.css';
const initial=()=>({groups:[{id:'korea',name:'Korea'},{id:'china',name:'China'}],boards:[{id:'first',group:'korea',name:'보드1',slots:Array(8).fill(null),meta:{},pins:[],checks:[],archived:false}]});
export default function FaceLookbook({userId}){
 const key='face-lookbook:'+userId;
 const [state,setState]=useState(null),[group,setGroup]=useState('korea'),[archived,setArchived]=useState(false),[urls,setUrls]=useState({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const storage=useRef(photoStorage()),files=useRef({});
 const [chooser,setChooser]=useState(null),[editor,setEditor]=useState(null),[draft,setDraft]=useState('');
 useEffect(()=>{let live=true;loadFace(key).then(v=>{if(live)setState(v||initial())}).catch(e=>setError(e.message));return()=>{live=false;storage.current.dispose()}},[key]);
 useEffect(()=>{if(!state)return;let live=true;const paths=state.boards.flatMap(b=>b.slots.filter(p=>typeof p==='string'&&p));Promise.all(paths.map(async p=>[p,(await storage.current.storage.from().createSignedUrl(p)).data?.signedUrl])).then(entries=>{if(live)setUrls(Object.fromEntries(entries.filter(x=>x[1]))) });return()=>{live=false}},[state]);
 async function change(fn){if(busy||!state)return;const next=structuredClone(state);fn(next);setBusy(true);try{await saveFace(key,next);setState(next)}catch(e){setError('저장 실패: '+e.message)}finally{setBusy(false)}}
 const boards=state?.boards.filter(b=>b.group===group&&b.archived===archived)||[];
 async function addPhoto(board,i,file){if(!file)return;setBusy(true);try{const path='face-lookbook/'+userId+'/'+crypto.randomUUID();const result=await storage.current.storage.from().upload(path,file);if(result.error)throw result.error;const next=structuredClone(state);next.boards.find(b=>b.id===board.id).slots[i]=path;await saveFace(key,next);setState(next)}catch(e){setError('사진 저장 실패: '+e.message)}finally{setBusy(false)}}
 function editText(board,i){setChooser(null);setDraft(board.slots[i]?.type==='text'?board.slots[i].text:'');setEditor({boardId:board.id,index:i})}
 async function saveText(){if(!editor)return;const value=draft.trim();await change(s=>{const b=s.boards.find(b=>b.id===editor.boardId);b.slots[editor.index]=value?{type:'text',text:value}:null});setEditor(null)}
 async function setMeta(board,i,field){let value='';if(field==='link'){try{value=await navigator.clipboard.readText()}catch{value=prompt('링크를 붙여넣어 줘')||''}}else value=prompt('가격을 입력해 줘',board.meta?.[i]?.price||'')||'';if(!value)return;await change(s=>{const b=s.boards.find(x=>x.id===board.id);b.meta=b.meta||{};b.meta[i]={...b.meta[i],[field]:value}})}
 if(!state)return <p>LOOKBOOK 불러오는 중…</p>;
 return <section className="face-lookbook">
  <header className="fl-heading"><strong>LOOKBOOK</strong><button onClick={()=>setArchived(v=>!v)}><Archive size={21}/> ({state.boards.filter(b=>b.archived).length})</button></header>
  <div className="fl-groups">{state.groups.map(g=><button key={g.id} className={group===g.id?'active':''} onClick={()=>setGroup(g.id)}>{g.name}</button>)}<button aria-label="상위함 추가" onClick={()=>{const name=prompt('상위함 이름');if(name?.trim())change(s=>s.groups.push({id:crypto.randomUUID(),name:name.trim()}))}}><Plus/></button></div>
  {error&&<p role="alert">{error}</p>}
  <div className="fl-board-scroll">{boards.map(board=><article className="fl-board" key={board.id}>
   <div className="fl-board-title"><button onClick={()=>{const name=prompt('보드 이름',board.name);if(name?.trim())change(s=>s.boards.find(b=>b.id===board.id).name=name.trim())}}>{board.name}</button><button aria-label={archived?'보드 복원':'보드 아카이브'} onClick={()=>change(s=>{s.boards.find(b=>b.id===board.id).archived=!archived})}>{archived?<ArchiveRestore size={18}/>:<Archive size={18}/>}</button></div>
   <div className="fl-tiles">{board.slots.map((path,i)=>({path,i})).sort((a,b)=>Number(board.pins?.includes(b.i)&&!!b.path)-Number(board.pins?.includes(a.i)&&!!a.path)||a.i-b.i).map(({path,i})=><div className="fl-tile" key={i}>
    <input type="file" accept="image/*" hidden ref={el=>files.current[board.id+':'+i]=el} onChange={e=>{addPhoto(board,i,e.target.files?.[0]);e.target.value=''}}/>
    <button className={'fl-photo '+(path?.type==='text'?'fl-text-tile':'')} disabled={busy} onClick={()=>path?.type==='text'?editText(board,i):path?files.current[board.id+':'+i]?.click():setChooser({boardId:board.id,index:i})}>{path?.type==='text'?<span>{path.text}</span>:typeof path==='string'&&urls[path]?<img src={urls[path]} alt={board.name+' 사진'}/>:<Plus size={25}/>}</button>
    {path&&<><button className={'fl-pin '+(board.pins?.includes(i)?'active':'')} onClick={()=>change(s=>{const b=s.boards.find(b=>b.id===board.id);b.pins=b.pins||[];b.pins=b.pins.includes(i)?b.pins.filter(n=>n!==i):[...b.pins,i]})}><Pin size={17} fill={board.pins?.includes(i)?'currentColor':'none'}/></button>
    <button className="fl-remove" onClick={()=>{if(confirm('이 칸의 내용을 제거할까?'))change(s=>{const b=s.boards.find(b=>b.id===board.id);b.slots[i]=null;b.meta&&delete b.meta[i];b.pins=(b.pins||[]).filter(n=>n!==i)})}}><X size={17}/></button>
    <div className="fl-tools"><button onClick={()=>navigator.clipboard.writeText(board.meta?.[i]?.link||'').catch(()=>{})}><Copy size={17}/></button><button onClick={()=>board.meta?.[i]?.link?window.open(board.meta[i].link,'_blank','noopener,noreferrer'):setMeta(board,i,'link')}><Link2 size={17}/></button><button onClick={()=>setMeta(board,i,'price')}><DollarSign size={17}/></button></div>
    <button className="fl-check" onClick={()=>change(s=>{const b=s.boards.find(b=>b.id===board.id);b.checks=b.checks||[];b.checks=b.checks.includes(i)?b.checks.filter(n=>n!==i):[...b.checks,i]})}><Check size={18} color={board.checks?.includes(i)?'#fff':'#8158ac'}/></button></>}
   </div>)}</div>
   <button className="fl-add-row" disabled={busy} onClick={()=>change(s=>s.boards.find(b=>b.id===board.id).slots.push(null,null))}><Plus size={17}/> 행 추가</button>
  </article>)}
  {!archived&&<button className="fl-add-board" onClick={()=>change(s=>s.boards.push({id:crypto.randomUUID(),group,name:'보드'+(s.boards.filter(b=>b.group===group).length+1),slots:Array(8).fill(null),meta:{},pins:[],checks:[],archived:false}))}><Plus/> 보드 추가</button>}</div>
  {chooser&&<div className="fl-modal-backdrop" onClick={()=>setChooser(null)}><div className="fl-modal" role="dialog" aria-modal="true" aria-label="칸 내용 선택" onClick={e=>e.stopPropagation()}><h3>이 칸에 무엇을 넣을까?</h3><div className="fl-choices"><button onClick={()=>{const b=state.boards.find(b=>b.id===chooser.boardId);editText(b,chooser.index)}}><Type/> 텍스트</button><button onClick={()=>{const id=chooser.boardId+':'+chooser.index;setChooser(null);files.current[id]?.click()}}><ImagePlus/> 이미지</button></div><button className="fl-cancel" onClick={()=>setChooser(null)}>취소</button></div></div>}
  {editor&&<div className="fl-modal-backdrop" onClick={()=>setEditor(null)}><div className="fl-modal" role="dialog" aria-modal="true" aria-label="텍스트 편집" onClick={e=>e.stopPropagation()}><h3>텍스트 편집</h3><textarea autoFocus value={draft} onChange={e=>setDraft(e.target.value)} placeholder="이 칸에 표시할 메모를 적어줘" rows={8}/><div className="fl-editor-actions"><button onClick={()=>setEditor(null)}>취소</button><button disabled={busy} onClick={saveText}>저장</button></div></div></div>}
 </section>
}