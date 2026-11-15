import React,{useEffect,useRef,useState} from 'react';
import {loadFace} from './facecare/storage.js';
const KEY='beauty-link-reader-v1';
const books=[['face','Facebook'],['voice','Voicebook'],['hair','Hairbook'],['makeup','Makeupbook']];
const valid=u=>{try{const x=new URL(u);return ['https:','http:'].includes(x.protocol)?x.href:null}catch{return null}};
function localRows(userId){return new Promise((resolve,reject)=>{const req=indexedDB.open('beauty-hairs-v1');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains('records')){db.close();resolve([]);return}const tx=db.transaction('records','readonly'),r=tx.objectStore('records').getAll();r.onsuccess=()=>{db.close();resolve((r.result||[]).filter(x=>x.type==='link'&&[userId,userId+':makeup'].includes(x.userId)).map(x=>({section:x.userId===userId?'HairS 영상':'MakeUp 영상',title:x.title||'',url:x.url,tags:x.tags||[]})))};r.onerror=()=>{db.close();reject(r.error)}};req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('records'))req.result.createObjectStore('records',{keyPath:'id'})};});}
export default function LinkReader({userId}){
 const [rows,setRows]=useState([]),[query,setQuery]=useState(''),[section,setSection]=useState('전체'),[notice,setNotice]=useState('');const input=useRef(null);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY+':'+userId);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed.rows))setRows(parsed.rows)}}catch{}},[userId]);
 const exportLinks=async()=>{try{
  const result=[];const add=(section,title,url,tags=[])=>{const safe=valid(url);if(safe)result.push({section,title:String(title||''),url:safe,tags:Array.isArray(tags)?tags.filter(t=>typeof t==='string'):[]})};
  // Face and Voice drills are stored in the primary Face Care record, not in the Book boards.
  const care=await loadFace(userId);
  for(const item of care?.items||[]){
   if(item?.area!=='face'||!['massage','stretch'].includes(item.group))continue;
   const section=item.group==='massage'?'Face':'Voice';
   const title='Lv.'+(Number(item.level)||1)+' · '+(item.en||item.title||item.ko||'동작')+(item.ko&&item.ko!==(item.en||item.title)?' ('+item.ko+')':'');
   for(const id of Array.isArray(item.videos)?item.videos:[]){
    if(typeof id==='string'&&/^[\\w-]{11}$/.test(id))add(section,title,'https://www.youtube.com/watch?v='+id);
   }
   for(const url of Array.isArray(item.instagramLinks)?item.instagramLinks:[])add(section,title,url);
  }
  for(const [book,name] of books){const id=book==='makeup'?userId+':makeup':userId;const state=await loadFace(book+'-lookbook:'+id);for(const board of state?.boards||[]){for(const [index,meta] of Object.entries(board.meta||{}))add(name,board.name+' · '+(Number(index)+1),meta?.link);for(const slot of board.slots||[])if(slot?.type==='text'){for(const match of String(slot.text||'').match(/https?:\/\/[^\s]+/g)||[])add(name,board.name,match)}}}
  for(const r of await localRows(userId))add(r.section,r.title,r.url,r.tags);
  const unique=[...new Map(result.map(r=>[r.section+'|'+r.url,r])).values()];
  if(!unique.length){setNotice('내보낼 링크가 없어. Book 칸의 링크와 영상 수집 링크를 확인해 줘.');return}
  const blob=new Blob([JSON.stringify({format:'beauty-links-readonly-v1',exportedAt:new Date().toISOString(),rows:unique},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='beauty-links-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);setNotice(unique.length+'개 링크 내보내기 완료. 아이패드에 파일을 전달해 줘.');
 }catch(e){setNotice('내보내기 실패: '+e.message)}};
 const importLinks=async file=>{if(!file)return;try{if(file.size>5*1024*1024)throw Error('5MB 이하 JSON만 가져올 수 있어.');const parsed=JSON.parse(await file.text());if(parsed.format!=='beauty-links-readonly-v1'||!Array.isArray(parsed.rows))throw Error('Beauty Care 링크 파일이 아니야.');if(parsed.rows.length>20000)throw Error('링크 개수가 너무 많아.');const clean=parsed.rows.map(r=>({section:String(r.section||'기타').slice(0,60),title:String(r.title||'').slice(0,250),url:valid(r.url),tags:Array.isArray(r.tags)?r.tags.filter(x=>typeof x==='string').slice(0,20):[]})).filter(r=>r.url);if(!clean.length)throw Error('유효한 링크가 없어.');localStorage.setItem(KEY+':'+userId,JSON.stringify({rows:clean,importedAt:new Date().toISOString()}));setRows(clean);setSection('전체');setNotice(clean.length+'개 링크를 읽기 전용으로 가져왔어. 아이폰 원본은 변경되지 않았어.')}catch(e){setNotice('가져오기 실패: '+e.message)}};
 const sections=['전체',...new Set(rows.map(r=>r.section))];const filtered=rows.filter(r=>(section==='전체'||r.section===section)&&[r.title,r.url,...r.tags].join(' ').toLowerCase().includes(query.toLowerCase()));
 return <section style={{padding:'16px',maxWidth:850,margin:'0 auto'}}><h2 style={{margin:'0 0 8px'}}>링크 뷰어 · 읽기 전용</h2><p style={{fontSize:13,opacity:.75}}>아이폰에서 링크 파일을 내보내고 아이패드에서 가져와 유튜브 등을 열어봐. 기존 기록은 수정되지 않아.</p><div style={{display:'flex',flexWrap:'wrap',gap:8,margin:'12px 0'}}><button type="button" onClick={exportLinks}>아이폰 · 링크 내보내기</button><button type="button" onClick={()=>input.current?.click()}>아이패드 · 링크 가져오기</button><input ref={input} type="file" accept=".json,application/json" hidden onChange={e=>{importLinks(e.target.files?.[0]);e.target.value=''}}/></div>{notice&&<p role="status">{notice}</p>}<input type="search" aria-label="링크 검색" placeholder="제목 · 태그 · 링크 검색" value={query} onChange={e=>setQuery(e.target.value)} style={{width:'100%',padding:10,boxSizing:'border-box'}}/><div style={{display:'flex',gap:6,overflowX:'auto',margin:'12px 0'}}>{sections.map(s=><button key={s} type="button" onClick={()=>setSection(s)} style={{fontWeight:section===s?700:400,whiteSpace:'nowrap'}}>{s}</button>)}</div><p>{filtered.length}개 링크</p>{filtered.map((r,i)=><article key={r.section+r.url+i} style={{borderBottom:'1px solid #ddd',padding:'12px 0'}}><small>{r.section}</small><div><a href={r.url} target="_blank" rel="noopener noreferrer" style={{fontWeight:600,overflowWrap:'anywhere'}}>{r.title||r.url} ↗</a></div>{r.tags.length>0&&<small>{r.tags.map(t=>'#'+t).join(' ')}</small>}</article>)}</section>;
}
