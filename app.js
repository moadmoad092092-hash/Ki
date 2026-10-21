(() => {
  'use strict';
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startButton = document.getElementById('start-button');
  const statusEl = document.getElementById('game-status');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const soundButton = document.getElementById('sound-button');
  const W = 900, H = 520;
  let running = false, lane = 1, score = 0, distance = 0, speed = 0.24, lastTime = 0, spawnClock = 0, objects = [], stars = [], soundOn = false, audio;
  let best = 0;
  try { best = Number(localStorage.getItem('madar-best')) || 0; } catch (_) {}
  bestEl.textContent = String(best).padStart(3, '0');
  for (let i = 0; i < 75; i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:.2+Math.random()*.8});
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);draw();}
  function project(l,z){const t=Math.max(0,Math.min(1,z));const y=115+t*365;const center=W/2+(l-1)*t*350;const x=center;return {x,y,scale:.2+t*1.35};}
  function draw(){ctx.clearRect(0,0,W,H);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#0b1023');sky.addColorStop(1,'#11142a');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    for(const s of stars){ctx.globalAlpha=.25+s.z*.5;ctx.fillStyle='#c2ccff';ctx.fillRect((s.x+distance*s.z*16)%W,s.y,1+s.z,1+s.z)}ctx.globalAlpha=1;
    ctx.fillStyle='rgba(120,105,255,.08)';ctx.beginPath();ctx.ellipse(W/2,175,190,70,0,0,Math.PI*2);ctx.fill();
    const top=130,bottom=H;ctx.beginPath();ctx.moveTo(W/2-12,top);ctx.lineTo(W/2+12,top);ctx.lineTo(W/2+355,bottom);ctx.lineTo(W/2-355,bottom);ctx.closePath();ctx.fillStyle='#10152a';ctx.fill();
    ctx.strokeStyle='rgba(113,244,225,.22)';ctx.lineWidth=2;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(W/2+side*12,top);ctx.lineTo(W/2+side*355,bottom);ctx.stroke()}
    for(let divider of [-.5,.5]){ctx.strokeStyle='rgba(156,123,255,.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(W/2+divider*12,top);ctx.lineTo(W/2+divider*355,bottom);ctx.stroke()}
    for(let i=0;i<12;i++){let t=((i/12+distance*.1)%1);const y=top+t*(bottom-top);const half=12+t*343;ctx.strokeStyle=`rgba(113,244,225,${.05+t*.13})`;ctx.beginPath();ctx.moveTo(W/2-half,y);ctx.lineTo(W/2+half,y);ctx.stroke()}
    objects.slice().sort((a,b)=>a.z-b.z).forEach(o=>drawObject(o));drawPlayer();
  }
  function drawObject(o){const p=project(o.l,o.z),s=p.scale;if(o.type==='gem'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(distance*3+o.z*5)*.2);ctx.shadowColor='#71f4e1';ctx.shadowBlur=20*s;ctx.fillStyle='#71f4e1';ctx.beginPath();ctx.moveTo(0,-15*s);ctx.lineTo(11*s,0);ctx.lineTo(0,15*s);ctx.lineTo(-11*s,0);ctx.closePath();ctx.fill();ctx.fillStyle='#e4fff9';ctx.beginPath();ctx.moveTo(0,-9*s);ctx.lineTo(5*s,0);ctx.lineTo(0,8*s);ctx.lineTo(-4*s,0);ctx.fill();ctx.restore()}else{const w=30*s,h=36*s;ctx.shadowColor='rgba(255,115,155,.45)';ctx.shadowBlur=15*s;ctx.fillStyle='#ff739b';ctx.fillRect(p.x-w/2,p.y-h/2,w,h);ctx.shadowBlur=0;ctx.fillStyle='#361629';ctx.fillRect(p.x-w*.32,p.y-h*.32,w*.64,h*.64);ctx.fillStyle='rgba(255,255,255,.23)';ctx.fillRect(p.x-w/2,p.y-h/2,w,3*s)}}
  function drawPlayer(){const p=project(lane-1,.88),x=p.x,y=H-55;ctx.save();ctx.shadowColor='#71f4e1';ctx.shadowBlur=25;ctx.fillStyle='#71f4e1';ctx.beginPath();ctx.moveTo(x,y-28);ctx.lineTo(x+18,y+12);ctx.lineTo(x,y+5);ctx.lineTo(x-18,y+12);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f3fffd';ctx.beginPath();ctx.moveTo(x,y-17);ctx.lineTo(x+6,y+2);ctx.lineTo(x-6,y+2);ctx.fill();ctx.fillStyle='rgba(156,123,255,.7)';ctx.beginPath();ctx.moveTo(x-5,y+12);ctx.lineTo(x,y+27+Math.random()*7);ctx.lineTo(x+5,y+12);ctx.fill();ctx.restore()}
  function spawn(){const l=Math.floor(Math.random()*3)-1;objects.push({l,z:0,type:Math.random()<.63?'gem':'block',hit:false})}
  function move(d){if(!running)return;lane=Math.max(0,Math.min(2,lane+d));if(soundOn)beep(420,35)}
  function beep(freq,duration){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration/1000);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration/1000)}catch(_){}}
  function frame(time){if(!running)return;const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;distance+=dt*speed;speed=Math.min(.48,.24+score*.0007);spawnClock+=dt;if(spawnClock>Math.max(.48,1.12-score*.003)){spawn();spawnClock=0}
    for(const o of objects){o.z+=dt*speed;if(o.z>.78&&o.z<.94&&!o.hit){o.hit=true;if(o.l+1===lane){if(o.type==='gem'){score+=10;if(soundOn)beep(780,90)}else{endGame();return}}}}objects=objects.filter(o=>o.z<1.08);score+=dt*2;scoreEl.textContent=String(Math.floor(score)).padStart(3,'0');draw();requestAnimationFrame(frame)}
  function start(){score=0;distance=0;speed=.24;lane=1;spawnClock=0;objects=[];running=true;statusEl.textContent='الرحلة جارية';overlay.classList.add('hidden');lastTime=performance.now();requestAnimationFrame(frame)}
  function endGame(){running=false;const total=Math.floor(score);if(total>best){best=total;bestEl.textContent=String(best).padStart(3,'0');try{localStorage.setItem('madar-best',String(best))}catch(_){}}statusEl.textContent='انتهت الرحلة';document.getElementById('overlay-icon').textContent='✧';document.getElementById('overlay-kicker').textContent='انتهت الرحلة';document.getElementById('overlay-title').textContent='نتيجتك '+total;document.getElementById('overlay-text').textContent=total>=best?'رقم قياسي جديد! هل تستطيع تجاوز نتيجتك؟':'أحسنت المحاولة. جاهز لجولة جديدة؟';startButton.innerHTML='العب مجددًا <span aria-hidden="true">↻</span>';overlay.classList.remove('hidden');draw()}
  startButton.addEventListener('click',start);document.getElementById('left-button').addEventListener('pointerdown',e=>{e.preventDefault();move(-1)});document.getElementById('right-button').addEventListener('pointerdown',e=>{e.preventDefault();move(1)});
  addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')move(-1);if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')move(1);if((e.key==='Enter'||e.key===' ')&&!running&&!overlay.classList.contains('hidden')){e.preventDefault();start()}});
  let touchX=null;canvas.addEventListener('pointerdown',e=>{touchX=e.clientX});canvas.addEventListener('pointerup',e=>{if(touchX===null)return;const delta=e.clientX-touchX;if(Math.abs(delta)>25)move(delta<0?-1:1);touchX=null});
  soundButton.addEventListener('click',()=>{soundOn=!soundOn;soundButton.textContent='الصوت: '+(soundOn?'مُشغّل':'متوقف');soundButton.setAttribute('aria-pressed',String(soundOn));if(soundOn)beep(600,70)});
  addEventListener('resize',resize);resize();
})();