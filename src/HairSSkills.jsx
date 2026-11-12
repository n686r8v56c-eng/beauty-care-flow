import React,{useCallback,useEffect,useRef,useState} from 'react';
import HairSCareLibrary from './HairSCareLibrary.jsx';
const DB='beauty-hairs-v1',STORE='records';
const fresh=(makeup=false)=>({items:[],levelNames:{'hairs:massage':makeup?['베이스','아이','립','윤곽','룩']:['기초','스타일링','커트','컬러','케어']}});
const open=()=>new Promise((ok,fail)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)});
async function operation(mode,fn){const db=await open();try{return await new Promise((ok,fail)=>{const tx=db.transaction(STORE,mode),r=fn(tx.objectStore(STORE));r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);tx.onerror=()=>fail(tx.error)})}finally{db.close()}}
export default function HairSSkills({userId}){const [data,setData]=useState(()=>fresh(userId.endsWith(':makeup'))),[loaded,setLoaded]=useState(false),[error,setError]=useState('');const ref=useRef(data),queue=useRef(Promise.resolve());const id='hairs-skills-library:'+userId;
 useEffect(()=>{let active=true;setLoaded(false);operation('readonly',s=>s.get(id)).then(row=>{if(!active)return;ref.current=row?.data||fresh(userId.endsWith(':makeup'));setData(ref.current);setLoaded(true)}).catch(e=>{if(active){setError(e.message);setLoaded(true)}});return()=>{active=false}},[id]);
 const update=useCallback(fn=>{const next=structuredClone(ref.current);fn(next);ref.current=next;setData(next);queue.current=queue.current.catch(()=>{}).then(()=>operation('readwrite',s=>s.put({id,userId,type:'hairs-skills-library',data:next}))).then(()=>setError('')).catch(e=>setError('저장 실패: '+e.message))},[id,userId]);
 if(!loaded)return <p>기술 목록 불러오는 중…</p>;
 return <div className="hairs-skills-library">{error&&<p role="alert" style={{color:'#b83c58'}}>{error}</p>}<HairSCareLibrary data={data} onUpdate={update} area="hairs" group="massage" hideHeading userId={userId}/></div>;
}
