import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Play,Pause,RotateCcw} from 'lucide-react';
import CareLibrary from './CareLibrary.jsx';
import RoutineTimer from './RoutineTimer.jsx';
import PracticeRecords from './PracticeRecords.jsx';
import {loadFace,saveFace,photoStorage} from './storage.js';
import './BodyStyle.css';
import './FaceCare.css';
const fresh=()=>({version:1,items:[],routines:[],practiceLogs:[],levelNames:{'face:stretch':['기초','음정','음색','기교','표현']},groupNames:{'face:massage':'Face','face:stretch':'Voice','face:bodyweight':'Timer','face:machine':'기록'}});
const groups=[{id:'massage',name:'Face'},{id:'stretch',name:'Voice'},{id:'bodyweight',name:'Timer'},{id:'machine',name:'기록'}];
export default function FaceCare({userId}){
 const [data,setData]=useState(fresh),[ready,setReady]=useState(false),[status,setStatus]=useState('불러오는 중'),[error,setError]=useState('');
 const current=useRef(null),queue=useRef(Promise.resolve()),alive=useRef(true);
 const [tab,setTab]=useState('massage'),[kind,setKind]=useState('face'),[rename,setRename]=useState(null),[name,setName]=useState('');
 const press=useRef(null),long=useRef(false),photos=useMemo(photoStorage,[]);
 useEffect(()=>{alive.current=true;let live=true;loadFace(userId).then(saved=>{if(!live)return;const next=saved||fresh();current.current=next;setData(next);setReady(true);setStatus('기기 저장')}).catch(e=>{if(live)setError('기록 불러오기 실패: '+e.message)});return()=>{live=false;alive.current=false;clearTimeout(press.current);photos.dispose()}},[userId,photos]);
 const update=fn=>{if(!current.current)return;const next=structuredClone(current.current);fn(next);current.current=next;setData(next);setStatus('저장 중…');queue.current=queue.current.catch(()=>{}).then(()=>saveFace(userId,next)).then(()=>{if(alive.current)setStatus('기기 저장')}).catch(e=>{if(alive.current){setStatus('저장 실패');setError('기록 저장 실패 · JSON으로 백업해 주세요: '+e.message)}})};
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
  <div className="face-save" role="status">{status}</div>{error&&<p role="alert">{error}</p>}
  <div className={'content care-content'+(tab==='stretch'?' voice-library-theme':'')}>
   {tab==='machine'?<PracticeRecords logs={data.practiceLogs} area="face"/>:isTimer?<div className="body-timer-page"><div className="body-timer-sticky"><h1 className="body-timer-title">Timer</h1><div className="body-stopwatch"><span className="body-stopwatch-time" role="timer">{[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(x=>String(x).padStart(2,'0')).join(':')}</span><button className="body-stopwatch-play" aria-label={running?'초시계 일시정지':'초시계 시작'} onClick={toggle}>{running?<Pause size={20}/>:<Play size={20}/>}</button><button className="body-stopwatch-reset" aria-label="초시계 초기화" onClick={reset}><RotateCcw size={17}/></button></div></div><div className="body-timer-subtabs" role="tablist" aria-label="타이머 종류">{['face','voice'].map(id=><button key={id} role="tab" aria-selected={kind===id} className={kind===id?'active '+id:''} onClick={()=>selectKind(id)}>{id==='face'?'Face':'Voice'}</button>)}</div><RoutineTimer key={kind+':'+source()} data={data} onUpdate={update} area="face" group={source()} theme={kind} userId={'beauty-face:'+userId} onRecordSeconds={record} embedded/></div>:<CareLibrary data={data} onUpdate={update} area="face" group={tab} sync={status} database={photos} userId={userId}/>}
  </div>
  <nav className="bottom-nav" aria-label="Face Care 카테고리">{groups.map(g=><button key={g.id} className={tab===g.id?'active':''} onPointerDown={()=>begin(g)} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={e=>{e.preventDefault();cancel();long.current=true;setRename(g);setName(label(g))}} onClick={()=>{if(long.current){long.current=false;return}setTab(g.id)}}>{g.id==='machine'?'기록':label(g)}</button>)}</nav>
  {rename&&<div className="level-rename-backdrop" onClick={()=>setRename(null)}><form className="level-rename" role="dialog" aria-modal="true" aria-label="하단 카테고리 이름 변경" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();if(name.trim())update(d=>{d.groupNames['face:'+rename.id]=name.trim().slice(0,20)});setRename(null)}}><strong>하단 카테고리 이름 변경</strong><input autoFocus value={name} maxLength={20} aria-label="새 카테고리 이름" onChange={e=>setName(e.target.value)} required/><div className="rename-actions"><button type="button" onClick={()=>setRename(null)}>취소</button><button className="primary">저장</button></div></form></div>}
 </div>;
}
