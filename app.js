// División Perfecta – JS
const modeSelect = document.getElementById('modeSelect');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const playersCard = document.getElementById('playersCard');
const playersWrap = document.getElementById('playersWrap');
const genBtn = document.getElementById('genBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const optimizeBtn = document.getElementById('optimizeBtn');
const teamsSection = document.getElementById('teamsSection');
const teamAEl = document.getElementById('teamA');
const teamBEl = document.getElementById('teamB');
const errorsEl = document.getElementById('errors');
const diffHint = document.getElementById('diffHint');
const maxCounter = document.getElementById('maxCounter');
const counter = document.getElementById('counter');

function createRow(index){
  const wrap = document.createElement('div');
  wrap.className = 'player-item';
  const name = document.createElement('input');
  name.type = 'text'; name.placeholder = `Jugador ${index+1}`; name.ariaLabel = `Nombre jugador ${index+1}`;
  const score = document.createElement('input');
  score.type = 'number'; score.step = '0.01'; score.min = '1'; score.max = '10'; score.placeholder = 'Puntaje (1.00–10.00)';
  wrap.append(name, score);
  return wrap;
}

function renderInputs(total){
  playersWrap.innerHTML = '';
  for(let i=0;i<total;i++) playersWrap.appendChild(createRow(i));
  maxCounter.textContent = total;
  updateCounter();
  playersCard.hidden = false;
  teamsSection.hidden = true;
  errorsEl.textContent = '';
  // Focus first field for usability
  const first = playersWrap.querySelector('input'); if(first) first.focus();
  // Scroll to players section on small screens
  playersCard.scrollIntoView({behavior:'smooth', block:'start'});
}

function updateCounter(){
  const rows = [...playersWrap.querySelectorAll('.player-item')];
  const filled = rows.filter(r=>{
    const [n,s]=r.querySelectorAll('input');
    return n.value.trim() && s.value.trim();
  }).length;
  counter.textContent = filled;
}

function getPlayers(){
  const rows = [...playersWrap.querySelectorAll('.player-item')];
  const players = [];
  let missing = [], invalid = [];
  rows.forEach((row, i)=>{
    const [nameEl, scoreEl] = row.querySelectorAll('input');
    const name = nameEl.value.trim() || `Jugador ${i+1}`;
    const raw = (scoreEl.value||'').toString().replace(',', '.');
    const score = parseFloat(raw);
    if(raw==='') missing.push(i+1);
    else if(isNaN(score) || score < 1 || score > 10) invalid.push(i+1);
    else players.push({ name, score });
  });
  return { players, missing, invalid };
}

function copy(obj){ return JSON.parse(JSON.stringify(obj)); }

function greedyBalance(players, teamSize){
  const sorted = copy(players).sort((a,b)=> b.score - a.score);
  const A = []; const B = [];
  let sumA = 0, sumB = 0;
  for(const p of sorted){
    const canA = A.length < teamSize;
    const canB = B.length < teamSize;
    if(canA && (!canB || sumA <= sumB)) { A.push(p); sumA += p.score; }
    else if(canB) { B.push(p); sumB += p.score; }
  }
  return {A,B};
}

function tryImprove(A,B){
  let improved = true;
  while(improved){
    improved = false;
    let bestDelta = 0, bestI=-1, bestJ=-1;
    const sumA = A.reduce((t,p)=>t+p.score,0);
    const sumB = B.reduce((t,p)=>t+p.score,0);
    const currentDiff = Math.abs(sumA - sumB);
    for(let i=0;i<A.length;i++){
      for(let j=0;j<B.length;j++){
        const newSumA = sumA - A[i].score + B[j].score;
        const newSumB = sumB - B[j].score + A[i].score;
        const newDiff = Math.abs(newSumA - newSumB);
        const delta = currentDiff - newDiff;
        if(delta > bestDelta){ bestDelta = delta; bestI=i; bestJ=j; }
      }
    }
    if(bestDelta > 0){
      const tmp = A[bestI]; A[bestI] = B[bestJ]; B[bestJ] = tmp;
      improved = true;
    }
  }
  return {A,B};
}

function renderTeam(el, name, list){
  const total = list.reduce((t,p)=> t + p.score, 0);
  const avg = list.length ? total / list.length : 0;
  el.innerHTML = `
    <div class="team-head">
      <div class="team-name">${name}</div>
      <div class="badge">${list.length} jugadores</div>
    </div>
    <div class="list">
      ${list.map(p=>`<div class="list-item"><span class="name">${escapeHtml(p.name)}</span><span class="score">${p.score.toFixed(2)}</span></div>`).join('')}
    </div>
    <div class="metrics">
      <div class="kpi">Suma: <b>${total.toFixed(2)}</b></div>
      <div class="kpi">Promedio: <b>${avg.toFixed(2)}</b></div>
    </div>
  `;
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function showDiff(A,B){
  const sumA = A.reduce((t,p)=>t+p.score,0);
  const sumB = B.reduce((t,p)=>t+p.score,0);
  const avgA = sumA / (A.length || 1);
  const avgB = sumB / (B.length || 1);
  const diff = Math.abs(avgA-avgB);
  diffHint.innerHTML = `Diferencia de promedios: <b class="diff ${diff<=0.05?'good':'bad'}">${diff.toFixed(3)}</b>`;
}

function build(){
  errorsEl.textContent = '';
  const total = parseInt(modeSelect.value,10);
  const teamSize = total/2;
  const {players, missing, invalid} = getPlayers();
  if(players.length !== total){
    errorsEl.textContent = `Faltan datos en ${missing.length} fila${missing.length!==1?'s':''}: ${missing.join(', ')}.`;
    return;
  }
  if(invalid.length){
    errorsEl.textContent = `Puntajes fuera de rango (1.00–10.00) en fila${invalid.length!==1?'s':''}: ${invalid.join(', ')}.`;
    return;
  }
  let {A,B} = greedyBalance(players, teamSize);
  ({A,B} = tryImprove(A,B));
  renderTeam(teamAEl, 'Equipo 1', A);
  renderTeam(teamBEl, 'Equipo 2', B);
  showDiff(A,B);
  teamsSection.hidden = false;
  lastA = A; lastB = B;
}

function shuffleArr(arr){
  const a = copy(arr);
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// State for optimize
let lastA = [], lastB = [];

// Events
startBtn.addEventListener('click', ()=> renderInputs(parseInt(modeSelect.value,10)));
resetBtn.addEventListener('click', ()=> renderInputs(parseInt(modeSelect.value,10)));
modeSelect.addEventListener('change', ()=> renderInputs(parseInt(modeSelect.value,10)));
playersWrap.addEventListener('input', (e)=>{ if(e.target.matches('input')) updateCounter(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !playersCard.hidden) build(); });
genBtn.addEventListener('click', build);

shuffleBtn.addEventListener('click', ()=>{
  const total = parseInt(modeSelect.value,10);
  const rows = [...playersWrap.querySelectorAll('.player-item')];
  const data = rows.map((r,i)=>{
    const [n,s] = r.querySelectorAll('input');
    return { name: n.value.trim() || `Jugador ${i+1}`, score: parseFloat((s.value||'').replace(',', '.')) };
  });
  const valid = data.every(p=>!isNaN(p.score) && p.score>=1 && p.score<=10) && data.length===total;
  if(!valid){ errorsEl.textContent='Completá todos los puntajes (1.00–10.00) antes de mezclar.'; return; }
  const shuffled = shuffleArr(data); const half = total/2;
  lastA = shuffled.slice(0,half); lastB = shuffled.slice(half);
  renderTeam(teamAEl,'Equipo 1 (aleatorio)', lastA);
  renderTeam(teamBEl,'Equipo 2 (aleatorio)', lastB);
  showDiff(lastA,lastB);
  teamsSection.hidden = false;
});

optimizeBtn.addEventListener('click', ()=>{
  if(!lastA.length || !lastB.length){ errorsEl.textContent='Armá los equipos primero.'; return; }
  const res = tryImprove(copy(lastA), copy(lastB));
  lastA = res.A; lastB = res.B;
  renderTeam(teamAEl,'Equipo 1 (optimizado)', lastA);
  renderTeam(teamBEl,'Equipo 2 (optimizado)', lastB);
  showDiff(lastA,lastB);
  teamsSection.hidden = false;
});
