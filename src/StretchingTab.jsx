import React,{useState,useEffect} from 'react';
import {ChevronDown,ChevronUp,Link2,ExternalLink,Trash2,Plus} from 'lucide-react';
import './StretchingTab.css';
const drills=[{"id":1,"en":"Body Scan","ko":"신체 긴장 관찰"},{"id":51,"en":"Breathe","ko":"호흡"},{"id":2,"en":"Head Massage","ko":"헤드 마사지"},{"id":3,"en":"Jaw & Neck Release","ko":"턱 목 이완"},{"id":4,"en":"Shoulder Release","ko":"어깨 이완"},{"id":5,"en":"Scapular Release","ko":"견갑 이완"},{"id":6,"en":"Thoracic Mobility","ko":"흉추 가동성"},{"id":7,"en":"Easy Onset","ko":"부드러운 발성 시작"},{"id":8,"en":"Straw Phonation","ko":"빨대 발성"},{"id":9,"en":"Gentle Humming","ko":"허밍"},{"id":10,"en":"Comfortable Tone","ko":"편안한 지속 발성"},{"id":11,"en":"Lip Trill","ko":"입술 트릴"},{"id":12,"en":"Cup Bubble Phonation","ko":"물컵 발성"},{"id":13,"en":"Pitch Glide","ko":"음높이 이동"},{"id":14,"en":"Three-Pitch Pattern","ko":"3단 음높이"},{"id":15,"en":"Soft-Medium Voice","ko":"음량 전환"},{"id":16,"en":"M-N-NG Transition","ko":"비음 전환"},{"id":17,"en":"Humming to Vowel","ko":"허밍·모음 연결"},{"id":18,"en":"Resonant Syllables","ko":"공명 음절"},{"id":19,"en":"Resonant Sentences","ko":"공명 문장"},{"id":20,"en":"Voice-to-Speech","ko":"발성에서 말하기 연결"},{"id":21,"en":"Vowel Precision","ko":"모음 정확도"},{"id":22,"en":"Consonant Contrast","ko":"자음 구별"},{"id":23,"en":"Final Consonants","ko":"받침 발음"},{"id":24,"en":"Tongue Placement","ko":"혀의 위치"},{"id":25,"en":"Tongue Twisters","ko":"잰말놀이"},{"id":26,"en":"Rising-Falling Intonation","ko":"상승·하강 억양"},{"id":27,"en":"Contrastive Stress","ko":"강세 전환"},{"id":28,"en":"Rhythm Reading","ko":"리듬 낭독"},{"id":29,"en":"Tempo Variation","ko":"속도 조절"},{"id":30,"en":"Semantic Pausing","ko":"의미 단위 쉼"},{"id":31,"en":"Volume Scale","ko":"음량 조절"},{"id":32,"en":"Projection Without Shouting","ko":"소리 지르지 않는 투사"},{"id":33,"en":"Clear Speech","ko":"명료한 말하기"},{"id":34,"en":"Key Message Delivery","ko":"핵심 메시지 전달"},{"id":35,"en":"Emotion Contrast","ko":"감정 변화"},{"id":36,"en":"Emotional Restraint","ko":"절제된 감정"},{"id":37,"en":"Action Verb Reading","ko":"행동 의도 표현"},{"id":38,"en":"Intention Shift","ko":"의도 전환"},{"id":39,"en":"Hidden Meaning","ko":"서브텍스트"},{"id":40,"en":"Character Vocal Profile","ko":"캐릭터 음성"},{"id":41,"en":"First-Sight Reading","ko":"초견 낭독"},{"id":42,"en":"News Anchor Reading","ko":"뉴스 리딩"},{"id":43,"en":"Numbers & Names","ko":"숫자·고유명사"},{"id":44,"en":"Studio Reading","ko":"마이크 리딩"},{"id":45,"en":"Narration Reading","ko":"내레이션"},{"id":46,"en":"Dialogue Exchange","ko":"대사 교환"},{"id":47,"en":"Monologue Delivery","ko":"독백"},{"id":48,"en":"Scene Objective","ko":"장면 목표"},{"id":49,"en":"One-Minute Speech","ko":"1분 스피치"},{"id":50,"en":"Voice Recording Review","ko":"녹음 비교 평가"}];
const LEVELS=[{id:1,label:'마사지'},{id:2,label:'이완'},{id:3,label:'폼롤러'},{id:4,label:'도구'},{id:5,label:'SNPE'}];
const MAX=3;
const key=id=>'beauty-stretch-videos-v1-'+id;
function ytId(text){
 try{
  const u=new URL(text.trim().replace(/^(?!https?:\/\/)/,'https://'));
  const host=u.hostname.toLowerCase();let id=null;
  if(host==='youtu.be')id=u.pathname.split('/')[1];
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1];
  return /^[\w-]{11}$/.test(id||'')?id:null;
 }catch{return null}
}
const clean=a=>Array.isArray(a)?a.filter(x=>typeof x==='string'&&/^[\w-]{11}$/.test(x)).slice(0,MAX):[];
function getLocal(user){
 try{const data=JSON.parse(localStorage.getItem(key(user))||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}
}
export default function StretchingTab({db,user}){
 const userId=user?.id||'guest';
 const[level,setLevel]=useState(1);
 const[opened,setOpened]=useState(null),[links,setLinks]=useState({}),[active,setActive]=useState({}),[message,setMessage]=useState(''),[cloud,setCloud]=useState(false);
 useEffect(()=>{
  let alive=true;setLinks(getLocal(userId));setCloud(false);
  if(!db||!user?.id)return;
  db.from('beauty_stretch_videos').select('exercise_id,videos').eq('user_id',user.id).then(({data,error})=>{
   if(!alive||error)return;
   const server={};for(const row of data||[])server[row.exercise_id]=clean(row.videos);
   const local=getLocal(userId),merged={...server};
   for(const[id,arr]of Object.entries(local))if(!(id in server))merged[id]=clean(arr);
   setLinks(merged);localStorage.setItem(key(userId),JSON.stringify(merged));setCloud(true);
   for(const[id,arr]of Object.entries(merged))if(!(id in server)&&arr.length)db.from('beauty_stretch_videos').upsert({user_id:user.id,exercise_id:Number(id),videos:arr},{onConflict:'user_id,exercise_id'}).then(()=>{});
  });
  return()=>{alive=false}
 },[db,userId]);
 const alertUser=msg=>{setMessage(msg);setTimeout(()=>setMessage(''),3200)};
 const save=(id,arr)=>{
  const next={...links,[id]:clean(arr)};setLinks(next);
  try{localStorage.setItem(key(userId),JSON.stringify(next))}catch{alertUser('브라우저 저장 공간을 확인해 줘.')}
  if(cloud&&user?.id)db.from('beauty_stretch_videos').upsert({user_id:user.id,exercise_id:id,videos:clean(arr)},{onConflict:'user_id,exercise_id'}).then(({error})=>{if(error)alertUser('기기에만 저장했어. 동기화 상태를 확인해 줘.')});
 };
 const add=(id,text)=>{
  const matches=text.match(/(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s,，]+/gi)||[text.trim()];
  const ids=matches.map(ytId).filter(Boolean);
  if(!ids.length){alertUser('올바른 유튜브 영상 주소를 붙여넣어 줘.');return false}
  const previous=clean(links[id]),fresh=[...new Set(ids)].filter(x=>!previous.includes(x)).slice(0,MAX-previous.length);
  if(!fresh.length){alertUser(previous.length===MAX?'영상은 최대 3개까지 등록 가능해.':'이미 등록된 영상이야.');return false}
  save(id,[...previous,...fresh]);setOpened(id);setActive(a=>({...a,[id]:previous.length}));alertUser('영상 '+fresh.length+'개 등록 완료');return true;
 };
 const addFromClipboard=async id=>{
  if(clean(links[id]).length>=MAX){setOpened(id);alertUser('영상은 최대 3개까지 등록 가능해.');return}
  try{
   if(!navigator.clipboard?.readText){alertUser('이 브라우저는 클립보드 자동 읽기를 지원하지 않아. 원본 앱에서 열어 줘.');return}
   const copied=await navigator.clipboard.readText();
   if(!copied?.trim()){alertUser('복사된 유튜브 링크가 없어. 먼저 링크를 복사해 줘.');return}
   add(id,copied);
  }catch{
   alertUser('클립보드 접근이 차단됐어. 브라우저 권한을 확인하거나 원본 앱에서 열어 줘.');
  }
 };
 const remove=(id,index)=>{
  if(!window.confirm('이 유튜브 영상 링크를 삭제할까?'))return;
  save(id,clean(links[id]).filter((_,i)=>i!==index));setActive(a=>({...a,[id]:0}));
 };
 const currentLevel=LEVELS.find(x=>x.id===level);
 const visibleDrills=drills.filter(item=>item.id===51?level===1:Math.ceil(item.id/10)===level);
 return <div className="stretching-page">
  <div className="stretching-levels" role="tablist" aria-label="스트레칭 단계">
   {LEVELS.map(item=><button type="button" role="tab" aria-selected={level===item.id} className={level===item.id?'active':''} key={item.id} onClick={()=>{setLevel(item.id);setOpened(null)}}><span>Lv.{item.id}</span><strong>{item.label}</strong></button>)}
  </div>
  <div className="stretching-list-heading"><strong>LEVEL {level} · {currentLevel.label}</strong><span>{visibleDrills.length} Drill</span></div>
  <div className="stretching-drills">{visibleDrills.map(item=>{
   const arr=clean(links[item.id]),expanded=opened===item.id,index=Math.min(active[item.id]||0,Math.max(0,arr.length-1));
   return <div className="stretching-drill" key={item.id}>
    <div className="stretching-drill-row">
     <button type="button" className="stretching-drill-toggle" aria-expanded={expanded} onClick={()=>setOpened(expanded?null:item.id)}>
      <span className="stretching-drill-number">{String(item.id===51?2:item.id>1?item.id+1:item.id).padStart(2,'0')}</span>
      <span className="stretching-drill-name"><strong>{item.en}</strong><small>{item.ko}</small></span>
      {expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
     </button>
     <button type="button" className="stretching-link-button" aria-label={item.en+' 유튜브 링크 추가'} onClick={()=>addFromClipboard(item.id)}><Link2 size={20}/></button>
    </div>
    {expanded&&<div className="stretching-video-detail">
     {arr.length?<>
      {arr.length>1&&<div className="stretching-video-switch">{arr.map((v,i)=><button key={v} className={i===index?'active':''} onClick={()=>setActive(a=>({...a,[item.id]:i}))}>영상 {i+1}</button>)}</div>}
      <div className="stretching-video-frame"><iframe title={item.en+' 영상'} key={arr[index]} src={'https://www.youtube-nocookie.com/embed/'+arr[index]} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen loading="lazy"/></div>
      <div className="stretching-video-actions">
       <a href={'https://www.youtube.com/watch?v='+arr[index]} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> 영상 열기</a>
       <button onClick={()=>remove(item.id,index)}><Trash2 size={15}/> 링크 삭제</button>
       {arr.length<MAX&&<button onClick={()=>addFromClipboard(item.id)}><Plus size={15}/> 영상 추가</button>}
      </div>
     </>:<div className="stretching-no-video"><strong>영상 링크 등록 대기</strong><span>오른쪽 링크 아이콘을 눌러 유튜브 주소를 등록해 줘.</span></div>}
    </div>}
   </div>
  })}</div>
  {message&&<div className="stretching-message" role="status">{message}</div>}

 </div>;
}