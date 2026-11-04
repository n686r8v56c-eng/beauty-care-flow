import React,{useState,useEffect,useRef} from 'react';
import {ChevronDown,ChevronUp,Link2,ExternalLink,Trash2,Plus,Pencil,ArrowUp,ArrowDown,RotateCcw,X} from 'lucide-react';
import './StretchingTab.css';
const drills=[{"id":1,"en":"Body Scan","ko":"신체 긴장 관찰"},{"id":51,"en":"Breathe","ko":"호흡"},{"id":2,"en":"Head Massage","ko":"헤드 마사지"},{"id":3,"en":"Jaw & Neck Release","ko":"턱 목 이완"},{"id":4,"en":"Shoulder Release","ko":"어깨 이완"},{"id":5,"en":"Scapular Release","ko":"견갑 이완"},{"id":6,"en":"Thoracic Mobility","ko":"흉추 가동성"},{"id":7,"en":"Easy Onset","ko":"부드러운 발성 시작"},{"id":8,"en":"Straw Phonation","ko":"빨대 발성"},{"id":9,"en":"Gentle Humming","ko":"허밍"},{"id":10,"en":"Comfortable Tone","ko":"편안한 지속 발성"},{"id":11,"en":"Lip Trill","ko":"입술 트릴"},{"id":12,"en":"Cup Bubble Phonation","ko":"물컵 발성"},{"id":13,"en":"Pitch Glide","ko":"음높이 이동"},{"id":14,"en":"Three-Pitch Pattern","ko":"3단 음높이"},{"id":15,"en":"Soft-Medium Voice","ko":"음량 전환"},{"id":16,"en":"M-N-NG Transition","ko":"비음 전환"},{"id":17,"en":"Humming to Vowel","ko":"허밍·모음 연결"},{"id":18,"en":"Resonant Syllables","ko":"공명 음절"},{"id":19,"en":"Resonant Sentences","ko":"공명 문장"},{"id":20,"en":"Voice-to-Speech","ko":"발성에서 말하기 연결"},{"id":21,"en":"Vowel Precision","ko":"모음 정확도"},{"id":22,"en":"Consonant Contrast","ko":"자음 구별"},{"id":23,"en":"Final Consonants","ko":"받침 발음"},{"id":24,"en":"Tongue Placement","ko":"혀의 위치"},{"id":25,"en":"Tongue Twisters","ko":"잰말놀이"},{"id":26,"en":"Rising-Falling Intonation","ko":"상승·하강 억양"},{"id":27,"en":"Contrastive Stress","ko":"강세 전환"},{"id":28,"en":"Rhythm Reading","ko":"리듬 낭독"},{"id":29,"en":"Tempo Variation","ko":"속도 조절"},{"id":30,"en":"Semantic Pausing","ko":"의미 단위 쉼"},{"id":31,"en":"Volume Scale","ko":"음량 조절"},{"id":32,"en":"Projection Without Shouting","ko":"소리 지르지 않는 투사"},{"id":33,"en":"Clear Speech","ko":"명료한 말하기"},{"id":34,"en":"Key Message Delivery","ko":"핵심 메시지 전달"},{"id":35,"en":"Emotion Contrast","ko":"감정 변화"},{"id":36,"en":"Emotional Restraint","ko":"절제된 감정"},{"id":37,"en":"Action Verb Reading","ko":"행동 의도 표현"},{"id":38,"en":"Intention Shift","ko":"의도 전환"},{"id":39,"en":"Hidden Meaning","ko":"서브텍스트"},{"id":40,"en":"Character Vocal Profile","ko":"캐릭터 음성"},{"id":41,"en":"First-Sight Reading","ko":"초견 낭독"},{"id":42,"en":"News Anchor Reading","ko":"뉴스 리딩"},{"id":43,"en":"Numbers & Names","ko":"숫자·고유명사"},{"id":44,"en":"Studio Reading","ko":"마이크 리딩"},{"id":45,"en":"Narration Reading","ko":"내레이션"},{"id":46,"en":"Dialogue Exchange","ko":"대사 교환"},{"id":47,"en":"Monologue Delivery","ko":"독백"},{"id":48,"en":"Scene Objective","ko":"장면 목표"},{"id":49,"en":"One-Minute Speech","ko":"1분 스피치"},{"id":50,"en":"Voice Recording Review","ko":"녹음 비교 평가"}];
const LEVELS=[{id:1,label:'마사지'},{id:2,label:'이완'},{id:3,label:'폼롤러'},{id:4,label:'도구'},{id:5,label:'SNPE'}];
const MAX=5;
// Catalog metadata lives in one reserved row of the *existing* authenticated video table.
// This avoids running new SQL for each catalog edit or for a new drill.
const CATALOG_ROW_ID=2147483000;
const catalogKey=id=>'beauty-stretch-catalog-v1-'+id;
const originalCatalog=drills.map((item,index)=>({...item,level:item.id===51?1:Math.ceil(item.id/10),sort:index,deleted:false}));
function sanitizeCatalog(items){
 if(!Array.isArray(items))return null;
 const found=new Set();
 return items.filter(x=>{
  const id=Number(x?.id);
  if(!Number.isSafeInteger(id)||id<=0||id===CATALOG_ROW_ID||found.has(id))return false;
  found.add(id);return true;
 }).map((x,i)=>({
  id:Number(x.id),en:String(x.en||'').slice(0,120),ko:String(x.ko||'').slice(0,120),
  level:Math.max(1,Math.min(5,Number(x.level)||1)),
  sort:Number.isFinite(Number(x.sort))?Number(x.sort):i,
  deleted:!!x.deleted
 }));
}
function readCatalog(userId){
 try{
  const value=JSON.parse(localStorage.getItem(catalogKey(userId))||'null');
  return sanitizeCatalog(value);
 }catch{return null}
}
function cacheCatalog(userId,items){
 try{localStorage.setItem(catalogKey(userId),JSON.stringify(items))}catch{}
}

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
// Merge cloud and this device without allowing an empty cloud row to hide saved local bookmarks.
const mergeVideos=(server,local)=>{
 const out={};
 for(const id of new Set([...Object.keys(local||{}),...Object.keys(server||{})])){
  const cloudList=clean(server?.[id]),deviceList=clean(local?.[id]);
  const primary=deviceList.length>cloudList.length?deviceList:cloudList;
  const secondary=primary===deviceList?cloudList:deviceList;
  const merged=[...new Set([...primary,...secondary])].slice(0,MAX);
  if(merged.length)out[id]=merged;
 }
 return out;
};
function getLocal(user){
 try{const data=JSON.parse(localStorage.getItem(key(user))||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}
}
export default function StretchingTab({db,user}){
 const userId=user?.id||'guest';
 const[level,setLevel]=useState(1);
 const[catalog,setCatalog]=useState(originalCatalog);
 const[catalogReady,setCatalogReady]=useState(false);
 const[catalogCloud,setCatalogCloud]=useState(false);
 const[editingMode,setEditingMode]=useState(false);
 const[showDeleted,setShowDeleted]=useState(false);
 const[editor,setEditor]=useState(null);
 const[draft,setDraft]=useState({en:'',ko:'',level:1});
 const[opened,setOpened]=useState(null),[links,setLinks]=useState({}),[active,setActive]=useState({}),[message,setMessage]=useState(''),[cloud,setCloud]=useState(false);
 const latestLinks=useRef(getLocal(userId));
  const pendingSaves=useRef({});
  const[showRecovery,setShowRecovery]=useState(false);
 const[cloudError,setCloudError]=useState('');
 useEffect(()=>{
  let alive=true;const cached=getLocal(userId);latestLinks.current=cached;setLinks(cached);setCloud(false);setCloudError('');
  if(!db||!user?.id)return;
  db.from('beauty_stretch_videos').select('exercise_id,videos').eq('user_id',user.id).then(async({data,error})=>{
   if(!alive)return;
   if(error){setCloudError('클라우드 영상 목록을 읽지 못했어. 기기 기록은 유지하고 있어.');return;}
   const server={};for(const row of data||[])if(row.exercise_id!==CATALOG_ROW_ID)server[row.exercise_id]=clean(row.videos);
   const local=mergeVideos(getLocal(userId),latestLinks.current);
   const merged=mergeVideos(server,local);
   latestLinks.current=merged;setLinks(merged);
   try{localStorage.setItem(key(userId),JSON.stringify(merged))}catch{}
   setCloud(true);
   const dirtyIds=new Set([...Object.keys(pendingSaves.current),...Object.keys(merged)]);
   pendingSaves.current={};
   for(const id of dirtyIds){
    const next=clean(merged[id]),remote=clean(server[id]);
    if(!next.length||JSON.stringify(next)===JSON.stringify(remote))continue;
    const {error:writeError}=await db.from('beauty_stretch_videos').upsert({user_id:user.id,exercise_id:Number(id),videos:next},{onConflict:'user_id,exercise_id'});
    if(writeError&&alive)setCloudError('일부 영상이 이 기기에만 저장됐어. 연결 상태를 확인해 줘.');
   }
  });
  return()=>{alive=false}
 },[db,userId]);
 useEffect(()=>{
  let alive=true;
  const local=readCatalog(userId);
  setCatalog(local||originalCatalog);setCatalogReady(false);setCatalogCloud(false);
  if(!db||!user?.id){setCatalogReady(true);return()=>{alive=false};}
  const query=db.from('beauty_stretch_videos').select('videos')
   .eq('user_id',user.id).eq('exercise_id',CATALOG_ROW_ID).maybeSingle();
  query.then(async({data,error})=>{
   if(!alive)return;
   if(error){
    setCatalogReady(true);
    return;
   }
   const remote=data?.videos?.[0];
   if(remote?.kind==='stretch-catalog-v1'&&Array.isArray(remote.items)){
    const parsed=sanitizeCatalog(remote.items);
    if(parsed){
     setCatalog(parsed);cacheCatalog(userId,parsed);
     setCatalogCloud(true);setCatalogReady(true);
     return;
    }
   }
   const initial=local||originalCatalog;
   const result=await db.from('beauty_stretch_videos').upsert({
    user_id:user.id,exercise_id:CATALOG_ROW_ID,
    videos:[{kind:'stretch-catalog-v1',items:initial}]
   },{onConflict:'user_id,exercise_id'});
   if(!alive)return;
   if(!result.error)setCatalogCloud(true);
   setCatalogReady(true);
  });
  return()=>{alive=false};
 },[db,userId]);
 const persistCatalog=next=>{
  const sanitized=sanitizeCatalog(next);
  if(!sanitized)return;
  setCatalog(sanitized);cacheCatalog(userId,sanitized);
  if(db&&user?.id&&catalogCloud)db.from('beauty_stretch_videos').upsert({
   user_id:user.id,exercise_id:CATALOG_ROW_ID,
   videos:[{kind:'stretch-catalog-v1',items:sanitized}]
  },{onConflict:'user_id,exercise_id'}).then(({error})=>{
   if(error)alertUser('이 기기에만 저장됐어. 동기화 연결을 확인해 줘.');
  });
 };
 const openNew=()=>{setDraft({en:'',ko:'',level});setEditor({mode:'add'});};
 const openEdit=item=>{setDraft({en:item.en,ko:item.ko,level:item.level});setEditor({mode:'edit',id:item.id});};
 const submitItem=e=>{
  e.preventDefault();
  const en=draft.en.trim(),ko=draft.ko.trim(),target=Number(draft.level);
  if(!en&&!ko){alertUser('영문 또는 한글 이름을 입력해 줘.');return}
  if(editor?.mode==='edit'){
   const current=catalog.find(item=>item.id===editor.id);
   if(!current)return;
   const moving=current.level!==target;
   const tail=Math.max(-1,...catalog.filter(item=>item.level===target).map(item=>item.sort))+1;
   persistCatalog(catalog.map(item=>item.id===editor.id?{...item,en,ko,level:target,sort:moving?tail:item.sort}:item));
  }else{
   const used=new Set(catalog.map(item=>item.id));
   let id;
   do{id=52+Math.floor(Math.random()*2000000000)}while(used.has(id)||id===CATALOG_ROW_ID);
   const sort=Math.max(-1,...catalog.filter(item=>item.level===target).map(item=>item.sort))+1;
   persistCatalog([...catalog,{id,en,ko,level:target,sort,deleted:false}]);
  }
  setLevel(target);setEditor(null);alertUser('동작 목록을 저장했어.');
 };
 const changePosition=(item,direction)=>{
  const rows=catalog.filter(x=>x.level===item.level&&!x.deleted).sort((a,b)=>a.sort-b.sort);
  const at=rows.findIndex(x=>x.id===item.id),other=rows[at+direction];
  if(!other)return;
  persistCatalog(catalog.map(x=>x.id===item.id?{...x,sort:other.sort}:x.id===other.id?{...x,sort:item.sort}:x));
 };
 const archiveItem=item=>{
  if(!window.confirm(item.en+' 동작을 목록에서 삭제할까? 저장된 영상 링크는 복구를 위해 유지돼.'))return;
  persistCatalog(catalog.map(x=>x.id===item.id?{...x,deleted:true}:x));
  if(opened===item.id)setOpened(null);
  alertUser('목록에서 삭제했어. 편집 모드에서 복구할 수 있어.');
 };
 const restoreItem=item=>{
  persistCatalog(catalog.map(x=>x.id===item.id?{...x,deleted:false}:x));
  alertUser('동작을 복구했어.');
 };
 
 const alertUser=msg=>{setMessage(msg);setTimeout(()=>setMessage(''),3200)};
 const save=(id,arr)=>{
  const next={...latestLinks.current,[id]:clean(arr)};latestLinks.current=next;setLinks(next);
  try{localStorage.setItem(key(userId),JSON.stringify(next))}catch{alertUser('브라우저 저장 공간을 확인해 줘.')}
  if(!cloud){pendingSaves.current[id]=clean(arr);alertUser('기기에 저장했어. 클라우드 동기화 확인 중이야.');return;}
  if(user?.id)db.from('beauty_stretch_videos').upsert({user_id:user.id,exercise_id:id,videos:clean(arr)},{onConflict:'user_id,exercise_id'}).then(({error})=>{if(error)alertUser('기기에만 저장했어. 동기화 상태를 확인해 줘.');else alertUser('클라우드 저장 완료');});
 };
 const add=(id,text)=>{
  const matches=text.match(/(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s,，]+/gi)||[text.trim()];
  const ids=matches.map(ytId).filter(Boolean);
  if(!ids.length){alertUser('올바른 유튜브 영상 주소를 붙여넣어 줘.');return false}
  const previous=clean(links[id]),fresh=[...new Set(ids)].filter(x=>!previous.includes(x)).slice(0,MAX-previous.length);
  if(!fresh.length){alertUser(previous.length===MAX?'영상은 최대 5개까지 등록 가능해.':'이미 등록된 영상이야.');return false}
  save(id,[...previous,...fresh]);setOpened(id);setActive(a=>({...a,[id]:previous.length}));alertUser('영상 '+fresh.length+'개 등록 완료');return true;
 };
 const copyVideoLink=async videoId=>{
  const url='https://www.youtube.com/watch?v='+videoId;
  try{
   if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(url);
   }else{
    const field=document.createElement('textarea');
    field.value=url;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';
    document.body.appendChild(field);field.select();
    const copied=document.execCommand('copy');field.remove();
    if(!copied)throw new Error('copy blocked');
   }
   alertUser('영상 링크를 복사했어.');
  }catch{
   alertUser('링크 복사가 차단됐어. 영상 열기로 주소를 복사해 줘.');
  }
 };
 const addFromClipboard=async id=>{
  if(clean(links[id]).length>=MAX){setOpened(id);alertUser('영상은 최대 5개까지 등록 가능해.');return}
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
 const recovered=Object.entries(links).filter(([id,arr])=>clean(arr).length&&id!==String(CATALOG_ROW_ID)).map(([id,arr])=>({id:Number(id),videos:clean(arr),item:catalog.find(x=>x.id===Number(id))}));
 const unattached=recovered.filter(x=>!x.item||x.item.deleted);
 const totalSavedVideos=recovered.reduce((count,x)=>count+x.videos.length,0);
 const currentLevel=LEVELS.find(x=>x.id===level);
 const ordered=catalog.filter(item=>!item.deleted).sort((a,b)=>a.level-b.level||a.sort-b.sort||a.id-b.id);
 const numberById=new Map(ordered.map((item,index)=>[item.id,index+1]));
 const visibleDrills=ordered.filter(item=>item.level===level);
 const archived=catalog.filter(item=>item.deleted).sort((a,b)=>a.level-b.level||a.sort-b.sort);
 return <div className="stretching-page">
  <div className="stretching-levels" role="tablist" aria-label="스트레칭 단계">
   {LEVELS.map(item=><button type="button" role="tab" aria-selected={level===item.id} className={level===item.id?'active':''} key={item.id} onClick={()=>{setLevel(item.id);setOpened(null)}}><span>Lv.{item.id}</span><strong>{item.label}</strong></button>)}
  </div>
  <div className="stretching-list-heading"><strong>LEVEL {level} · {currentLevel.label}</strong><div className="stretching-header-actions"><span>{visibleDrills.length} Drill</span><button type="button" onClick={openNew} disabled={!catalogReady} aria-label="동작 추가" title="동작 추가"><Plus size={17}/></button><button type="button" className={editingMode?'active':''} onClick={()=>setEditingMode(x=>!x)} disabled={!catalogReady}><Pencil size={15}/> 편집</button></div></div>
  <div className="stretching-drills">{visibleDrills.map(item=>{
   const arr=clean(links[item.id]),expanded=opened===item.id,index=Math.min(active[item.id]||0,Math.max(0,arr.length-1));
   return <div className="stretching-drill" key={item.id}>
    <div className="stretching-drill-row">
     <button type="button" className="stretching-drill-toggle" aria-expanded={expanded} onClick={()=>setOpened(expanded?null:item.id)}>
      <span className="stretching-drill-number">{String(numberById.get(item.id)).padStart(2,'0')}</span>
      <span className="stretching-drill-name"><strong>{item.en||item.ko}</strong>{item.ko&&item.en&&<small>{item.ko}</small>}</span>
      {expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
     </button>
     {editingMode&&<div className="stretching-edit-controls">
      <button type="button" aria-label="위로 이동" title="위로 이동" onClick={()=>changePosition(item,-1)}><ArrowUp size={15}/></button>
      <button type="button" aria-label="아래로 이동" title="아래로 이동" onClick={()=>changePosition(item,1)}><ArrowDown size={15}/></button>
      <button type="button" aria-label="동작 수정" title="동작 수정" onClick={()=>openEdit(item)}><Pencil size={15}/></button>
      <button type="button" aria-label="동작 삭제" title="동작 삭제" onClick={()=>archiveItem(item)}><Trash2 size={15}/></button>
     </div>}
     {!editingMode&&<button type="button" className="stretching-link-button" aria-label={item.en+' 유튜브 링크 추가'} onClick={()=>addFromClipboard(item.id)}><Link2 size={20}/></button>}
    </div>
    {expanded&&<div className="stretching-video-detail">
     {arr.length?<>
      {arr.length>1&&<div className="stretching-video-switch">{arr.map((v,i)=><button key={v} className={i===index?'active':''} onClick={()=>setActive(a=>({...a,[item.id]:i}))}>영상 {i+1}</button>)}</div>}
      <div className="stretching-video-frame"><iframe title={item.en+' 영상'} key={arr[index]} src={'https://www.youtube-nocookie.com/embed/'+arr[index]} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen loading="lazy"/></div>
      <div className="stretching-video-actions">
       <button type="button" onClick={()=>copyVideoLink(arr[index])}><Link2 size={15}/> 링크 복사</button>
       <a href={'https://www.youtube.com/watch?v='+arr[index]} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> 영상 열기</a>
       <button onClick={()=>remove(item.id,index)}><Trash2 size={15}/> 링크 삭제</button>
       {arr.length<MAX&&<button onClick={()=>addFromClipboard(item.id)}><Plus size={15}/> 영상 추가</button>}
      </div>
     </>:<div className="stretching-no-video"><strong>영상 링크 등록 대기</strong><span>오른쪽 링크 아이콘을 눌러 유튜브 주소를 등록해 줘.</span></div>}
    </div>}
   </div>
  })}</div>
  {editingMode&&archived.length>0&&<div className="stretching-archive">
   <button type="button" className="stretching-archive-toggle" onClick={()=>setShowDeleted(x=>!x)}>삭제한 목록 {archived.length}개 {showDeleted?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>
   {showDeleted&&archived.map(item=><div key={item.id} className="stretching-archived-row"><span>{item.en||item.ko} <small>{item.ko}</small></span><button type="button" onClick={()=>restoreItem(item)}><RotateCcw size={15}/> 복구</button></div>)}
  </div>}
  <section className="stretching-recovery">
    <button type="button" className="stretching-recovery-toggle" onClick={()=>setShowRecovery(v=>!v)} aria-expanded={showRecovery}>
     <span>저장된 영상 확인 · {recovered.length}개 동작 / {totalSavedVideos}개 링크</span>
     {showRecovery?<ChevronUp size={17}/>:<ChevronDown size={17}/>}
    </button>
    {showRecovery&&<div className="stretching-recovery-list">
      <p>현재 계정의 클라우드와 이 기기에서 읽은 유튜브 링크야. 목록에서 숨긴 동작의 링크도 확인할 수 있어. 링크를 새로 저장하거나 삭제하지 않아.</p>
      {!recovered.length&&<p>이 기기와 현재 연결된 계정에서 읽어 온 영상 링크가 없어. 다른 기기나 이전 앱 주소에 저장한 기록은 여기서 자동으로 읽지 못할 수 있어.</p>}
      {recovered.map(({id,item,videos})=><div className="stretching-recovery-row" key={id}>
        <strong>{item?.en||item?.ko||'이전 동작 #'+id}{item?.deleted?' (목록에서 숨김)':''}</strong>
        <div>{videos.map((v,i)=><a key={v} href={'https://www.youtube.com/watch?v='+v} target="_blank" rel="noopener noreferrer">영상 {i+1} <ExternalLink size={13}/></a>)}</div>
      </div>)}
      {unattached.length>0&&<p>현재 목록에서 보이지 않는 동작 {unattached.length}개에 영상이 남아 있어. 위 링크에서 확인할 수 있어.</p>}
    </div>}
  </section>
  {cloudError&&<div className="stretching-message" role="alert">{cloudError}</div>}
  {message&&<div className="stretching-message" role="status">{message}</div>}
  {!catalogCloud&&catalogReady&&<small className="stretching-sync-hint">현재 기기에 저장 중 · 로그인 계정 동기화 상태를 확인해 줘.</small>}
  {editor&&<div className="stretching-modal-backdrop" onClick={()=>setEditor(null)}>
   <form className="stretching-modal" role="dialog" aria-modal="true" aria-label={editor.mode==='add'?'동작 추가':'동작 수정'} onClick={e=>e.stopPropagation()} onSubmit={submitItem}>
    <div className="stretching-modal-title"><strong>{editor.mode==='add'?'동작 추가':'동작 수정'}</strong><button type="button" aria-label="닫기" onClick={()=>setEditor(null)}><X size={19}/></button></div>
    <label>영문 이름<input value={draft.en} onChange={e=>setDraft(d=>({...d,en:e.target.value}))} maxLength={120} placeholder="예: Body Scan" autoFocus/></label>
    <label>한글 이름<input value={draft.ko} onChange={e=>setDraft(d=>({...d,ko:e.target.value}))} maxLength={120} placeholder="예: 신체 긴장 관찰"/></label>
    <label>분류<select value={draft.level} onChange={e=>setDraft(d=>({...d,level:Number(e.target.value)}))}>{LEVELS.map(l=><option key={l.id} value={l.id}>Lv.{l.id} · {l.label}</option>)}</select></label>
    <button className="stretching-submit" type="submit">저장</button>
   </form>
  </div>}
 </div>;
}