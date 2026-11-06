import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Play,Pause,SkipBack,SkipForward,RotateCcw,Check,Save} from 'lucide-react';
import './CareTimer.css';
const fmt=n=>{const s=Math.max(0,Math.ceil(n));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const categories=[['face','얼굴'],['hair','헤어'],['body','바디'],['teeth','치아'],['grooming','제모']];
const colors=['#a581cd','#8065c2','#b59cdd','#9275c6','#cebdea','#6e61ac','#d5b7ea','#9c8cbe'];
const getSaved=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback}catch{return fallback}};
export default function CareTimer({items,userId,date,checks,onCheck}){
 const [category,setCategory]=useState('face');
 const list=useMemo(()=>items.filter(x=>!x.archived&&x.category===category&&x.kind==='check').sort((a,b)=>a.position-b.position),[items,category]);
 const key='beauty-care-timer-v1:'+userId+':'+category;
 const [settings,setSettings]=useState(()=>getSaved(key,{}));
 const [index,setIndex]=useState(0),[remaining,setRemaining]=useState(300),[playing,setPlaying]=useState(false),[finished,setFinished]=useState(false),[autoNext,setAutoNext]=useState(true),[tone,setTone]=useState(true);
 const deadline=useRef(0),tick=useRef(null),current=useRef(null);
 const steps=useMemo(()=>list.filter(i=>settings[i.id]?.enabled!==false).map(i=>({id:i.id,title:i.label,seconds:Math.max(5,Math.min(3600,Number(settings[i.id]?.seconds)||300))})),[list,settings]);
 const stepSignature=steps.map(s=>s.id+':'+s.seconds).join('|');
 useEffect(()=>{setSettings(getSaved(key,{}));setPlaying(false);setFinished(false);setIndex(0);setRemaining(300)},[key]);

 useEffect(()=>{setPlaying(false);setIndex(0);setFinished(false);setRemaining(steps[0]?.seconds||300)},[stepSignature,category]);
 const selected=steps[index];
 const beep=()=>{if(!tone)return;try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=880;gain.gain.setValueAtTime(.08,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.25);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.25);osc.onended=()=>ctx.close()}catch{}};
 const advance=()=>{beep();if(!selected)return;onCheck(selected.id,true);if(index>=steps.length-1){setPlaying(false);setFinished(true);setRemaining(0)}else{setIndex(v=>v+1);setRemaining(steps[index+1].seconds);if(!autoNext)setPlaying(false)}};
 current.current=advance;
 useEffect(()=>{if(!playing||finished||!selected)return;deadline.current=performance.now()+remaining*1000;tick.current=setInterval(()=>{const left=Math.max(0,(deadline.current-performance.now())/1000);if(left<=0){clearInterval(tick.current);tick.current=null;current.current?.()}else setRemaining(left)},100);return()=>{clearInterval(tick.current);tick.current=null}},[playing,index,finished]);
 const toggle=()=>{if(!steps.length)return;if(finished){setIndex(0);setRemaining(steps[0].seconds);setFinished(false);setPlaying(true)}else if(playing){setRemaining(Math.max(0,(deadline.current-performance.now())/1000));setPlaying(false)}else setPlaying(true)};
 const jump=n=>{setPlaying(false);setFinished(false);const pos=Math.max(0,Math.min(steps.length-1,n));setIndex(pos);setRemaining(steps[pos]?.seconds||300)};
 const updateSetting=(id,patch)=>{setSettings(v=>{const next={...v,[id]:{...v[id],...patch}};try{localStorage.setItem(key,JSON.stringify(next))}catch{}return next})};
 const total=steps.reduce((n,s)=>n+s.seconds,0),elapsed=finished?total:steps.slice(0,index).reduce((n,s)=>n+s.seconds,0)+(selected?selected.seconds-remaining:0);
 const radius=96,circ=2*Math.PI*radius;
 return <div className="careTimer">
   <div className="seg manageTabs">{categories.map(([id,name])=><button type="button" key={id} className={category===id?'active':''} onClick={()=>setCategory(id)}>{name}</button>)}</div>
   <section className="contentSection"><div className="sectionTitle"><strong>관리 루틴</strong><span>{steps.length}개 항목 · 총 {fmt(total)}</span></div>
     <p className="careTimerHint">관리 탭의 체크리스트와 연결돼요. 완료한 항목은 선택한 날짜에 자동으로 체크됩니다.</p>
     {list.length?<div className="careTimerPicker">{list.map(item=><div className="careTimerPickRow" key={item.id}>
       <label><input type="checkbox" checked={settings[item.id]?.enabled!==false} onChange={e=>updateSetting(item.id,{enabled:e.target.checked})}/><span>{item.label}</span></label>
       <input aria-label={item.label+' 타이머 초'} type="number" inputMode="numeric" min="5" max="3600" value={settings[item.id]?.seconds??300} onChange={e=>updateSetting(item.id,{seconds:Math.max(5,Math.min(3600,Number(e.target.value)||5))})}/><small>초</small>
     </div>)}</div>:<p className="careTimerHint">관리 → {categories.find(x=>x[0]===category)?.[1]}에서 체크리스트 항목을 먼저 추가해 주세요.</p>}
   </section>
   {!!steps.length&&<section className="contentSection">
    <div className="careTimerPie"><svg viewBox="0 0 240 240" aria-label="단계별 원형 타이머">
     {steps.map((s,i)=>{const before=steps.slice(0,i).reduce((n,x)=>n+x.seconds,0)/total;return <circle key={s.id} cx="120" cy="120" r={radius} fill="none" stroke={colors[i%colors.length]} strokeWidth="32" strokeDasharray={Math.max(0,circ*s.seconds/total-3)+' '+circ} strokeDashoffset={-circ*before} transform="rotate(-90 120 120)" opacity={i<index||finished?.2:.95}/>})}
     <circle cx="120" cy="120" r="67" fill="none" stroke={colors[index%colors.length]} strokeWidth="8" strokeDasharray={2*Math.PI*67*Math.max(0,Math.min(1,remaining/(selected?.seconds||1)))+' 421'} transform="rotate(-90 120 120)"/>
    </svg><div className="careTimerCenter"><strong>{finished?'루틴 완료!':selected?.title}</strong><b>{fmt(remaining)}</b></div></div>
    <div className="careTimerNext">{finished?'모든 관리 완료':index+1<steps.length?'다음 · '+steps[index+1].title:'마지막 관리'}</div>
    <div className="careTimerControls"><button onClick={()=>jump(index-1)} aria-label="이전"><SkipBack size={20}/></button><button className="primary" onClick={toggle}>{playing?<Pause size={18}/>:<Play size={18}/>} {playing?'일시정지':finished?'다시 시작':'시작'}</button><button onClick={()=>jump(index+1)} aria-label="다음"><SkipForward size={20}/></button><button onClick={()=>jump(0)} aria-label="초기화"><RotateCcw size={18}/></button></div>
    <div className="careTimerOptions"><label><input type="checkbox" checked={autoNext} onChange={e=>setAutoNext(e.target.checked)}/> 자동 다음</label><label><input type="checkbox" checked={tone} onChange={e=>setTone(e.target.checked)}/> 알림음</label><span>진행 {fmt(elapsed)}</span></div>
    <div className="careTimerSteps">{steps.map((s,i)=><button key={s.id} className={'careTimerStep '+(i===index&&!finished?'active':'')} onClick={()=>jump(i)}><i style={{background:colors[i%colors.length]}}/><span>{checks?.[s.id]?'✓ ':''}{s.title}</span><small>{fmt(s.seconds)}</small><Check size={16} opacity={checks?.[s.id]?1:.2}/></button>)}</div>
   </section>}
 </div>
}
