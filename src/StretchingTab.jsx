import React,{useState} from 'react';
import {ChevronDown,ChevronUp} from 'lucide-react';
import './StretchingTab.css';

// Static titles copied from Voice Flow's five levels; no links, media or backend records.
const levels=[{"id":1,"title":"기초","items":[{"id":1,"en":"Body Scan","ko":"신체 긴장 관찰"},{"id":2,"en":"Head Massage","ko":"헤드 마사지"},{"id":3,"en":"Jaw & Neck Release","ko":"턱 목 이완"},{"id":4,"en":"Shoulder Release","ko":"어깨 이완"},{"id":5,"en":"Scapular Release","ko":"견갑 이완"},{"id":6,"en":"Thoracic Mobility","ko":"흉추 가동성"},{"id":7,"en":"Easy Onset","ko":"부드러운 발성 시작"},{"id":8,"en":"Straw Phonation","ko":"빨대 발성"},{"id":9,"en":"Gentle Humming","ko":"허밍"},{"id":10,"en":"Comfortable Tone","ko":"편안한 지속 발성"}]},{"id":2,"title":"제어","items":[{"id":11,"en":"Lip Trill","ko":"입술 트릴"},{"id":12,"en":"Cup Bubble Phonation","ko":"물컵 발성"},{"id":13,"en":"Pitch Glide","ko":"음높이 이동"},{"id":14,"en":"Three-Pitch Pattern","ko":"3단 음높이"},{"id":15,"en":"Soft-Medium Voice","ko":"음량 전환"},{"id":16,"en":"M-N-NG Transition","ko":"비음 전환"},{"id":17,"en":"Humming to Vowel","ko":"허밍·모음 연결"},{"id":18,"en":"Resonant Syllables","ko":"공명 음절"},{"id":19,"en":"Resonant Sentences","ko":"공명 문장"},{"id":20,"en":"Voice-to-Speech","ko":"발성에서 말하기 연결"}]},{"id":3,"title":"발음","items":[{"id":21,"en":"Vowel Precision","ko":"모음 정확도"},{"id":22,"en":"Consonant Contrast","ko":"자음 구별"},{"id":23,"en":"Final Consonants","ko":"받침 발음"},{"id":24,"en":"Tongue Placement","ko":"혀의 위치"},{"id":25,"en":"Tongue Twisters","ko":"잰말놀이"},{"id":26,"en":"Rising-Falling Intonation","ko":"상승·하강 억양"},{"id":27,"en":"Contrastive Stress","ko":"강세 전환"},{"id":28,"en":"Rhythm Reading","ko":"리듬 낭독"},{"id":29,"en":"Tempo Variation","ko":"속도 조절"},{"id":30,"en":"Semantic Pausing","ko":"의미 단위 쉼"}]},{"id":4,"title":"표현","items":[{"id":31,"en":"Volume Scale","ko":"음량 조절"},{"id":32,"en":"Projection Without Shouting","ko":"소리 지르지 않는 투사"},{"id":33,"en":"Clear Speech","ko":"명료한 말하기"},{"id":34,"en":"Key Message Delivery","ko":"핵심 메시지 전달"},{"id":35,"en":"Emotion Contrast","ko":"감정 변화"},{"id":36,"en":"Emotional Restraint","ko":"절제된 감정"},{"id":37,"en":"Action Verb Reading","ko":"행동 의도 표현"},{"id":38,"en":"Intention Shift","ko":"의도 전환"},{"id":39,"en":"Hidden Meaning","ko":"서브텍스트"},{"id":40,"en":"Character Vocal Profile","ko":"캐릭터 음성"}]},{"id":5,"title":"실전","items":[{"id":41,"en":"First-Sight Reading","ko":"초견 낭독"},{"id":42,"en":"News Anchor Reading","ko":"뉴스 리딩"},{"id":43,"en":"Numbers & Names","ko":"숫자·고유명사"},{"id":44,"en":"Studio Reading","ko":"마이크 리딩"},{"id":45,"en":"Narration Reading","ko":"내레이션"},{"id":46,"en":"Dialogue Exchange","ko":"대사 교환"},{"id":47,"en":"Monologue Delivery","ko":"독백"},{"id":48,"en":"Scene Objective","ko":"장면 목표"},{"id":49,"en":"One-Minute Speech","ko":"1분 스피치"},{"id":50,"en":"Voice Recording Review","ko":"녹음 비교 평가"}]}];

export default function StretchingTab(){
 const[level,setLevel]=useState(1);
 const[opened,setOpened]=useState(null);
 const current=levels.find(item=>item.id===level)||levels[0];
 return <div className="stretching-page">
  <div className="stretching-levels" role="tablist" aria-label="스트레칭 단계">
   {levels.map(item=><button type="button" role="tab" aria-selected={level===item.id} className={level===item.id?'active':''} key={item.id} onClick={()=>{setLevel(item.id);setOpened(null)}}><span>Lv.{item.id}</span><strong>{item.title}</strong></button>)}
  </div>
  <div className="stretching-level-heading"><strong>LEVEL {current.id} · {current.title}</strong><span>{current.items.length} Drill</span></div>
  <div className="stretching-drills">
   {current.items.map(item=><div className={'stretching-drill '+(opened===item.id?'expanded':'')} key={item.id}>
    <button type="button" className="stretching-drill-toggle" aria-expanded={opened===item.id} onClick={()=>setOpened(opened===item.id?null:item.id)}>
     <span className="stretching-drill-number">{String(item.id).padStart(2,'0')}</span>
     <span className="stretching-drill-name"><strong>{item.en}</strong><small>{item.ko}</small></span>
     {opened===item.id?<ChevronUp size={17}/>:<ChevronDown size={17}/>}
    </button>
    {opened===item.id&&<div className="stretching-drill-detail"><div><small>단계</small><span>Lv.{current.id} · {current.title}</span></div><div><small>동작</small><span>{item.en} · {item.ko}</span></div></div>}
   </div>)}
  </div>
 </div>
}
