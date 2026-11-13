import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Play,Pause,RotateCcw,Upload,Download} from 'lucide-react';
import CareLibrary from './CareLibrary.jsx';
import RoutineTimer from './RoutineTimer.jsx';
import PracticeRecords from './PracticeRecords.jsx';
import {loadFace,saveFace,photoStorage} from './storage.js';
import './BodyStyle.css';
import './FaceCare.css';
const fresh=()=>({version:1,items:[],routines:[],practiceLogs:[],levelNames:{'face:stretch':['기초','음정','음색','기교','표현']},groupNames:{'face:massage':'Face','face:stretch':'Voice','face:bodyweight':'Timer','face:machine':'기록'}});
const groups=[{id:'massage',name:'Face'},{id:'stretch',name:'Voice'},{id:'bodyweight',name:'Timer'},{id:'machine',name:'기록'}];
const careGroups=new Set(['massage','stretch','bodyweight','machine']);
const safeString=v=>typeof v==='string'?v:'';
const sourceData=raw=>{
 if(!raw||!['body-care-studio-v1','body-care-studio-v2'].includes(raw.format)||!Array.isArray(raw.items))throw Error('Body Care Studio v2의 전체 JSON 백업 파일을 선택해 줘.');
 const items=raw.items.filter(x=>x&&x.area==='face'&&careGroups.has(x.group)&&typeof x.id==='string').map(x=>({...x,area:'face'}));
 const validIds=new Set(items.map(x=>x.id));
 const routines=(Array.isArray(raw.routines)?raw.routines:[]).filter(x=>x?.area==='face'&&careGroups.has(x.group)&&typeof x.id==='string'&&Array.isArray(x.steps)).map(x=>({...x,steps:x.steps.filter(st=>st&&typeof st.videoId==='string'&&/^[\\w-]{11}$/.test(st.videoId)&&(!st.itemId||validIds.has(st.itemId)))}));
 const logs=(Array.isArray(raw.practiceLogs)?raw.practiceLogs:[]).filter(x=>/^\\d{4}-\\d{2}-\\d{2}$/.test(x?.date)).map(x=>({date:x.date,face:Math.max(0,Number(x.face)||0),voice:Math.max(0,Number(x.voice)||0)}));
 const names=Object.fromEntries(Object.entries(raw.groupNames||{}).filter(([k,v])=>/^face:(massage|stretch|bodyweight|machine)$/.test(k)&&typeof v==='string'));
 const levels=Object.fromEntries(Object.entries(raw.levelNames||{}).filter(([k,v])=>/^face:(massage|stretch|bodyweight|machine)$/.test(k)&&Array.isArray(v)));
 return {items,routines,logs,names,levels,exportedAt:safeString(raw.exportedAt)};
};
const backupFile=(data)=>{
 const blob=new Blob([JSON.stringify({format:'beauty-face-care-v1',exportedAt:new Date().toISOString(),...data},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='beauty-face-before-import-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
};
export default function FaceCare({userId}){
 const [data,setData]=useState(fresh),[ready,setReady]=useState(false),[status,setStatus]=useState('불러오는 중'),[error,setError]=useState('');
 const current=useRef(null),queue=useRef(Promise.resolve()),alive=useRef(true);
 const [tab,setTab]=useState('massage'),[kind,setKind]=useState('face'),[rename,setRename]=useState(null),[name,setName]=useState('');
 const [incoming,setIncoming]=useState(null),[importError,setImportError]=useState(''),[importBusy,setImportBusy]=useState(false);
 const importRef=useRef(null);
 const press=useRef(null),long=useRef(false),photos=useMemo(photoStorage,[]);
 useEffect(()=>{alive.current=true;let live=true;loadFace(userId).then(saved=>{if(!live)return;const next=saved||fresh();current.current=next;setData(next);setReady(true);setStatus('기기 저장')}).catch(e=>{if(live)setError('기록 불러오기 실패: '+e.message)});return()=>{live=false;alive.current=false;clearTimeout(press.current);photos.dispose()}},[userId,photos]);
 const update=fn=>{if(!current.current)return;const next=structuredClone(current.current);fn(next);current.current=next;setData(next);setStatus('저장 중…');queue.current=queue.current.catch(()=>{}).then(()=>saveFace(userId,next)).then(()=>{if(alive.current)setStatus('기기 저장')}).catch(e=>{if(alive.current){setStatus('저장 실패');setError('기록 저장 실패 · JSON으로 백업해 주세요: '+e.message)}})};
 const chooseBackup=async file=>{
  setImportError('');setIncoming(null);if(!file)return;
  try{if(file.size>20*1024*1024)throw Error('20MB 이하 JSON 파일만 가져올 수 있어.');const parsed=sourceData(JSON.parse(await file.text()));setIncoming(parsed)}
  catch(e){setImportError(e.message||'파일 분석 실패')}
 };
 const importCounts=()=>{
  if(!incoming||!current.current)return null;
  const old=current.current;
  return {items:incoming.items.filter(x=>!old.items.some(y=>y.id===x.id)).length,routines:incoming.routines.filter(x=>!old.routines.some(y=>y.id===x.id)).length,logs:incoming.logs.filter(x=>!old.practiceLogs.some(y=>y.date===x.date)).length,overlap:incoming.logs.filter(x=>old.practiceLogs.some(y=>y.date===x.date)).length};
 };
 const mergeBackup=async()=>{
  if(!incoming||!current.current||importBusy)return;
  setImportBusy(true);setImportError('');
  try{
   // Never overwrite existing IDs or sum identical day totals on repeated imports.
   // Generate a local rollback copy before any change.
   backupFile(current.current);
   const copy=structuredClone(current.current);
   const existingItems=new Set(copy.items.map(x=>x.id));
   for(const x of incoming.items)if(!existingItems.has(x.id)){copy.items.push(x);existingItems.add(x.id)}
   const existingRoutines=new Set(copy.routines.map(x=>x.id));
   for(const x of incoming.routines)if(!existingRoutines.has(x.id)){copy.routines.push(x);existingRoutines.add(x.id)}
   for(const x of incoming.logs){
    const row=copy.practiceLogs.find(y=>y.date===x.date);
    if(!row)copy.practiceLogs.push({...x});
    else {row.face=Math.max(Number(row.face)||0,x.face);row.voice=Math.max(Number(row.voice)||0,x.voice)}
   }
   copy.groupNames={...incoming.names,...copy.groupNames};
   copy.levelNames={...incoming.levels,...copy.levelNames};
   // Drain existing save queue before installing the merged snapshot.
   await queue.current.catch(()=>{});
   await saveFace(userId,copy);
   current.current=copy;setData(copy);setStatus('기기 저장');setIncoming(null);
  }catch(e){setImportError('저장 실패: '+e.message);setStatus('저장 실패')}
  finally{setImportBusy(false)}
 };
 const record=(category,seconds)=>{if(!['face','voice'].includes(category)||!Number.isFinite(seconds)||seconds<=0)return;const now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');update(d=>{let row=d.practiceLogs.find(x=>x.date===date);if(!row){row={date,face:0,voice:0};d.practiceLogs.push(row)}row[category]=Math.round(((row[category]||0)+seconds)*1000)/1000})};
 const recorder=useRef(record);recorder.current=record;
 const [running,setRunning]=useState(false),[seconds,setSeconds]=useState(0);
 const clock=useRef({elapsed:0,started:0,accounted:0,kind:'face',running:false});
 const elapsed=()=>clock.current.elapsed+(clock.current.running?(Date.now()-clock.current.started)/1000:0);
 const flush=()=>{const total=elapsed(),delta=total-clock.current.accounted;if(delta>0){recorder.current(clock.current.kind,delta);clock.current.accounted=total}};
 useEffect(()=>{if(!running)return;const tick=setInterval(()=>setSeconds(Math.floor(elapsed())),250),save=setInterval(flush,5000);return()=>{clearInterval(tick);clearInterval(save)}},[running]);
 useEffect(()=>{const save=()=>flush();window.addEventListener('pagehide',save);return()=>{flush();window.removeEventListener('pagehide',save)}},[]);
 const toggle=()=>{if(clock.current.running){flush();clock.current.elapsed=elapsed();clock.current.running=false;setRunning(false)}else{clock.current.started=Date.now();clock.current.kind=kind;clock.current.running=true;setRunning(true)}};
 const selectKind=value=>{flush();clock.current.kind=value;setKind(value)};
 const reset=()=>{flush();clock.current.elapsed=0;clock.current.accounted=0;clock.current.started=Date.now();setSeconds(0)};
 const label=group=>data.groupNames?.['face:'+group.id]||group.name;
 const timerGroup=groups.find(g=>/^(timer|타이머|루틴\s*타이머)$/i.test(label(g).trim()))?.id||'bodyweight';
 const isTimer=tab===timerGroup;
 const source=()=>groups.find(g=>g.id!==timerGroup&&(kind==='face'?/^(face|페이스|얼굴)$/i:/^(voice|보이스|음성)$/i).test(label(g).trim()))?.id||(kind==='face'?'massage':'stretch');
 const cancel=()=>{clearTimeout(press.current);press.current=null};
 const begin=g=>{cancel();long.current=false;press.current=setTimeout(()=>{long.current=true;setRename(g);setName(label(g))},550)};
 if(!ready)return <div className="face-care"><p role="status">{error||'Face Care 불러오는 중…'}</p></div>;
 return <div className="face-care">
  <div className="face-save" role="status">{status}</div><div className="face-import-tools"><button type="button" onClick={()=>importRef.current?.click()}><Upload size={15}/> Body Care v2 기록 가져오기</button><input ref={importRef} type="file" accept=".json,application/json" hidden onChange={e=>{const f=e.target.files?.[0];e.target.value="";chooseBackup(f)}}/></div>{importError&&<p role="alert" className="face-import-error">{importError}</p>}{incoming&&<div className="face-import-preview"><strong>이전 파일 미리보기</strong><p>Face 카드 {incoming.items.length}개 · 루틴 {incoming.routines.length}개 · 날짜별 기록 {incoming.logs.length}일</p><p>새 카드 {importCounts()?.items}개 · 새 루틴 {importCounts()?.routines}개 · 새 날짜 {importCounts()?.logs}일 · 겹치는 날짜 {importCounts()?.overlap}일</p><small>같은 ID는 현재 값을 유지하고, 같은 날짜 운동 시간은 더 큰 값을 유지해 중복 합산을 막아. 원본은 수정하지 않아. 가져오기 직전 Beauty Care 백업 JSON도 다운로드돼.</small><div className="face-import-actions"><button disabled={importBusy} onClick={()=>setIncoming(null)}>취소</button><button disabled={importBusy} onClick={mergeBackup}><Download size={14}/> {importBusy?"저장 중…":"백업 후 병합"}</button></div></div>}{error&&<p role="alert">{error}</p>}
  <div className={'content care-content'+(tab==='stretch'?' voice-library-theme':'')}>
   {tab==='machine'?<PracticeRecords logs={data.practiceLogs} area="face"/>:isTimer?<div className="body-timer-page"><div className="body-timer-sticky"><h1 className="body-timer-title">Timer</h1><div className="body-stopwatch"><span className="body-stopwatch-time" role="timer">{[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(x=>String(x).padStart(2,'0')).join(':')}</span><button className="body-stopwatch-play" aria-label={running?'초시계 일시정지':'초시계 시작'} onClick={toggle}>{running?<Pause size={20}/>:<Play size={20}/>}</button><button className="body-stopwatch-reset" aria-label="초시계 초기화" onClick={reset}><RotateCcw size={17}/></button></div></div><div className="body-timer-subtabs" role="tablist" aria-label="타이머 종류">{['face','voice'].map(id=><button key={id} role="tab" aria-selected={kind===id} className={kind===id?'active '+id:''} onClick={()=>selectKind(id)}>{id==='face'?'Face':'Voice'}</button>)}</div><RoutineTimer key={kind+':'+source()} data={data} onUpdate={update} area="face" group={source()} theme={kind} userId={'beauty-face:'+userId} onRecordSeconds={record} embedded/></div>:<CareLibrary data={data} onUpdate={update} area="face" group={tab} sync={status} database={photos} userId={userId}/>}
  </div>
  <nav className="bottom-nav" aria-label="Face Care 카테고리">{groups.map(g=><button key={g.id} className={tab===g.id?'active':''} onPointerDown={()=>begin(g)} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={e=>{e.preventDefault();cancel();long.current=true;setRename(g);setName(label(g))}} onClick={()=>{if(long.current){long.current=false;return}setTab(g.id)}}>{g.id==='machine'?'기록':label(g)}</button>)}</nav>
  {rename&&<div className="level-rename-backdrop" onClick={()=>setRename(null)}><form className="level-rename" role="dialog" aria-modal="true" aria-label="하단 카테고리 이름 변경" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();if(name.trim())update(d=>{d.groupNames['face:'+rename.id]=name.trim().slice(0,20)});setRename(null)}}><strong>하단 카테고리 이름 변경</strong><input autoFocus value={name} maxLength={20} aria-label="새 카테고리 이름" onChange={e=>setName(e.target.value)} required/><div className="rename-actions"><button type="button" onClick={()=>setRename(null)}>취소</button><button className="primary">저장</button></div></form></div>}
 </div>;
}
