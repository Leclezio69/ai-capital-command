/* ── AI Capital Command · Narrator ──
   ElevenLabs cloned-voice narration with transcript bar,
   generation tracking, and browser-TTS fallback.            */

let narrating=false,activeAudio=null,narGeneration=0,narAbort=null,activeUtterance=null;
let trActive=false,trWordEls=[],trCurrentIdx=-1,trAnimFrame=0;

function $(id){return document.getElementById(id)}
function stripHTML(s){return s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}

/* ── transcript bar ── */
function trShow(words){
  const bar=$('transcript-bar'),tw=$('tr-words');
  if(!bar||!tw)return;
  bar.classList.add('active');trActive=true;
  tw.innerHTML=words.map(w=>`<span class="tw">${w}</span>`).join('');
  trWordEls=[...tw.querySelectorAll('.tw')];trCurrentIdx=-1;
}
function trHighlight(idx){
  if(idx<0||idx>=trWordEls.length)return;
  trWordEls.forEach((el,i)=>{
    el.classList.remove('current','near');
    if(i===idx)el.classList.add('current');
    else if(Math.abs(i-idx)<=3)el.classList.add('near');
  });
  trCurrentIdx=idx;
  const el=trWordEls[idx],container=el.parentElement.parentElement;
  const offset=el.offsetLeft+el.offsetWidth/2-container.offsetWidth/2;
  $('tr-words').style.transform=`translateX(${-offset}px)`;
  $('tr-words').style.transition='transform .18s ease';
}
function trHide(){
  const bar=$('transcript-bar');
  if(bar)bar.classList.remove('active');
  trActive=false;
  const tw=$('tr-words');if(tw)tw.innerHTML='';
  trCurrentIdx=-1;
}

/* ── stop ── */
function stopNarration(){
  narGeneration++;
  if('speechSynthesis'in window)speechSynthesis.cancel();
  activeUtterance=null;
  clearTimeout(trAnimFrame);
  if(narAbort){try{narAbort.abort()}catch(e){};narAbort=null}
  if(activeAudio){try{activeAudio.pause();activeAudio.currentTime=0;activeAudio.src=''}catch(e){};activeAudio=null}
  narrating=false;trHide();
  updateNarratorBtn();
}

/* ── browser TTS fallback ── */
function narrateBrowser(text,words,cb,gen){
  if(gen===undefined)gen=narGeneration;
  if(!('speechSynthesis'in window)||gen!==narGeneration){trHide();return}
  speechSynthesis.cancel();
  setTimeout(()=>{
    if(gen!==narGeneration)return;
    narrating=true;trShow(words);updateNarratorBtn();
    const u=new SpeechSynthesisUtterance(text);
    u.rate=.88;u.pitch=.86;
    activeUtterance=u;
    let wordIdx=0;
    u.onboundary=e=>{
      if(gen!==narGeneration){speechSynthesis.cancel();return}
      if(e.name==='word'){trHighlight(wordIdx);wordIdx++}
    };
    u.onend=()=>{if(gen!==narGeneration)return;narrating=false;activeUtterance=null;updateNarratorBtn();if(cb)cb();setTimeout(trHide,1200)};
    u.onerror=()=>{if(gen!==narGeneration)return;narrating=false;activeUtterance=null;updateNarratorBtn();trHide()};
    speechSynthesis.speak(u);
  },50);
}

/* ── main narrate ── */
function narrateText(text,cb){
  stopNarration();narrating=true;updateNarratorBtn();
  const gen=narGeneration;
  const words=text.split(/\s+/).filter(w=>w.length>0);
  trShow(words);
  narAbort=new AbortController();
  fetch('/api/tts',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({text}),
    signal:narAbort.signal
  })
  .then(res=>{if(!res.ok)throw new Error();return res.blob()})
  .then(blob=>{
    if(gen!==narGeneration)return;
    const audio=new Audio(URL.createObjectURL(blob));
    activeAudio=audio;
    const estDuration=words.length*0.28;
    audio.onplay=()=>{
      let i=0;
      const step=()=>{
        if(gen!==narGeneration||!trActive||i>=words.length){
          if(gen===narGeneration){narrating=false;activeAudio=null;updateNarratorBtn();setTimeout(trHide,800)}
          return;
        }
        trHighlight(i);i++;
        const interval=(audio.duration||estDuration)/words.length*1000;
        trAnimFrame=setTimeout(step,interval);
      };
      step();
    };
    audio.onended=()=>{
      if(gen!==narGeneration)return;
      clearTimeout(trAnimFrame);narrating=false;activeAudio=null;updateNarratorBtn();
      if(cb)cb();setTimeout(trHide,1200);
    };
    audio.onerror=()=>{
      if(gen!==narGeneration)return;
      narrating=false;activeAudio=null;updateNarratorBtn();trHide();
      narrateBrowser(text,words,cb,gen);
    };
    audio.play().catch(()=>{
      if(gen!==narGeneration)return;
      narrating=false;activeAudio=null;updateNarratorBtn();trHide();
    });
  })
  .catch(e=>{
    if(gen!==narGeneration||e.name==='AbortError')return;
    narrating=false;updateNarratorBtn();
    narrateBrowser(text,words,cb,gen);
  });
}

/* ── narrator button ── */
function updateNarratorBtn(){
  const b=$('narrator-btn');if(!b)return;
  b.classList.toggle('speaking',narrating);
  b.title=narrating?'Stop narration':'Narration';
  b.innerHTML=narrating
    ?'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
    :'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
}

function toggleNarration(){
  if(narrating)stopNarration();
}

/* ── bind data-narrate buttons ── */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-narrate]').forEach(b=>{
    b.addEventListener('click',()=>narrateText(b.dataset.narrate));
  });
});
