// ─────────────────────────────────────
// PARTÍCULAS CÁLIDAS
// ─────────────────────────────────────
(function(){
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // partículas más suaves, tamaño mayor, muy lentas
  for(let i=0;i<40;i++){
    particles.push({
      x:  Math.random() * 1400,
      y:  Math.random() * 900,
      r:  Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      o:  Math.random() * 0.22 + 0.04
    });
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if(p.x < 0) p.x = W; if(p.x > W) p.x = 0;
      if(p.y < 0) p.y = H; if(p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(224,80,138,${p.o})`;
      ctx.fill();
    });
    // conexiones muy sutiles
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if(d < 90){
          ctx.beginPath();
          ctx.strokeStyle = `rgba(196,48,106,${0.04*(1-d/90)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ─────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────
let currentScreen = 'inicio';
const screens = ['inicio','historia','test','niveles','refugio','ritual','menu','sos','progreso','terapia','notif','premium','programas'];

// ═══════════════════════════════════════
// OBJETO USER CENTRALIZADO
// ═══════════════════════════════════════
const user = {
  get name(){
    return JSON.parse(localStorage.getItem('inq-session') || '{}').nick || '';
  },
  get premium(){
    const sess = JSON.parse(localStorage.getItem('inq-session') || '{}');
    if(sess.premium) return true;
    const trial = localStorage.getItem('inq-premium-trial');
    if(trial && new Date() < new Date(trial)) return true;
    return false;
  },
  set premium(val){
    const sess = JSON.parse(localStorage.getItem('inq-session') || '{}');
    sess.premium = val;
    localStorage.setItem('inq-session', JSON.stringify(sess));
    if(val){
      const exp = new Date();
      exp.setDate(exp.getDate() + 7);
      localStorage.setItem('inq-premium-trial', exp.toISOString());
    }
  }
};

// Alias compatible con el código externo enviado
function checkPremium(feature){
  if(!user.premium){
    go('premium');
    toast('Esta función es Premium ✦');
    return false;
  }
  return true;
}
function openPremiumScreen(){ go('premium'); }
function openDeepTherapy(){ if(!checkPremium('therapy')) return; go('terapia'); }

function go(id){
  if(id === currentScreen) return;
  const oldEl  = document.getElementById('s-' + currentScreen);
  const newEl  = document.getElementById('s-' + id);
  const oldIdx = screens.indexOf(currentScreen);
  const newIdx = screens.indexOf(id);

  oldEl.classList.remove('active');
  oldEl.classList.add(newIdx > oldIdx ? 'exit-up' : 'exit-down');
  setTimeout(() => oldEl.classList.remove('exit-up','exit-down'), 600);

  newEl.classList.add('active');
  currentScreen = id;

  document.querySelectorAll('.nav-tab').forEach((t,i) =>
    t.classList.toggle('active', screens[i] === id)
  );

  // marcar link activo en el drawer
  document.querySelectorAll('.nav-drawer-link').forEach(l => {
    const fn = l.getAttribute('onclick') || '';
    l.classList.toggle('drawer-active', fn.includes("'"+id+"'"));
  });

  if(id === 'niveles')  renderNiveles();
  if(id === 'refugio')  { renderPosts(); initPreguntaDia(); }
  if(id === 'ritual')   setAfirmacion();
  if(id === 'menu')     renderMenuAuth();
  if(id === 'test')     initTest();
  if(id === 'sos')      renderSosCounter();
  if(id === 'progreso') renderProgreso();
  if(id === 'terapia')  renderTerapia();
  if(id === 'notif')    renderNotifs();
  if(id === 'programas') renderProgramas();
}

function toggleDrawer(){
  document.getElementById('navBurger').classList.toggle('open');
  document.getElementById('navDrawer').classList.toggle('open');
  document.getElementById('drawerOverlay').classList.toggle('open');
}
function closeDrawer(){
  document.getElementById('navBurger').classList.remove('open');
  document.getElementById('navDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

// ─────────────────────────────────────
// TOAST
// ─────────────────────────────────────
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─────────────────────────────────────
// TEST
// ─────────────────────────────────────
const TEST_Q = [
  { q: "¿Con qué frecuencia priorizas las necesidades de otros sobre las tuyas?",
    opts: ["Siempre, es mi forma de ser","A menudo, me cuesta decir no","A veces, estoy aprendiendo","Rara vez, me pongo primero"] },
  { q: "Cuando alguien te pide un favor que no quieres hacer, ¿qué haces?",
    opts: ["Lo hago aunque me pese","Dudo mucho pero acabo cediendo","Intento negociar","Lo digo claramente y sin culpa"] },
  { q: "¿Cómo describes tu relación contigo misma ahora mismo?",
    opts: ["Me ignoro constantemente","Me cuesta verme con claridad","Estoy empezando a conocerme","Me cuido y me respeto"] },
  { q: "¿Reconoces los patrones que repites en tus relaciones?",
    opts: ["No, no los veo","Los veo a veces pero no sé cómo cambiarlos","Los reconozco y trabajo en ello","Los reconozco y actúo desde la consciencia"] },
  { q: "¿Qué sientes cuando alguien te decepciona?",
    opts: ["Me derrumbo completamente","Me duele mucho y tardo en recuperarme","Me duele pero me levanto","Lo proceso y sigo adelante con más claridad"] },
  { q: "¿Cuánto tiempo llevas trabajando en ti misma?",
    opts: ["Aún no he empezado","Recién empezando","Llevo un tiempo en el camino","Es parte de mi vida ya"] }
];

const NIVELES = [
  { n:1, name:"La Grieta",        color:"#C4856E",
    desc:"Algo dentro de ti se ha roto. Estás en el punto de partida, y aunque duele, aquí comienza todo. Las grietas dejan pasar la luz.",
    msg:"El hecho de estar aquí ya es valentía." },
  { n:2, name:"El Despertar",     color:"#C8935A",
    desc:"Empiezas a ver patrones, a cuestionar lo que antes aceptabas. Algo en ti se está despertando. Es incómodo, y también es necesario.",
    msg:"Estás empezando a verte. Eso cambia todo." },
  { n:3, name:"Reconstrucción",   color:"#7AAF8B",
    desc:"Ya no te conformas con sobrevivir. Estás construyendo conscientemente quién quieres ser. Es un proceso, no un destino.",
    msg:"Cada decisión consciente es un ladrillo nuevo." },
  { n:4, name:"Inquebrantable",   color:"#DDB07A",
    desc:"Has integrado tu historia. Te priorizas sin culpa. Tus límites son actos de amor. Eres tu propia base.",
    msg:"Has llegado a casa. A ti misma." }
];

let testScore = 0;
let testQ = 0;

function initTest(){
  const saved = localStorage.getItem('inq-test-result');
  if(saved){
    showResult(JSON.parse(saved).score);
    return;
  }
  testScore = 0; testQ = 0;
  document.getElementById('test-questions').style.display = 'block';
  document.getElementById('test-result').style.display    = 'none';
  renderQ();
}

function renderQ(){
  if(testQ >= TEST_Q.length){ showResult(testScore); return; }
  const q = TEST_Q[testQ];
  document.getElementById('qNum').textContent  = `Pregunta ${testQ+1} de ${TEST_Q.length}`;
  document.getElementById('qText').textContent = q.q;
  document.getElementById('testBar').style.width = (testQ / TEST_Q.length * 100) + '%';

  const opts = document.getElementById('qOptions');
  opts.innerHTML = '';
  q.opts.forEach((o,i) => {
    const btn = document.createElement('button');
    btn.className   = 'test-option';
    btn.textContent = o;
    btn.onclick = () => { testScore += i; testQ++; renderQ(); };
    opts.appendChild(btn);
  });
  const qEl = document.getElementById('qText');
  qEl.style.animation = 'none';
  qEl.offsetHeight;
  qEl.style.animation = 'riseUp 0.4s ease';
}

function showResult(score){
  document.getElementById('testBar').style.width = '100%';
  document.getElementById('test-questions').style.display = 'none';
  const r = document.getElementById('test-result');
  r.style.display = 'block';

  const max = (TEST_Q.length - 1) * 3;
  const pct = score / max;
  let idx;
  if(pct < 0.25)      idx = 0;
  else if(pct < 0.5)  idx = 1;
  else if(pct < 0.75) idx = 2;
  else                idx = 3;

  const nivel = NIVELES[idx];
  document.getElementById('r-badge').textContent = 'Nivel ' + nivel.n;
  document.getElementById('r-name').textContent  = nivel.name;
  document.getElementById('r-name').style.color  = nivel.color;
  document.getElementById('r-desc').textContent  = nivel.desc;
  document.getElementById('r-msg').textContent   = '"' + nivel.msg + '"';

  localStorage.setItem('inq-test-result', JSON.stringify({ score, levelIdx: idx }));
  localStorage.setItem('inq-user-level',  idx);

  setTimeout(() => {
    document.getElementById('r-bar').style.width = ((idx+1)/4*100) + '%';
  }, 300);

  r.style.animation = 'riseUp 0.5s ease';
}

function resetTest(){
  localStorage.removeItem('inq-test-result');
  initTest();
}

// ─────────────────────────────────────
// NIVELES
// ─────────────────────────────────────
function renderNiveles(){
  const container  = document.getElementById('nivelesCards');
  container.innerHTML = '';
  const userLevel = parseInt(localStorage.getItem('inq-user-level') || '-1');

  NIVELES.forEach((n,i) => {
    const isCurrent = (i === userLevel);
    const div = document.createElement('div');
    div.className = 'nivel-card' + (isCurrent ? ' highlight' : '');
    div.innerHTML = `
      <div class="nivel-num">Nivel ${n.n}</div>
      <div class="nivel-name" style="color:${isCurrent ? n.color : 'var(--cream)'}">
        ${n.name}
        ${isCurrent ? '<span class="nivel-tu-nivel">Tu nivel</span>' : ''}
      </div>
      <div class="nivel-desc">${n.desc}</div>
    `;
    container.appendChild(div);
  });
}

// ─────────────────────────────────────
// REFUGIO — PREGUNTA DEL DÍA
// ─────────────────────────────────────
const PREGUNTAS_DIA = [
  "¿Qué es lo más difícil que has cargado sola esta semana?",
  "¿Hubo un momento hoy en que te sentiste invisible?",
  "¿Cuándo fue la última vez que te permitiste llorar sin pedir perdón por ello?",
  "¿Qué parte de ti sientes que nadie ve realmente?",
  "¿Hay algo que llevas tiempo queriendo decir pero no te has atrevido?",
  "¿Qué emoción has estado evitando sentir últimamente?",
  "¿En qué momento de esta semana te sentiste más tú misma?",
  "¿Qué necesitarías escuchar ahora mismo de alguien que te quiere?",
  "¿Hay algo de lo que te estás culpando y en realidad no es tu culpa?",
  "¿Qué límite te cuesta más poner y por qué crees que es así?",
  "¿Cuándo fue la última vez que pediste ayuda de verdad?",
  "¿Qué parte de tu historia te da más vergüenza compartir?",
  "¿Hay algo que perdiste durante este tiempo que todavía no has podido llorar?",
  "¿Qué le dirías a la versión de ti que estaba en el peor momento?",
  "¿Qué significa para ti sentirte segura?",
  "¿Qué es lo primero que piensas cuando alguien te dice que eres fuerte?",
  "¿Cuándo fue la última vez que hiciste algo solo por ti, sin justificarlo?",
  "¿Hay una voz dentro de ti que te habla muy duro? ¿Qué te dice?",
  "¿Qué parte de ti siente que aún no ha sanado?",
  "¿Qué cosas pequeñas te están sosteniendo ahora mismo?",
  "¿Hay algo que el cuerpo te está pidiendo que todavía no le has dado?",
  "¿Cuándo fue la última vez que te sentiste orgullosa de ti misma?",
  "¿Qué creencia sobre ti misma quisieras poder soltar?",
  "¿A quién o qué has estado esperando que te salve?",
  "¿Qué cosa que consideras debilidad podría en realidad ser una fortaleza?",
  "¿Qué es lo que más extrañas de antes de que todo se rompiera?",
  "¿Hay algo que sigues haciendo por miedo, no por amor?",
  "¿Qué te ayuda a respirar cuando sientes que no puedes más?",
  "¿Hay algo que te cuesta perdonarte a ti misma?",
  "¿Qué te gustaría que las personas que te rodean entendieran de verdad?"
];

function initPreguntaDia(){
  const el = document.getElementById('pregunta-dia-texto');
  if(!el) return;
  // índice basado en el día del año para que cambie cada día
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dia = Math.floor(diff / (1000 * 60 * 60 * 24));
  const idx = dia % PREGUNTAS_DIA.length;
  el.textContent = PREGUNTAS_DIA[idx];
}

function responderPregunta(){
  const pregunta = document.getElementById('pregunta-dia-texto').textContent;
  const textarea = document.getElementById('refugio-input');
  if(!textarea) return;
  textarea.value = '';
  textarea.placeholder = pregunta;
  textarea.focus();
}

// REFUGIO
// ─────────────────────────────────────
let postSortMode = 'recientes';

function setSortPosts(mode){
  postSortMode = mode;
  document.getElementById('sort-recientes').classList.toggle('active', mode === 'recientes');
  document.getElementById('sort-populares').classList.toggle('active', mode === 'populares');
  renderPosts();
}

const bannedWords = ["idiota","imbecil","puta","mierda","gilipollas","estupido","cabron","puto","imbécil","estúpido","cabrón"];

function contienePalabraProhibida(texto){
  const lower = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return bannedWords.some(w => {
    const wn = w.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return new RegExp('\\b' + wn + '\\b').test(lower);
  });
}

function publicarPost(){
  const texto = document.getElementById('refugio-input').value.trim();
  if(!texto){ toast('Escribe algo primero.'); return; }
  if(contienePalabraProhibida(texto)){
    toast('En El Refugio cuidamos el respeto y el apoyo mutuo. Reformula tu mensaje.');
    return;
  }
  const session = JSON.parse(localStorage.getItem('inq-session') || '{}');
  const autor   = session.nick || 'Anónima';
  const posts   = JSON.parse(localStorage.getItem('inq-posts') || '[]');
  posts.unshift({
    id: Date.now(),
    texto,
    autor,
    fecha: new Date().toLocaleDateString('es-ES', { day:'numeric', month:'short' }),
    corazones: 0,
    likedByMe: false,
    comentarios: []
  });
  localStorage.setItem('inq-posts', JSON.stringify(posts));
  document.getElementById('refugio-input').value = '';
  // actualizar contador perfil
  const pd = JSON.parse(localStorage.getItem('inq-perfil-extra') || '{}');
  pd.posts = (pd.posts || 0) + 1;
  localStorage.setItem('inq-perfil-extra', JSON.stringify(pd));
  renderPosts();
  toast('Compartido en la comunidad ✦');
}

function toggleHeart(id){
  const posts = JSON.parse(localStorage.getItem('inq-posts') || '[]');
  const p = posts.find(p => p.id === id);
  if(p){
    p.likedByMe = !p.likedByMe;
    p.corazones += (p.likedByMe ? 1 : -1);
    if(p.likedByMe) añadirNotif('Alguien apoyó tu mensaje en la comunidad 💗', 'apoyo');
  }
  localStorage.setItem('inq-posts', JSON.stringify(posts));
  renderPosts();
}

function toggleComentarios(id){
  const el = document.getElementById('comentarios-' + id);
  if(el) el.classList.toggle('open');
}

function enviarComentario(id){
  const input = document.getElementById('comment-input-' + id);
  const texto = input ? input.value.trim() : '';
  if(!texto) return;
  const session = JSON.parse(localStorage.getItem('inq-session') || '{}');
  const autor   = session.nick || 'Anónima';
  const posts   = JSON.parse(localStorage.getItem('inq-posts') || '[]');
  const p       = posts.find(p => p.id === id);
  if(p){
    if(!p.comentarios) p.comentarios = [];
    p.comentarios.push({ autor, texto, fecha: new Date().toLocaleDateString('es-ES', { day:'numeric', month:'short' }) });
    if(p.autor !== autor) añadirNotif('Alguien respondió a tu publicación 💬', 'respuesta');
  }
  localStorage.setItem('inq-posts', JSON.stringify(posts));
  renderPosts();
  // re-abrir sección comentarios tras renderizar
  setTimeout(() => {
    const el = document.getElementById('comentarios-' + id);
    if(el) el.classList.add('open');
  }, 50);
}

function renderPosts(){
  const container = document.getElementById('refugio-posts');
  let posts = JSON.parse(localStorage.getItem('inq-posts') || '[]');
  if(!posts.length){
    container.innerHTML = '<div class="post-empty">Las voces del refugio aparecerán aquí…</div>';
    return;
  }
  if(postSortMode === 'populares'){
    posts = [...posts].sort((a,b) => b.corazones - a.corazones);
  }
  const APOYO_LABELS = ['Estoy contigo 🤍', 'Te mando amor 🤍', 'Aquí estoy 🤍', 'Con todo mi apoyo 🤍'];
  container.innerHTML = posts.map(p => {
    const comentarios = p.comentarios || [];
    const apoyoLabel  = APOYO_LABELS[p.id % APOYO_LABELS.length];
    const comentariosHtml = comentarios.map(c => `
      <div class="comentario-item">
        <span class="comentario-autor">${c.autor}</span>
        <span class="comentario-texto">${c.texto}</span>
        <span class="comentario-fecha">${c.fecha || ''}</span>
      </div>
    `).join('');
    return `
    <div class="post-card">
      <div class="post-meta">
        <span class="post-autor">${p.autor || 'Anónima'}</span>
        <span class="post-fecha">${p.fecha || ''}</span>
      </div>
      <div class="post-text">${p.texto}</div>
      <div class="post-actions">
        <button class="post-heart ${p.likedByMe ? 'liked' : ''}"
          onclick="toggleHeart(${p.id})" style="font-size:12px;letter-spacing:0.3px;padding:7px 14px">
          ${p.likedByMe ? '🤍' : '🤍'} <span>${apoyoLabel.replace('🤍','').trim()}</span>
          <span class="post-apoyo-count">${p.corazones > 0 ? ' · ' + p.corazones : ''}</span>
        </button>
        <button class="post-reply-btn" onclick="toggleComentarios(${p.id})">
          💬 ${comentarios.length}
        </button>
      </div>
      <div class="comentarios-wrap" id="comentarios-${p.id}">
        ${comentariosHtml}
        <div class="comentario-nuevo">
          <input class="comentario-input" id="comment-input-${p.id}"
            placeholder="Responder con apoyo…" type="text">
          <button class="comentario-send" onclick="enviarComentario(${p.id})">→</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────
// RITUAL
// ─────────────────────────────────────
const AFIRMACIONES = [
  "Hoy me elijo a mí.",
  "Mi energía es mía. La invierto con criterio.",
  "No me rompí. Me abrí para renacer.",
  "Mis límites son actos de amor.",
  "Soy suficiente, sin dar nada extra.",
  "De mis grietas nació mi fuerza.",
  "Hoy cierro lo que ya no me pertenece.",
  "Merezco el mismo cuidado que doy.",
  "Ser fiel a mí misma no es traicionar a nadie.",
  "Mi prioridad soy yo."
];

// ─────────────────────────────────────
// RITUAL — variables de estado
// ─────────────────────────────────────
let ritualRespTimer  = null;
let ritualRespActivo = false;

function setAfirmacion(){
  const idx = new Date().getDay() % AFIRMACIONES.length;

  // La afirmación solo se desbloquea si la respiración fue completada HOY
  const hoy      = new Date().toDateString();
  const respDone = localStorage.getItem('inq-ritual-resp') === hoy;

  const lockEl   = document.getElementById('afirmacion-lock');
  const revealEl = document.getElementById('afirmacion-reveal');
  const afirbtn  = document.getElementById('ritual-afirmar-btn');
  const textEl   = document.getElementById('afirmacion-text');

  if(!respDone){
    // Estado inicial: bloqueado
    if(lockEl)   lockEl.style.display   = 'block';
    if(revealEl) revealEl.style.display = 'none';
    if(afirbtn)  afirbtn.style.display  = 'none';
    // Resetear respiración
    ritualRespActivo = false;
    clearTimeout(ritualRespTimer);
    const btn = document.getElementById('ritual-breath-btn');
    const lbl = document.getElementById('ritual-breath-lbl');
    const orb = document.getElementById('ritual-orb');
    if(btn){ btn.disabled=false; btn.style.borderColor=''; btn.style.color=''; btn.innerHTML='<span>Comenzar respiración</span>'; btn.onclick=iniciarRespiracionRitual; }
    if(lbl) lbl.textContent = 'Inhala… exhala…';
    if(orb) orb.classList.remove('ritual-orb-expand','ritual-orb-contract');
  } else {
    // Respiración ya hecha hoy — ver si el texto está escrito
    const texto = (document.getElementById('ritual-input')||{}).value || '';
    if(texto.trim().length >= 5){
      // Mostrar afirmación adaptada
      if(textEl) textEl.textContent = getAfirmacionAdaptada(texto);
      if(lockEl)   lockEl.style.display   = 'none';
      if(revealEl) revealEl.style.display = 'block';
      if(afirbtn)  afirbtn.style.display  = 'none';
    } else {
      // Respiración hecha pero texto pendiente
      if(lockEl)   { lockEl.style.display='block'; lockEl.querySelector('.afirmacion-lock-txt').textContent='Escribe cómo te sientes para desbloquear tu afirmación'; }
      if(revealEl) revealEl.style.display = 'none';
      if(afirbtn)  afirbtn.style.display  = 'block';
    }
  }
}

// Detección de sentimiento y afirmación adaptada
function getAfirmacionAdaptada(texto){
  const t = texto.toLowerCase();
  const tristeza   = ['triste','llorar','lloré','sola','vacía','vacia','perdida','oscura','dolor','duele','cansada','agotada','rota','no puedo','difícil','dificil'];
  const ansiedad   = ['ansiosa','nerviosa','angustia','miedo','ansiedad','preocupada','tensión','tension','agitada','pánico','panico','abrumada','estresada'];
  const superacion = ['logré','logre','pude','conseguí','consegui','fuerza','orgullosa','avancé','avance','mejor','superar','supere','crecí','creci','valiente'];
  const enojo      = ['rabia','ira','enfadada','enfurecida','harta','enfadada','molesta','frustrada','irritada'];

  const matchScore = (kws) => kws.filter(k => t.includes(k)).length;
  const scores = {
    tristeza: matchScore(tristeza),
    ansiedad: matchScore(ansiedad),
    superacion: matchScore(superacion),
    enojo: matchScore(enojo)
  };
  const top = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];

  if(top[1] === 0){
    // neutro — afirmación del día por defecto
    return AFIRMACIONES[new Date().getDay() % AFIRMACIONES.length];
  }
  const afirmaciones = {
    tristeza: [
      'La tristeza que sientes también forma parte de ti. No hay que correrla. Estás permitiéndote sentir, y eso es valioso.',
      'El dolor que cargas hoy no será eterno. Cada momento que atraviesas te acerca a la orilla.',
      'Que seas capaz de nombrarlo ya es un acto de valentía. Mereces ternura, especialmente la tuya.'
    ],
    ansiedad: [
      'Tu cuerpo está intentando protegerte. Respira. Estás a salvo en este momento, ahora mismo.',
      'La ansiedad miente: no todo lo que temes ocurrirá. Devuélvete al presente. Aquí estás, aquí estoy.',
      'Un paso a la vez. No tienes que resolver hoy todo lo que te preocupa. Solo hoy.'
    ],
    superacion: [
      'Mira lo lejos que has llegado. Lo que superaste no fue pequeño — fuiste tú quien lo hizo posible.',
      'Tu fuerza no vino de no caer. Vino de levantarte cada vez. Y lo sigues haciendo.',
      'Estás creciendo incluso cuando no lo parece. Hoy lo demuestra.'
    ],
    enojo: [
      'Tu enojo tiene sentido. Lo que sientes es válido. Respira y deja que tu cuerpo lo procese.',
      'La rabia también es información. Escúchala sin dejar que te consuma. Tienes el control.',
      'Es humano sentir lo que sientes. El paso siguiente es tuyo: elige cómo responder, no solo reaccionar.'
    ]
  };
  const lista = afirmaciones[top[0]];
  return lista[Math.floor(Math.random() * lista.length)];
}

function checkRitualAfirmacion(){
  // Se llama al escribir en el textarea del ritual
  const hoy     = new Date().toDateString();
  const respDone = localStorage.getItem('inq-ritual-resp') === hoy;
  if(!respDone) return; // respiración no completada, no hacer nada
  const texto  = (document.getElementById('ritual-input')||{}).value || '';
  const afirbtn= document.getElementById('ritual-afirmar-btn');
  if(afirbtn) afirbtn.style.display = texto.trim().length >= 5 ? 'block' : 'none';
}

function desbloquearAfirmacionConTexto(e){
  e.stopPropagation();
  const texto  = (document.getElementById('ritual-input')||{}).value || '';
  if(texto.trim().length < 5){ toast('Escribe un poco más antes de continuar.'); return; }
  const textEl = document.getElementById('afirmacion-text');
  const lockEl = document.getElementById('afirmacion-lock');
  const revEl  = document.getElementById('afirmacion-reveal');
  const btn    = document.getElementById('ritual-afirmar-btn');
  if(textEl) textEl.textContent = getAfirmacionAdaptada(texto);
  if(lockEl) lockEl.style.display = 'none';
  if(revEl){
    revEl.style.display = 'block';
    revEl.classList.add('afirmacion-unlock-anim');
  }
  if(btn) btn.style.display = 'none';
  // marcar paso 2 como hecho
  const check2 = document.getElementById('check2');
  const step2  = document.getElementById('step2');
  if(step2) step2.classList.add('done');
  if(check2){ check2.style.background='var(--gold)'; check2.style.borderColor='var(--gold)'; check2.style.color='var(--bg)'; }
  toast('Afirmación adaptada a ti ✦');
}

function toggleStep(n){
  const step  = document.getElementById('step' + n);
  const check = document.getElementById('check' + n);
  step.classList.toggle('done');
  const done = step.classList.contains('done');
  check.style.background  = done ? 'var(--gold)' : '';
  check.style.borderColor = done ? 'var(--gold)' : 'var(--border)';
  check.style.color       = done ? 'var(--bg)'   : 'transparent';
  if(n === 1) document.getElementById('breath1').classList.toggle('active', done);
  if(n === 2) document.getElementById('ritual-input').classList.toggle('active', done);
}

// ─────────────────────────────────────
// RITUAL — RESPIRACIÓN CON VOZ
// ─────────────────────────────────────

function hablar(texto, rate){
  return new Promise(resolve => {
    if(!window.speechSynthesis){ resolve(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang  = 'es-ES';
    u.rate  = rate || 0.72;   // más lento = más calmado
    u.pitch = 1.15;            // más agudo = más dulce
    u.volume = 0.85;
    // preferir voz femenina si está disponible
    const voces = speechSynthesis.getVoices();
    const vFem = voces.find(v => v.lang.startsWith('es') && /female|mujer|Monica|Paulina|Lucia|Conchita|María|Valeria/i.test(v.name))
              || voces.find(v => v.lang.startsWith('es'));
    if(vFem) u.voice = vFem;
    u.onend = resolve;
    speechSynthesis.speak(u);
  });
}

function iniciarRespiracionRitual(e){
  e.stopPropagation();
  if(ritualRespActivo) return;
  ritualRespActivo = true;

  const btn  = document.getElementById('ritual-breath-btn');
  const lbl  = document.getElementById('ritual-breath-lbl');
  const orb  = document.getElementById('ritual-orb');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Respirando…';

  // resetear anillo al inicio
  const ring = document.getElementById('ritual-ring-prog');
  if(ring){ ring.style.transition = 'none'; ring.style.strokeDashoffset = 327; void ring.offsetWidth; ring.style.transition = ''; }

  let ciclo = 0;
  const totalCiclos = 3;

  async function runCiclo(){
    if(ciclo >= totalCiclos){
      // completado — anillo lleno
      clearInterval(_ritualRingTimer);
      if(ring){ ring.style.strokeDashoffset = 0; }
      orb.classList.remove('ritual-orb-expand','ritual-orb-contract');
      lbl.textContent = '✦ Respiración completada';
      btn.querySelector('span').textContent = 'Completado';
      btn.style.borderColor = 'var(--gold)';
      btn.style.color       = 'var(--gold)';
      await hablar('Completado', 0.72);
      // desbloquear afirmación
      localStorage.setItem('inq-ritual-resp', new Date().toDateString());
      registrarHabito('ritual');
      setTimeout(() => {
        // marcar paso 1 como hecho
        const check1 = document.getElementById('check1');
        const step1  = document.getElementById('step1');
        if(step1) step1.classList.add('done');
        if(check1){ check1.style.background='var(--gold)'; check1.style.borderColor='var(--gold)'; check1.style.color='var(--bg)'; }
        // comprobar si ya hay texto escrito
        const texto  = (document.getElementById('ritual-input')||{}).value || '';
        const lockEl = document.getElementById('afirmacion-lock');
        const lockTxt= lockEl ? lockEl.querySelector('.afirmacion-lock-txt') : null;
        const afirbtn= document.getElementById('ritual-afirmar-btn');
        if(texto.trim().length >= 5){
          // tiene texto → mostrar afirmación directamente
          const textEl = document.getElementById('afirmacion-text');
          const revEl  = document.getElementById('afirmacion-reveal');
          if(textEl) textEl.textContent = getAfirmacionAdaptada(texto);
          if(lockEl) lockEl.style.display = 'none';
          if(revEl){ revEl.style.display = 'block'; revEl.classList.add('afirmacion-unlock-anim'); }
          if(afirbtn) afirbtn.style.display = 'none';
          toast('Afirmación adaptada a ti ✦');
        } else {
          // sin texto → cambiar mensaje de bloqueo
          if(lockTxt) lockTxt.textContent = 'Escribe cómo te sientes para recibir tu afirmación';
          if(afirbtn) afirbtn.style.display = 'none'; // aparecerá al escribir
        }
      }, 600);
      ritualRespActivo = false;
      return;
    }

    // Inhala — 4s
    lbl.textContent = 'Inhala…';
    orb.classList.remove('ritual-orb-contract');
    orb.classList.add('ritual-orb-expand');
    setRitualRing(ciclo, 0, 4000);          // fase 0 de 3 fases
    await hablar('Inhala', 0.72);
    await delay(3400);

    // Mantén — 7s
    lbl.textContent = 'Mantén…';
    setRitualRing(ciclo, 1, 7000);
    await hablar('Mantén', 0.65);
    await delay(6500);

    // Exhala — 8s
    lbl.textContent = 'Exhala…';
    orb.classList.remove('ritual-orb-expand');
    orb.classList.add('ritual-orb-contract');
    setRitualRing(ciclo, 2, 8000);
    await hablar('Exhala', 0.65);
    await delay(7500);

    ciclo++;
    runCiclo();
  }

  // abrir paso 1
  document.getElementById('breath1').classList.add('active');
  runCiclo();
}

function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

// Anillo de progreso ritual — 4-7-8
// ciclo 0-2, fase 0=inhala 1=mantén 2=exhala, duración en ms
let _ritualRingTimer = null;
function setRitualRing(ciclo, fase, duracion){
  const ring = document.getElementById('ritual-ring-prog');
  if(!ring) return;
  clearInterval(_ritualRingTimer);

  const TOTAL_CICLOS = 3;
  const TOTAL_DURACION = (4 + 7 + 8) * 1000; // un ciclo completo = 19s
  const CIRCUNFERENCIA = 327; // 2π×52

  // progreso base del ciclo actual (0 a 1)
  const basePorCiclo = 1 / TOTAL_CICLOS;
  // duración acumulada en ms dentro del ciclo: inhala=4000 mantén=7000 exhala=8000
  const faseDuraciones = [4000, 7000, 8000];
  const faseOffset = faseDuraciones.slice(0, fase).reduce((a,b)=>a+b, 0);
  const cicloTotal = faseDuraciones.reduce((a,b)=>a+b, 0); // 19000ms

  const startTime = Date.now();
  const startPct  = (ciclo / TOTAL_CICLOS) + (faseOffset / cicloTotal) * basePorCiclo;

  _ritualRingTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const phasePct = Math.min(elapsed / duracion, 1);
    const endPct = (ciclo / TOTAL_CICLOS) + ((faseOffset + faseDuraciones[fase]) / cicloTotal) * basePorCiclo;
    const currentPct = startPct + (endPct - startPct) * phasePct;
    const offset = CIRCUNFERENCIA * (1 - currentPct);
    ring.style.strokeDashoffset = offset;
    if(phasePct >= 1) clearInterval(_ritualRingTimer);
  }, 50);
}

// ─────────────────────────────────────
// AUTH
// ─────────────────────────────────────
function handleRegister(){
  const nick  = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const msg   = document.getElementById('reg-msg');
  if(!nick)  { msg.textContent = 'Elige un nickname'; msg.style.color = '#D07070'; return; }
  if(!email || !/\S+@\S+\.\S+/.test(email)) { msg.textContent = 'Email no válido'; msg.style.color = '#D07070'; return; }
  if(pass.length < 6) { msg.textContent = 'Mínimo 6 caracteres'; msg.style.color = '#D07070'; return; }
  msg.style.color = 'var(--sand)';
  msg.textContent = 'Creando tu cuenta…';
  window.__inqAuth.signup(nick, email, pass).then(res => {
    if(!res.ok){ msg.style.color = '#D07070'; msg.textContent = res.error || 'No se pudo crear la cuenta.'; return; }
    if(res.needsConfirmation){
      msg.style.color = 'var(--gold)';
      msg.textContent = '✓ Te hemos enviado un email para confirmar tu cuenta.';
      return;
    }
    window.__inqAuth.setLocalSession(res.user);
    msg.style.color = 'var(--gold)';
    msg.textContent = '✓ Bienvenida, ' + nick + '!';
    setTimeout(() => location.reload(), 900);
  }).catch(() => { msg.style.color = '#D07070'; msg.textContent = 'Error de conexión. Inténtalo otra vez.'; });
}

function handleLogin(){
  const email = document.getElementById('log-email').value.trim();
  const pass  = document.getElementById('log-pass').value;
  const msg   = document.getElementById('log-msg');
  if(!email || !pass){ msg.textContent = 'Escribe tu email y tu contraseña'; msg.style.color = '#D07070'; return; }
  msg.style.color = 'var(--sand)';
  msg.textContent = 'Entrando…';
  window.__inqAuth.login(email, pass).then(res => {
    if(!res.ok){ msg.style.color = '#D07070'; msg.textContent = res.error || 'No se pudo entrar.'; return; }
    window.__inqAuth.setLocalSession(res.user);
    msg.style.color = 'var(--gold)';
    msg.textContent = '✓ Bienvenida de nuevo, ' + res.user.nick + '!';
    setTimeout(() => location.reload(), 800);
  }).catch(() => { msg.style.color = '#D07070'; msg.textContent = 'Error de conexión. Inténtalo otra vez.'; });
}

function handleLogout(){
  window.__inqAuth.clearLocalSession();
  toast('Sesión cerrada');
  window.__inqAuth.logout().finally(() => setTimeout(() => location.reload(), 400));
}

function handleContact(){
  const name  = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const cmsg  = document.getElementById('contact-msg').value.trim();
  const fb    = document.getElementById('contact-feedback');
  if(!name || !cmsg){ fb.textContent = 'Rellena nombre y mensaje'; fb.style.color = '#D07070'; return; }
  fb.style.color = 'var(--sand)'; fb.textContent = 'Enviando…';
  window.__inqAuth.contact(name, email, cmsg).then(res => {
    if(!res.ok){ fb.style.color = '#D07070'; fb.textContent = res.error || 'No se pudo enviar.'; return; }
    fb.style.color = 'var(--gold)';
    fb.textContent = '✓ Mensaje enviado, gracias ' + name + '!';
    ['contact-name','contact-email','contact-msg'].forEach(id => document.getElementById(id).value = '');
  }).catch(() => { fb.style.color = '#D07070'; fb.textContent = 'Error de conexión.'; });
}

function renderMenuAuth(){
  const session  = JSON.parse(localStorage.getItem('inq-session') || 'null');
  const loggedIn = session?.loggedIn;

  document.getElementById('menu-noauth').style.display = loggedIn ? 'none'  : 'block';
  document.getElementById('menu-auth').style.display   = loggedIn ? 'block' : 'none';

  if(loggedIn){
    const letra = (session.nick || session.email || 'I')[0].toUpperCase();
    const LVLS  = ['La Grieta','El Despertar','Reconstrucción','Inquebrantable'];
    const lvlIdx = localStorage.getItem('inq-user-level');

    document.getElementById('mp-avatar').textContent  = letra;
    document.getElementById('mp-nombre').textContent  = session.nick || 'Usuaria';
    document.getElementById('mp-email-display').textContent = session.email || '';

    // fecha registro
    const accs = JSON.parse(localStorage.getItem('inq-accounts') || '{}');
    const acc  = accs[session.email] || {};
    if(acc.fecha){
      const f = new Date(acc.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
      document.getElementById('mp-miembro').textContent   = 'Miembro desde ' + f;
      document.getElementById('mp-fecha-registro').textContent = f;
    }

    // stats
    const dias  = calcDiasFuertes(getProgresoData());
    const posts = JSON.parse(localStorage.getItem('inq-posts') || '[]')
      .filter(p => p.autor === session.nick).length;
    document.getElementById('mp-dias').textContent  = dias;
    document.getElementById('mp-posts').textContent = posts;
    document.getElementById('mp-nivel').textContent = lvlIdx !== null ? LVLS[+lvlIdx] : '—';

    // bio
    const bio = localStorage.getItem('inq-bio-' + session.email) || '';
    document.getElementById('mp-bio').value = bio;
  }
}

function guardarBioMenu(){
  const sess = JSON.parse(localStorage.getItem('inq-session') || '{}');
  if(!sess.loggedIn){ return; }
  const bio = document.getElementById('mp-bio').value.trim();
  localStorage.setItem('inq-bio-' + sess.email, bio);
  mostrarMsg('mp-bio-msg','Guardado ✦','ok');
}

function handleContact2(){
  const email = document.getElementById('contact-email2').value.trim();
  const cmsg  = document.getElementById('contact-msg2').value.trim();
  const fb    = document.getElementById('contact-feedback2');
  const sess  = JSON.parse(localStorage.getItem('inq-session') || '{}');
  if(!cmsg){ fb.textContent = 'Escribe tu mensaje'; fb.style.color = '#D07070'; return; }
  fb.style.color = 'var(--sand)'; fb.textContent = 'Enviando…';
  window.__inqAuth.contact(sess.nick || 'Usuaria', email || sess.email || '', cmsg).then(res => {
    if(!res.ok){ fb.style.color = '#D07070'; fb.textContent = res.error || 'No se pudo enviar.'; return; }
    fb.style.color = 'var(--gold)';
    fb.textContent = '✓ Mensaje enviado, gracias!';
    ['contact-email2','contact-msg2'].forEach(id => document.getElementById(id).value = '');
  }).catch(() => { fb.style.color = '#D07070'; fb.textContent = 'Error de conexión.'; });
}

function switchMenuTab(tab){
  document.querySelectorAll('.menu-tab-btn').forEach((b,i) =>
    b.classList.toggle('active', ['registro','login','contacto'][i] === tab)
  );
  ['mp-registro','mp-login','mp-contacto'].forEach(id =>
    document.getElementById(id).classList.toggle('active', id === 'mp-' + tab)
  );
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
setAfirmacion();
renderPosts();
renderMenuAuth();

// ═══════════════════════════════════════
// PROGRESO / RECAÍDAS
// ═══════════════════════════════════════
function getProgresoData(){
  return JSON.parse(localStorage.getItem('inq-progreso') || JSON.stringify({
    inicio: new Date().toISOString(),
    recaidas: [],
    mejorRacha: 0
  }));
}
function saveProgresoData(d){
  localStorage.setItem('inq-progreso', JSON.stringify(d));
}
function calcDiasFuertes(d){
  const ultima = d.recaidas.length ? new Date(d.recaidas[d.recaidas.length-1]) : new Date(d.inicio);
  const ahora  = new Date();
  return Math.max(0, Math.floor((ahora - ultima) / 86400000));
}
function renderProgreso(){
  const d    = getProgresoData();
  const dias = calcDiasFuertes(d);
  const inicio = new Date(d.inicio);

  document.getElementById('progreso-dias').textContent = dias;
  document.getElementById('progreso-desde').textContent =
    'desde ' + inicio.toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'});
  document.getElementById('progreso-total-dias').textContent =
    Math.floor((new Date() - inicio) / 86400000);
  document.getElementById('progreso-recaidas').textContent = d.recaidas.length;
  document.getElementById('progreso-racha-max').textContent = d.mejorRacha;

  // historial
  const hist = document.getElementById('progreso-hist');
  if(!d.recaidas.length){
    hist.innerHTML = '<div class="hist-empty">Sin recaídas registradas. ¡Sigue así!</div>';
  } else {
    hist.innerHTML = [...d.recaidas].reverse().map(r => {
      const fecha = new Date(r).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
      return `<div class="hist-item">
        <span class="hist-dot">◎</span>
        <span class="hist-fecha">${fecha}</span>
        <span class="hist-label">Recaída registrada</span>
      </div>`;
    }).join('');
  }
  document.getElementById('recaida-apoyo').style.display = 'none';

  // color de racha
  const card = document.getElementById('progreso-racha-card');
  if(dias >= 30) card.style.borderColor = 'rgba(122,175,139,0.5)';
  else if(dias >= 7) card.style.borderColor = 'rgba(196,48,106,0.4)';
  else card.style.borderColor = 'var(--border)';
}
function registrarRecaida(){
  const d = getProgresoData();
  const dias = calcDiasFuertes(d);
  if(dias > d.mejorRacha) d.mejorRacha = dias;
  d.recaidas.push(new Date().toISOString());
  saveProgresoData(d);

  // Mensajes empáticos tipo IA según días de racha anterior
  let mensaje;
  if(dias >= 30){
    mensaje = 'Treinta días de racha no desaparecen con una recaída. Los llevas dentro. Volver a empezar desde aquí es diferente a empezar desde cero — traes todo lo aprendido.';
  } else if(dias >= 14){
    mensaje = 'Dos semanas de trabajo real. Eso no se borra. Las recaídas no borran tu camino — son parte de él. Cada vez que vuelves, lo haces más fuerte y más consciente.';
  } else if(dias >= 7){
    mensaje = 'Una semana de esfuerzo ya cambió algo en ti, aunque no lo notes ahora mismo. Registrarlo con honestidad es exactamente lo que hace alguien que se está reconstruyendo de verdad.';
  } else if(dias >= 1){
    mensaje = 'Registrar esto requiere valentía. No estás fallando — estás siendo honesta contigo misma, y eso es más difícil y más valioso que cualquier racha perfecta.';
  } else {
    mensaje = 'Las recaídas no definen tu historia. Solo son un momento en ella. Lo que defines es lo que haces después, y ya estás haciendo lo correcto: nombrarlo y seguir.';
  }

  const apoyo = document.getElementById('recaida-apoyo');
  apoyo.style.color     = 'var(--gold)';
  apoyo.style.fontSize  = '13px';
  apoyo.style.lineHeight= '1.8';
  apoyo.textContent = mensaje;
  apoyo.style.display = 'block';

  añadirNotif('💙 Nueva racha comenzada. Cada día suma.', 'progreso');
  renderProgreso();
}

// ═══════════════════════════════════════
// MODO TERAPIA
// ═══════════════════════════════════════
function renderTerapia(){
  const hoy  = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('terapia-fecha').textContent = hoy.charAt(0).toUpperCase() + hoy.slice(1);

  // cargar borrador del día si existe
  const key   = 'inq-terapia-' + new Date().toDateString();
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  [1,2,3,4,5].forEach(i => {
    const ta = document.getElementById('ta-' + i);
    if(ta && saved['ta'+i]) ta.value = saved['ta'+i];
  });

  // historial
  renderTerapiaHist();
}
async function guardarTerapia(){
  const key    = 'inq-terapia-' + new Date().toDateString();
  const entry  = { fecha: new Date().toISOString() };
  let vacio = true;
  [1,2,3,4,5].forEach(i => {
    const v = document.getElementById('ta-' + i).value.trim();
    entry['ta'+i] = v;
    if(v) vacio = false;
  });
  if(vacio){ mostrarMsg('terapia-msg','Escribe algo antes de guardar.','err'); return; }
  localStorage.setItem(key, JSON.stringify(entry));

  // guardar en historial
  const hist = JSON.parse(localStorage.getItem('inq-terapia-hist') || '[]');
  const idx  = hist.findIndex(h => h.fecha && h.fecha.startsWith(new Date().toDateString().slice(0,10)));
  if(idx >= 0) hist[idx] = entry; else hist.unshift(entry);
  localStorage.setItem('inq-terapia-hist', JSON.stringify(hist.slice(0,60)));

  // Mostrar estado de carga
  const msgEl = document.getElementById('terapia-msg');
  msgEl.style.color     = 'var(--muted)';
  msgEl.style.fontSize  = '12px';
  msgEl.style.lineHeight= '1.9';
  msgEl.style.padding   = '20px 0 4px';
  msgEl.innerHTML = '<p style="text-align:center;letter-spacing:2px;text-transform:uppercase">Analizando tu reflexión…</p>';

  // Evaluación con IA real (o fallback offline)
  const valoracion = await generarEvaluacionIA(entry);
  msgEl.style.color    = 'var(--gold)';
  msgEl.style.fontSize = '13px';
  // Renderizar secciones: detectar encabezados **TEXTO** → título visual
  const html = valoracion
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => {
      const trimmed = p.trim();
      // Encabezado tipo **ESTADO EMOCIONAL ACTUAL**
      if(/^\*\*[A-ZÁÉÍÓÚÑ\s]+\*\*$/.test(trimmed)){
        const titulo = trimmed.replace(/\*\*/g,'');
        return `<p style="margin:18px 0 6px 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--rose);font-family:'DM Sans',sans-serif">${titulo}</p>`;
      }
      // Párrafo normal
      return `<p style="margin:0 0 14px 0">${trimmed.replace(/\*\*/g,'')}</p>`;
    })
    .join('');
  msgEl.innerHTML = html;

  añadirNotif('✦ Completaste tu reflexión de hoy.', 'terapia');
  registrarHabito('terapia');
  renderTerapiaHist();
}

// ── EVALUACIÓN CON IA REAL (Claude API) ──
async function generarEvaluacionIA(entry){
  const t1 = (entry.ta1||'').trim();
  const t2 = (entry.ta2||'').trim();
  const t3 = (entry.ta3||'').trim();
  const t4 = (entry.ta4||'').trim();
  const t5 = (entry.ta5||'').trim();

  const respuestasTexto = [
    t1 ? `¿Qué sentiste hoy?\n"${t1}"` : null,
    t2 ? `¿Qué límite lograste poner?\n"${t2}"` : null,
    t3 ? `¿Qué aprendiste sobre ti hoy?\n"${t3}"` : null,
    t4 ? `¿Qué necesitas soltar?\n"${t4}"` : null,
    t5 ? `¿De qué te sientes orgullosa hoy?\n"${t5}"` : null,
  ].filter(Boolean).join('\n\n');

  const sistemaPrompt = `Eres un panel de evaluación psicológica clínica que integra los métodos y perspectivas de los 10 psicólogos más influyentes de la historia:

1. AARON BECK — Terapia cognitiva: detectas distorsiones cognitivas (catastrofización, pensamiento todo-o-nada, filtro mental, personalización, lectura de mente). Identificas el diálogo interno negativo automático.

2. CARL ROGERS — Psicología humanista: escuchas con empatía radical, aceptas incondicionalmente, reflejas lo que la persona dice sin interpretar en exceso, ayudas a que se vea a sí misma con claridad y sin juicio.

3. VIKTOR FRANKL — Logoterapia: buscas el sentido que la persona da a su sufrimiento. Detectas si hay vacío existencial, si la persona ha perdido el rumbo, si hay algo que todavía la ancla a la vida.

4. MARSHA LINEHAN — DBT (Terapia Dialéctico Conductual): evalúas la regulación emocional, validas el dolor sin reforzar la evitación, identificas si la persona necesita habilidades de tolerancia al malestar o de efectividad interpersonal.

5. ALBERT ELLIS — TREC: detectas creencias irracionales del tipo "debo ser perfecta", "necesito que me aprueben", "esto es insoportable". Señalas las exigencias absolutas que generan sufrimiento innecesario.

6. BESSEL VAN DER KOLK — Trauma: lees entre líneas para detectar señales de trauma no procesado, reactivación somática, hipervigilancia o disociación emocional. El cuerpo lleva la cuenta.

7. KRISTIN NEFF — Autocompasión: evalúas si la persona se trata con la misma compasión que trataría a una amiga. Detectas el autocrítica excesiva y propones el antídoto: ternura hacia una misma.

8. DANIEL GOLEMAN — Inteligencia emocional: evalúas la autoconciencia emocional, la autorregulación, la empatía hacia sí misma, y la capacidad de gestionar relaciones.

9. MARTIN SELIGMAN — Psicología positiva (PERMA): buscas indicadores de emociones positivas, compromiso, relaciones, sentido y logros. Evalúas si la persona tiene recursos de resiliencia o está en déficit.

10. IRVIN YALOM — Psicoterapia existencial: exploras los temas de muerte, libertad, soledad e insignificancia que subyacen bajo el malestar. Buscas qué está evitando enfrentar y qué podría liberarla.

---

TU MISIÓN CLÍNICA:
Analiza las respuestas de reflexión emocional diaria de esta persona con la mirada integrada de todos estos enfoques. Tu análisis debe ser:

- ESPECÍFICO: cita sus palabras exactas cuando reflejen algo significativo
- PROFUNDO: ve más allá de lo que dice, a lo que sugiere
- CLÍNICO pero CÁLIDO: eres profesional sin ser frío, cercano sin ser condescendiente
- ACCIONABLE: no solo describes, orientas hacia el cambio real
- HONESTO: si hay algo preocupante, lo nombras con cuidado pero sin evitarlo

Escribe en español, en segunda persona (tú), con tono de terapeuta experto que respeta profundamente a quien tiene delante.

Estructura obligatoria con estos encabezados exactos:

**ESTADO EMOCIONAL ACTUAL**
(Diagnóstico clínico del momento emocional real. Qué emociones predominan, con qué intensidad, si hay contradicciones entre lo que dice y lo que revela. Cita sus palabras.)

**LO QUE NOS DICE TU DIÁLOGO INTERNO**
(Creencias, patrones, distorsiones cognitivas o fortalezas que revelan sus respuestas. Qué se dice a sí misma. Qué relación tiene con su propio valor. Cita sus palabras exactas.)

**QUÉ NECESITAS AHORA MISMO**
(Las 2-3 necesidades psicológicas más urgentes basadas en sus respuestas. Ser específica: no "cuidarte más" sino qué tipo de cuidado, para qué, cómo.)

**PASOS CONCRETOS PARA ESTA SEMANA**
(3-4 acciones prácticas, pequeñas y reales, derivadas directamente de lo que escribió. No genéricas. Que pueda hacer hoy o mañana.)

**MENSAJE FINAL**
(Un párrafo de cierre terapéutico: cálido, directo, que la vea de verdad. Que sienta que alguien la ha escuchado realmente.)`;


  const nombre = JSON.parse(localStorage.getItem('inq-session') || '{}').nick || 'la persona';
  const progData = getProgresoData ? getProgresoData() : null;
  const diasFuertes = progData ? calcDiasFuertes(progData) : null;
  const contexto = diasFuertes !== null ? `Contexto adicional: lleva ${diasFuertes} día${diasFuertes!==1?'s':''} de racha sin recaídas. Su nombre es ${nombre}.` : `Su nombre es ${nombre}.`;

  const userPrompt = `${contexto}

Estas son sus respuestas de hoy a las preguntas de reflexión emocional:

${respuestasTexto}

Analiza sus respuestas con toda la profundidad clínica que puedas. Ve más allá de lo superficial — qué hay debajo de lo que dice, qué patrones se repiten, qué necesita realmente. Sé específica, cita sus palabras, y oriéntala hacia acciones concretas.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1800,
        system: sistemaPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
    if(!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    const texto = data?.content?.[0]?.text || '';
    if(texto.length > 50) return texto;
  } catch(e){
    console.warn('IA no disponible, usando valoración offline:', e.message);
  }

  // ── FALLBACK OFFLINE ──
  return generarValoracionTerapia(entry);
}

// ── FALLBACK: valoración offline cuando no hay conexión ──
function generarValoracionTerapia(entry){
  const t1 = (entry.ta1||'').trim();
  const t2 = (entry.ta2||'').trim();
  const t3 = (entry.ta3||'').trim();
  const t4 = (entry.ta4||'').trim();
  const t5 = (entry.ta5||'').trim();
  const texto = [t1,t2,t3,t4,t5].join(' ').toLowerCase();

  // ═══════════════════════════════════════════════════════
  // MOTOR CLÍNICO INTEGRADO
  // Beck · Rogers · Frankl · Linehan · Van der Kolk
  // Gottman · Kristin Neff · Siegel · Yalom · Brené Brown
  // ═══════════════════════════════════════════════════════

  function cita(txt, n){
    if(!txt) return '';
    const w = txt.split(/\s+/).slice(0,n).join(' ');
    return '"' + w + (txt.split(/\s+/).length > n ? '…' : '') + '"';
  }
  function corta(txt, max){ return txt.length > max ? txt.slice(0,max).trimEnd()+'…' : txt; }

  // ── 1. INVENTARIO EMOCIONAL (Beck + Rogers) ──────────
  const senales = {
    depresion:     ['triste','tristeza','lloré','llorar','vacía','vacia','sola','hundida','sin ganas','no puedo','sin sentido','inútil','inutil','fracasé','fracas','culpa','culpable','vergüenza','avergonzada','me odio','no valgo','no sirvo','apagada'],
    ansiedad:      ['ansiosa','ansiedad','nerviosa','nervios','miedo','angustia','angustiada','preocupada','preocupación','tensión','tension','agobio','abrumada','agitada','pánico','panico','estresada','estrés','bloqueo','me bloqueo'],
    ira:           ['rabia','ira','enfadada','harta','molesta','frustrada','irritada','enfurecida','cabreada','odio','injusto','exploto'],
    trauma:        ['me hace daño','me hizo daño','no me respetan','me ignoran','me gritan','me controlan','no me escuchan','abuso','maltrato','me humillan','me invalidan','no cuento','no valgo nada','nadie me ve','me da miedo él','me da miedo ella'],
    agotamiento:   ['cansada','agotada','sin energía','no tengo fuerzas','no doy más','exhausta','desgastada','quemada','ya no puedo','no aguanto'],
    soledad:       ['sola','nadie','no me entienden','incomprendida','aislada','sin apoyo','invisible','nadie me ve','me siento sola'],
    autoexigencia: ['debería','no fui suficiente','tendría que','me exijo','me critico','no lo hice bien','fallé','me equivoqué','no está bien','podría haber'],
    progreso:      ['pude','logré','avancé','mejoré','conseguí','superé','resistí','valiente','fuerza','orgullosa','crecí','aprendí','cambié','di un paso','lo hice'],
    autocompasion: ['me perdoné','me cuidé','me di tiempo','fui amable conmigo','me escuché','me respeté','me permití','me quise'],
    esperanza:     ['espero','quiero cambiar','voy a','mañana','ilusión','ganas','posible','seguiré','no me rindo','sigo']
  };

  const D = {};
  for(const [k,words] of Object.entries(senales)){
    D[k] = words.some(w => texto.includes(w));
  }

  const cargaNeg = ['depresion','ansiedad','ira','trauma','agotamiento','soledad','autoexigencia'].filter(k=>D[k]).length;
  const cargaPos = ['progreso','autocompasion','esperanza'].filter(k=>D[k]).length;

  // ── 2. DISTORSIONES COGNITIVAS (Beck + Ellis) ────────
  const dist = [];
  if(['debería','tendría que','debo','tengo que'].some(w=>texto.includes(w))) dist.push('obligatorio');
  if(['siempre','nunca','jamás','todo','nada','absolutamente'].some(w=>texto.includes(w))) dist.push('absolutista');
  if(['soy un fracaso','soy mala','soy una carga','no valgo','soy inútil','soy lo peor'].some(w=>texto.includes(w))) dist.push('etiquetado');
  if(['van a pensar','creerán','pensarán','me juzgarán','qué dirán'].some(w=>texto.includes(w))) dist.push('lectura_mental');
  if(['va a salir mal','seguro que falla','lo sé','va a pasar algo'].some(w=>texto.includes(w))) dist.push('prediccion');

  // ── 3. RECURSOS INTERNOS (Linehan DBT) ──────────────
  const rec = {
    conciencia:      t1.length > 15,
    regulacion:      D.autocompasion || (t2.length > 5),
    autoconocimiento:t3.length > 15,
    interpersonal:   t2.length > 10,
    orgullo_activo:  t5.length > 5
  };

  // ── 4. SEÑALES DE TRAUMA (Van der Kolk) ─────────────
  const trauma = D.trauma || ['me paralizo','me congelo','me disocio','no reacciono','no estaba en mí'].some(w=>texto.includes(w));

  // ── 5. SENTIDO (Frankl) ──────────────────────────────
  const sinSentido  = ['para qué','qué sentido','no entiendo por qué','sin propósito','no sirve de nada'].some(w=>texto.includes(w));
  const conSentido  = ['me ayuda a','sirve para','aprendí que','tiene valor','me importa','por eso'].some(w=>texto.includes(w));

  // ═══ CONSTRUCCIÓN DEL INFORME ═══════════════════════
  const partes = [];

  // ── BLOQUE A: ESTADO EMOCIONAL HOY ──────────────────
  let apertura = '';
  if(cargaNeg >= 4){
    apertura = `Lo que describes hoy muestra una carga emocional considerable y sostenida. No se trata de un mal día aislado — el patrón que aparece en tus respuestas sugiere que llevas tiempo funcionando por encima de tus recursos. Tu sistema nervioso está dando señales claras de sobrecarga.`;
  } else if(D.depresion && !D.progreso){
    apertura = t1
      ? `Escribiste que sentiste ${cita(t1,7)}. Lo que describes se acerca clínicamente a lo que llamamos agotamiento emocional sostenido o estado depresivo reactivo — no es fragilidad, es el resultado predecible de haber dado durante demasiado tiempo sin recibir suficiente. Tiene nombre, y tiene salida.`
      : `Hay señales de vaciamiento emocional en tus palabras. No siempre el dolor tiene un nombre claro, pero sí tiene peso — y merece ser atendido, no ignorado.`;
  } else if(D.ansiedad && !D.progreso){
    apertura = t1
      ? `Describes ${cita(t1,6)}. Cognitivamente, lo que experimentas es hiperactivación del sistema de amenaza: tu mente anticipa peligros incluso cuando no son inminentes. Eso consume una energía enorme. La ansiedad no es debilidad de carácter — es un sistema de alarma sobreactivado que necesita recalibración, no silencio.`
      : `Hay una activación ansiosa presente en tu reflexión de hoy. Tu mente está en modo alerta constante. Eso es agotador — y es algo que se puede trabajar.`;
  } else if(D.ira){
    apertura = t1
      ? `Sentiste ${cita(t1,6)}. La rabia es siempre una emoción secundaria: debajo de ella casi siempre hay dolor, una expectativa rota o una necesidad que no fue atendida. La pregunta terapéutica no es cómo apagarla, sino qué información contiene. Tu rabia te está diciendo algo importante.`
      : `Hay frustración e irritación en lo que describes. Antes de gestionarla, conviene preguntarse: ¿qué necesidad mía no está siendo cubierta?`;
  } else if(D.agotamiento){
    apertura = `Lo que describes apunta a un agotamiento real y profundo — no el de un día difícil, sino el de alguien que lleva tiempo operando por encima de su capacidad. El agotamiento crónico afecta a la memoria, a la toma de decisiones, a la regulación emocional y a la percepción de uno mismo. No es un estado que se resuelva solo con voluntad.`;
  } else if(D.progreso && cargaPos >= 2){
    apertura = t1
      ? `Comienzas con ${cita(t1,7)}. Lo que se percibe en tu reflexión de hoy no es el optimismo forzado — es la conciencia real de alguien en proceso activo de cambio. Hay movimiento genuino. Eso merece ser reconocido.`
      : `Tu reflexión de hoy muestra una persona en crecimiento activo: hay conciencia de lo que sientes, hay acción y hay intención de mejorar. Los tres son necesarios, y tú los tienes.`;
  } else {
    apertura = t1
      ? `Describes ${cita(t1,7)}. Hay presencia en esas palabras — la capacidad de observarte sin huir de lo que encuentras. Desde la psicología humanista de Rogers, esa conciencia sin juicio es la base sobre la que se construye cualquier cambio auténtico.`
      : `El hecho de abrir este espacio y responder con honestidad ya es en sí mismo un acto terapéutico. Estás prestándote atención, y eso tiene más valor del que parece.`;
  }
  partes.push(apertura);

  // ── BLOQUE B: PATRONES COGNITIVOS (Beck) ─────────────
  if(dist.length > 0){
    const msgs = {
      obligatorio: `Aparecen en tu texto palabras como "debería" o "tendría que". En terapia cognitiva esto se llama pensamiento obligatorio — una voz interior muy exigente que condiciona tu valor a cumplir estándares imposibles. Esa voz aprendió a ser tan dura, y puede aprender a ser más justa.`,
      absolutista:  `Usas términos absolutos: "siempre", "nunca", "todo" o "nada". El pensamiento absolutista amplifica el sufrimiento porque borra los matices reales de la situación. Cuando todo parece negro, casi siempre hay grises que la mente en dolor no ve.`,
      etiquetado:   `Hay expresiones en las que te describes de forma muy dura y permanente. Esto es lo que Beck llama etiquetado negativo: convertir un comportamiento puntual en una identidad fija. "Fallé en esto" es muy diferente a "soy un fracaso". La primera es un hecho; la segunda, una mentira que duele.`,
      lectura_mental:`Aparece la preocupación por lo que otros piensan o juzgan. Anticipar el juicio ajeno antes de que ocurra es una fuente enorme de ansiedad. La realidad: generalmente nos imaginamos juicios mucho más severos que los reales.`,
      prediccion:   `Hay cierta tendencia a anticipar que las cosas saldrán mal. Esta predicción negativa tiene sentido cuando el pasado fue doloroso — pero es también una trampa cognitiva. La pregunta que rompe ese patrón es: ¿qué evidencia real tengo de que esto va a salir mal?`
    };
    const msg = dist.map(d=>msgs[d]).filter(Boolean)[0];
    if(msg) partes.push(msg);
  }

  // ── BLOQUE C: AUTOCONOCIMIENTO (Siegel) ──────────────
  if(t3){
    partes.push(`Sobre lo que aprendiste hoy de ti misma escribiste: ${cita(t3,10)}. Desde la neurociencia interpersonal de Daniel Siegel, este tipo de reflexión — observar el propio estado interno y ponerle palabras — activa la corteza prefrontal medial y regula la amígdala. No es metáfora: escribir sobre lo que sientes cambia literalmente tu cerebro.`);
  }

  // ── BLOQUE D: LÍMITES (Gottman + Brené Brown) ────────
  if(t2 && t2.length > 5){
    partes.push(`Mencionas que pusiste un límite: "${corta(t2,65)}". Gottman y Brown coinciden en algo fundamental: los límites sanos no son muros ni rechazo — son comunicación directa de necesidades. Cada límite que estableces le enseña a tu entorno cómo tratarte, y te enseña a ti misma que tus necesidades son legítimas y merecen espacio.`);
  } else if(cargaNeg >= 2){
    partes.push(`No aparece ningún límite que hayas podido poner hoy. Cuando la carga emocional es alta, la capacidad de establecer límites se reduce — pero también es cuando más se necesitan. Una pregunta para explorar: ¿en qué relación o situación estás dando más de lo que puedes sostener?`);
  }

  // ── BLOQUE E: SOLTAR (Yalom — psicoterapia existencial) ─
  if(t4 && t4.length > 5){
    partes.push(`Dices que necesitas soltar ${cita(t4,8)}. Desde la psicoterapia existencial de Yalom, soltar no es olvidar ni traicionar lo que fue — es elegir conscientemente no dejar que algo ya ocurrido siga determinando lo que haces hoy. Esa elección, aunque pequeña, es uno de los actos de libertad más profundos que existen.`);
  }

  // ── BLOQUE F: AUTOCOMPASIÓN (Kristin Neff) ───────────
  if(t5 && t5.length > 5){
    partes.push(`Te sientes orgullosa de ${cita(t5,8)}. Kristin Neff, referente mundial en autocompasión, señala que reconocerse sin minimizar los propios logros es uno de los indicadores más sólidos de salud emocional. No pases por alto lo que escribiste. Ese logro, aunque te parezca pequeño, fue real.`);
  } else if(!t5 || t5.length <= 3){
    partes.push(`No has identificado nada de lo que sentirte orgullosa hoy. Esto puede indicar que el filtro autocrítico está muy activo, o que el agotamiento hace difícil ver lo que sí funciona. Tarea pequeña y concreta: busca una sola cosa que hayas hecho bien hoy — aunque sea haber completado esta reflexión.`);
  }

  // ── BLOQUE G: TRAUMA (Van der Kolk) ── solo si hay señales ─
  if(trauma){
    partes.push(`Hay señales en lo que escribes que sugieren que algunas experiencias pasadas siguen activas — en tus reacciones, en tu cuerpo, en cómo te relacionas. Lo que Van der Kolk describe como la huella del trauma no es un diagnóstico, sino una explicación: ciertas respuestas tuyas que quizás no entiendes tienen sentido a la luz de lo que has vivido. Acompañamiento profesional especializado en trauma podría ser muy valioso para ti.`);
  }

  // ── BLOQUE H: SENTIDO (Frankl) ───────────────────────
  if(sinSentido && !conSentido){
    partes.push(`Aparece en tu reflexión la pregunta del "¿para qué?". Frankl enseñó que el sufrimiento sin sentido es mucho más devastador que el que podemos integrar en una historia con significado. No tienes que tener la respuesta hoy. Pero vale la pena hacerse la pregunta: ¿qué parte de lo que estás viviendo podría tener un propósito, aunque todavía no lo veas?`);
  }

  // ── BLOQUE I: NECESIDADES CONCRETAS ──────────────────
  const necesidades = [];
  if(D.soledad) necesidades.push('Conexión genuina: busca una persona con quien puedas hablar de verdad, sin tener que estar bien.');
  if(D.agotamiento) necesidades.push('Descanso real: no hacer menos cosas, sino parar completamente. Tu sistema nervioso lo necesita.');
  if(D.ansiedad) necesidades.push('Regulación del sistema nervioso: respiración diafragmática, movimiento físico suave, técnicas de grounding.');
  if(D.autoexigencia) necesidades.push('Trabajar la voz crítica interior: cada "debería" que te dices merece ser cuestionado. ¿Es eso realmente tuyo o es una voz que aprendiste?');
  if(dist.includes('absolutista') || dist.includes('prediccion')) necesidades.push('Cuestionar los pensamientos automáticos: escríbelos, y después busca evidencia real a favor y en contra.');
  if(D.depresion && !D.progreso) necesidades.push('Estructurar pequeñas victorias diarias: cuando todo parece pesado, recuperar la sensación de agencia empieza con acciones mínimas y concretas.');
  if(trauma) necesidades.push('Explorar acompañamiento terapéutico especializado en trauma — no porque estés rota, sino porque mereces más que cargar esto sola.');
  if(!rec.interpersonal && cargaNeg >= 2) necesidades.push('Practicar comunicar necesidades directamente, sin esperar a que otros las adivinen.');

  if(necesidades.length > 0){
    const lista = necesidades.slice(0,4).map((n,i)=>`${i+1}. ${n}`).join('\n');
    partes.push(`LO QUE TU SITUACIÓN PIDE AHORA:\n\n${lista}`);
  }

  // ── BLOQUE J: CIERRE CLÍNICO Y HUMANO ────────────────
  if(cargaNeg >= 4 || trauma){
    partes.push(`Una nota importante: lo que describes hoy sugiere que podrías beneficiarte de acompañamiento profesional — no porque estés rota, sino porque mereces tener a alguien especializado a tu lado en este proceso. La terapia no es para cuando todo falla; es para cuando quieres avanzar con apoyo real.`);
  } else if(D.progreso && cargaPos >= 2){
    partes.push(`Estás en un momento de proceso genuino. Hay conciencia, hay movimiento y hay intención. Cada entrada que completas aquí es un dato sobre quién eres y hacia dónde vas. Sigue registrando. Sigue mirándote.`);
  } else if(cargaNeg === 0 && cargaPos === 0){
    partes.push(`Hoy ha sido un día de observación tranquila. No todos los días necesitan grandes revelaciones. A veces el trabajo más profundo ocurre exactamente aquí: en los días ordinarios, cuando simplemente te prestas atención sin exigirte nada extraordinario.`);
  } else {
    partes.push(`Cada reflexión que completas es información clínica sobre ti misma: sobre tus patrones, tus necesidades y tu capacidad de observarte sin juzgarte. Con el tiempo, este registro se convierte en un mapa real de tu crecimiento.`);
  }

  return partes.join('\n\n');
}
function renderTerapiaHist(){
  const hist = JSON.parse(localStorage.getItem('inq-terapia-hist') || '[]');
  const el   = document.getElementById('terapia-hist');
  if(!hist.length){ el.innerHTML = '<div class="hist-empty">Tus reflexiones guardadas aparecerán aquí.</div>'; return; }
  const LABELS = ['¿Qué sentiste hoy?','¿Qué límite pusiste?','¿Qué aprendiste?','¿Qué sueltas?','¿De qué te enorgulleces?'];
  el.innerHTML = hist.slice(0,10).map(h => {
    const fecha = new Date(h.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
    const respuestas = [1,2,3,4,5].filter(i => h['ta'+i])
      .map(i => `<div class="terapia-hist-item"><span class="terapia-hist-q">${LABELS[i-1]}</span><span class="terapia-hist-r">${h['ta'+i].slice(0,80)}${h['ta'+i].length>80?'…':''}</span></div>`)
      .join('');
    return `<div class="terapia-hist-card">
      <div class="terapia-hist-fecha">${fecha}</div>
      ${respuestas}
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════
// PERFIL
// ═══════════════════════════════════════
function renderPerfil(){
  const sess  = JSON.parse(localStorage.getItem('inq-session') || '{}');
  const noauth = document.getElementById('perfil-noauth');

  if(!sess.loggedIn){
    noauth.style.display = 'block';
    document.getElementById('perfil-avatar').textContent = '?';
    document.getElementById('perfil-nombre').textContent = 'Sin cuenta';
    document.getElementById('perfil-nick').textContent   = '';
    return;
  }
  noauth.style.display = 'none';

  const letra = (sess.nick || sess.email || 'U')[0].toUpperCase();
  document.getElementById('perfil-avatar').textContent   = letra;
  document.getElementById('perfil-nombre').textContent   = sess.nick || sess.email;
  document.getElementById('perfil-nick').textContent     = sess.email || '';

  // fecha miembro
  const accs = JSON.parse(localStorage.getItem('inq-accounts') || '{}');
  const acc  = accs[sess.email] || {};
  if(acc.fecha){
    const f = new Date(acc.fecha).toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    document.getElementById('perfil-miembro').textContent = 'Miembro desde ' + f;
  }

  // stats
  const dias  = calcDiasFuertes(getProgresoData());
  const posts = JSON.parse(localStorage.getItem('inq-posts') || '[]')
    .filter(p => p.autor === sess.nick).length;
  const lvl   = localStorage.getItem('inq-user-level');
  const LVLS  = ['La Grieta','El Despertar','Reconstrucción','Inquebrantable'];
  document.getElementById('perfil-dias').textContent  = dias;
  document.getElementById('perfil-posts').textContent = posts;
  document.getElementById('perfil-nivel').textContent = lvl !== null ? LVLS[+lvl] : '—';

  // bio guardada
  const bio = localStorage.getItem('inq-bio-' + sess.email) || '';
  document.getElementById('perfil-bio').value = bio;

  // historial SOS
  const sosHistEl = document.getElementById('perfil-sos-hist');
  if(sosHistEl){
    const sosHist = JSON.parse(localStorage.getItem('inq-sos-hist') || '[]');
    if(!sosHist.length){
      sosHistEl.innerHTML = '<div class="hist-empty">Aún no has usado el Modo SOS.</div>';
    } else {
      sosHistEl.innerHTML = sosHist.slice(0,8).map(s => {
        const f = new Date(s.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
        return `<div class="hist-item" style="margin-bottom:8px">
          <span class="hist-dot" style="color:rgba(122,175,139,0.8)">◎</span>
          <span class="hist-fecha">${f}</span>
          <span style="font-size:11px;color:var(--muted);margin-left:8px">${s.ciclos} ciclo${s.ciclos!==1?'s':''}</span>
        </div>`;
      }).join('');
    }
  }
}
function guardarPerfil(){
  const sess = JSON.parse(localStorage.getItem('inq-session') || '{}');
  if(!sess.loggedIn){ mostrarMsg('perfil-msg','Necesitas sesión para guardar.','err'); return; }
  const bio  = document.getElementById('perfil-bio').value.trim();
  localStorage.setItem('inq-bio-' + sess.email, bio);
  mostrarMsg('perfil-msg','Perfil guardado ✦','ok');
}

// ═══════════════════════════════════════
// NOTIFICACIONES
// ═══════════════════════════════════════
function getNotifs(){
  return JSON.parse(localStorage.getItem('inq-notifs') || '[]');
}
function saveNotifs(n){ localStorage.setItem('inq-notifs', JSON.stringify(n)); }
function añadirNotif(texto, tipo){
  const notifs = getNotifs();
  notifs.unshift({ id: Date.now(), texto, tipo: tipo||'general', leida: false, fecha: new Date().toISOString() });
  saveNotifs(notifs.slice(0,50));
  actualizarBadge();
}
function actualizarBadge(){
  const n = getNotifs().filter(n => !n.leida).length;
  const badge = document.getElementById('notifBadge');
  if(!badge) return;
  badge.style.display = n > 0 ? 'flex' : 'none';
  badge.textContent   = n > 9 ? '9+' : n;
}
function renderNotifs(){
  const notifs = getNotifs();
  const el     = document.getElementById('notif-list');
  if(!notifs.length){ el.innerHTML = '<div class="hist-empty">No tienes notificaciones todavía.</div>'; return; }
  el.innerHTML = notifs.map(n => {
    const fecha = new Date(n.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    return `<div class="notif-item ${n.leida?'notif-leida':''}" onclick="leerNotif(${n.id})">
      <div class="notif-texto">${n.texto}</div>
      <div class="notif-fecha">${fecha}</div>
      ${!n.leida ? '<div class="notif-dot"></div>' : ''}
    </div>`;
  }).join('');
}
function leerNotif(id){
  const notifs = getNotifs().map(n => n.id===id ? {...n, leida:true} : n);
  saveNotifs(notifs);
  actualizarBadge();
  renderNotifs();
}
function marcarTodasLeidas(){
  saveNotifs(getNotifs().map(n => ({...n, leida:true})));
  actualizarBadge();
  renderNotifs();
}

// notificación motivadora diaria
(function notifDiaria(){
  const hoy  = new Date().toDateString();
  const last = localStorage.getItem('inq-notif-diaria');
  if(last !== hoy){
    const msgs = [
      '🌸 Hoy es un buen día para elegirte a ti.',
      '✦ Cada paso que das importa. Sigue.',
      '💙 Eres más fuerte de lo que crees.',
      '🌙 El descanso también es parte del camino.',
      '◎ Respira. Estás exactamente donde debes estar.'
    ];
    añadirNotif(msgs[Math.floor(Math.random()*msgs.length)], 'diaria');
    localStorage.setItem('inq-notif-diaria', hoy);
  }
  actualizarBadge();
})();

// ═══════════════════════════════════════
// HELPER — mensajes inline
// ═══════════════════════════════════════
function mostrarMsg(id, txt, tipo){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = txt;
  el.style.color = tipo === 'ok' ? 'var(--gold)' : 'var(--rose)';
  setTimeout(() => { el.textContent = ''; }, 3500);
}

// ═══════════════════════════════════════
// COMUNIDAD — extender publicarPost para notifs
// ═══════════════════════════════════════
const _origPublicar = publicarPost;
// ya existe publicarPost, solo añadimos notif al hacer like
const _origToggleHeart = toggleHeart;
window.toggleHeartExtended = function(id){
  _origToggleHeart(id);
  const sess = JSON.parse(localStorage.getItem('inq-session') || '{}');
  if(sess.loggedIn) añadirNotif('💗 Diste apoyo a una publicación del refugio.', 'apoyo');
};

// ─────────────────────────────────────
// SOS — ciclos guiados con voz
// ─────────────────────────────────────
const SOS_PHRASES = [
  "Todo pasa. Incluso esto.",
  "Estás a salvo en este momento.",
  "No tienes que resolver nada ahora.",
  "Tu respiración te devuelve a ti.",
  "Un aliento a la vez. Eso es suficiente.",
  "Esto que sientes es temporal.",
  "Estás volviendo a ti con cada espiración.",
  "Aquí, contigo, en este instante.",
  "La calma ya está dentro de ti.",
  "Respira. El mundo puede esperar."
];
const SOS_MAX_CICLOS = 10;

let sosBreathPhase  = 0;
let sosBreathTimer  = null;
let sosActive       = false;
let sosCiclosActual = 0;

function getSosHistorial(){
  return JSON.parse(localStorage.getItem('inq-sos-hist') || '[]');
}
function getSosCount(){
  const today = new Date().toDateString();
  const data  = JSON.parse(localStorage.getItem('inq-sos-count') || '{}');
  return data.date === today ? (data.count || 0) : 0;
}
function incrementSosCount(){
  const today = new Date().toDateString();
  const count = getSosCount() + 1;
  localStorage.setItem('inq-sos-count', JSON.stringify({ date: today, count }));
  return count;
}
function renderSosCounter(){
  const count = getSosCount();
  const lbl   = document.getElementById('sos-rescue-label');
  if(lbl) lbl.textContent = count > 0 ? count + ' sesión' + (count > 1 ? 'es' : '') + ' hoy' : '';
}

function hablarSOS(texto){
  return new Promise(resolve => {
    if(!window.speechSynthesis){ setTimeout(resolve, 200); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang   = 'es-ES';
    u.rate   = 0.68;   // muy suave y lento
    u.pitch  = 1.10;   // dulce
    u.volume = 0.80;
    const voces = speechSynthesis.getVoices();
    const vFem = voces.find(v => v.lang.startsWith('es') && /female|mujer|Monica|Paulina|Lucia|Conchita|María|Valeria/i.test(v.name))
              || voces.find(v => v.lang.startsWith('es'));
    if(vFem) u.voice = vFem;
    u.onend = resolve; u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

function startSOSBreathing(){
  if(sosActive) return;
  sosActive       = true;
  sosCiclosActual = 0;
  sosBreathPhase  = 0;

  incrementSosCount();
  renderSosCounter();

  const circle   = document.getElementById('breath-circle');
  const circTxt  = document.getElementById('breath-circle-text');
  const phaseLbl = document.getElementById('sos-phase-label');
  const phraseEl = document.getElementById('sos-phrase');
  const startBtn = document.getElementById('sos-start-btn');
  const stopBtn  = document.getElementById('sos-stop-btn');
  const ciclosRow= document.getElementById('sos-ciclos-row');
  const ciclosNum= document.getElementById('sos-ciclos-num');
  const reflexEl = document.getElementById('sos-reflexion');

  startBtn.style.display = 'none';
  stopBtn.style.display  = 'block';
  ciclosRow.style.display= 'flex';
  reflexEl.style.display = 'none';

  clearInterval(sosBreathTimer);

  async function runFase(){
    if(!sosActive) return;

    // frase al inicio de cada ciclo completo
    if(sosBreathPhase === 0){
      phraseEl.classList.add('fade');
      setTimeout(()=>{
        phraseEl.textContent = SOS_PHRASES[sosCiclosActual % SOS_PHRASES.length];
        phraseEl.classList.remove('fade');
      }, 400);
    }

    circle.classList.remove('sos-expand','sos-hold','sos-contract');
    void circle.offsetWidth;

    if(sosBreathPhase === 0){
      circTxt.textContent = 'Inhala'; phaseLbl.textContent = '4 seg';
      circle.classList.add('sos-expand');
      await hablarSOS('Inhala');
    } else if(sosBreathPhase === 1){
      circTxt.textContent = 'Mantén'; phaseLbl.textContent = '4 seg';
      circle.classList.add('sos-hold');
      await hablarSOS('Mantén');
    } else {
      circTxt.textContent = 'Exhala'; phaseLbl.textContent = '4 seg';
      circle.classList.add('sos-contract');
      await hablarSOS('Exhala');
    }

    sosBreathPhase = (sosBreathPhase + 1) % 3;

    // ciclo completo
    if(sosBreathPhase === 0){
      sosCiclosActual++;
      ciclosNum.textContent = sosCiclosActual;
      if(sosCiclosActual >= SOS_MAX_CICLOS){
        sosActive = false;
        finalizarSOS(sosCiclosActual);
        return;
      }
    }

    if(!sosActive) return;
    sosBreathTimer = setTimeout(runFase, 4000);
  }

  runFase();
}

function sosMejor(){
  sosActive = false;
  clearTimeout(sosBreathTimer);
  speechSynthesis && speechSynthesis.cancel();
  finalizarSOS(sosCiclosActual);
}

function finalizarSOS(ciclos){
  const circle   = document.getElementById('breath-circle');
  const stopBtn  = document.getElementById('sos-stop-btn');
  const startBtn = document.getElementById('sos-start-btn');
  const phaseLbl = document.getElementById('sos-phase-label');
  const circTxt  = document.getElementById('breath-circle-text');
  const reflexEl = document.getElementById('sos-reflexion');
  const postEl   = document.getElementById('sos-post');

  circle.classList.remove('sos-expand','sos-hold','sos-contract');
  circTxt.textContent  = '✦';
  phaseLbl.textContent = '';
  stopBtn.style.display  = 'none';
  startBtn.style.display = 'block';
  startBtn.innerHTML     = '<span>Volver a respirar</span>';

  // reflexión final según ciclos
  let reflexion;
  if(ciclos <= 3){
    reflexion = 'Volviste a ti misma muy rápido. Eso no es poca cosa — es una señal de que te estás conociendo mejor.';
  } else if(ciclos <= 6){
    reflexion = 'Le diste a tu cuerpo el tiempo que necesitaba. Quedarte contigo en los momentos difíciles es un acto de amor propio.';
  } else {
    reflexion = 'Te quedaste. Respiraste. Volviste. Eso es todo lo que había que hacer, y lo hiciste.';
  }

  reflexEl.textContent = reflexion;

  // Limpiar textarea y hints previos
  const ta = document.getElementById('sos-textarea');
  const hint = document.getElementById('sos-escribe-hint');
  if(ta){ ta.value = ''; ta.oninput = () => { if(hint) hint.textContent = ''; }; }
  if(hint) hint.textContent = '';

  // Mostrar sección post
  if(postEl) postEl.style.display = 'block';

  // guardar en historial
  const hist = getSosHistorial();
  hist.unshift({ fecha: new Date().toISOString(), ciclos });
  localStorage.setItem('inq-sos-hist', JSON.stringify(hist.slice(0, 50)));

  hablarSOS('Has vuelto. Estás aquí.');
  renderSosCounter();
  registrarHabito('sos');
  añadirNotif('✦ Completaste una sesión SOS.', 'sos');

  // scroll suave hacia la reflexión
  setTimeout(() => {
    const wrap = document.querySelector('.sos-fullscreen');
    if(wrap) wrap.scrollTo({ top: wrap.scrollHeight, behavior: 'smooth' });
  }, 400);
}

function guardarEscrituraSOS(){
  const ta   = document.getElementById('sos-textarea');
  const hint = document.getElementById('sos-escribe-hint');
  const texto = (ta ? ta.value : '').trim();

  if(!texto){
    if(hint) hint.textContent = 'Escribe algo, aunque sea una palabra.';
    return;
  }

  // Guardar en historial SOS con nota
  const hist = getSosHistorial();
  if(hist.length > 0) hist[0].nota = texto;
  localStorage.setItem('inq-sos-hist', JSON.stringify(hist.slice(0, 50)));

  // Respuesta empática breve
  const textoL = texto.toLowerCase();
  let respuesta;
  if(['triste','llorar','dolor','sola','rota','vacía','perdida'].some(k=>textoL.includes(k))){
    respuesta = 'Lo que sientes es válido. Y el hecho de que puedas nombrarlo ya es un paso.';
  } else if(['ansiosa','miedo','angustia','nervios','pánico','agobio'].some(k=>textoL.includes(k))){
    respuesta = 'La ansiedad miente sobre el futuro. Tú estás aquí, ahora, y estás bien.';
  } else if(['rabia','harta','frustrada','enfadada','molesta'].some(k=>textoL.includes(k))){
    respuesta = 'Tu rabia tiene razón en existir. Lo que haces con ella es tuyo. Y hoy elegiste respirar.';
  } else {
    respuesta = 'Gracias por escribirlo. Queda aquí, contigo. Puedes soltarlo ahora.';
  }

  if(hint){
    hint.textContent = respuesta;
    hint.style.color = 'rgba(190,215,245,0.65)';
    hint.style.fontSize = '12px';
  }
  if(ta){
    ta.style.borderColor = 'rgba(140,170,220,0.30)';
    ta.disabled = true;
  }
  const btn = document.querySelector('.sos-escribe-btn span');
  if(btn){ btn.textContent = 'Guardado ✦'; }

  añadirNotif('✦ Escribiste cómo te sentías después del SOS.', 'sos');
}

function stopSOSBreathing(){
  sosActive = false;
  clearTimeout(sosBreathTimer);
  speechSynthesis && speechSynthesis.cancel();
  const circle = document.getElementById('breath-circle');
  circle.classList.remove('sos-expand','sos-hold','sos-contract');
  document.getElementById('breath-circle-text').textContent = '✦';
  document.getElementById('sos-phase-label').textContent    = '';
  document.getElementById('sos-phrase').textContent         = 'Estás a salvo en este momento.';
  document.getElementById('sos-phrase').classList.remove('fade');
  const btn = document.getElementById('sos-start-btn');
  btn.style.display = 'block';
  btn.innerHTML = '<span>Respirar contigo</span>';
  const stopBtn = document.getElementById('sos-stop-btn');
  if(stopBtn) stopBtn.style.display = 'none';
  const postEl = document.getElementById('sos-post');
  if(postEl) postEl.style.display = 'none';
}
// ─────────────────────────────────────
// PWA — Service Worker
// ─────────────────────────────────────
// ═══════════════════════════════════════
// SISTEMA PREMIUM
// ═══════════════════════════════════════
function isPremium(){ return user.premium; }

function requierePremium(feature){ return !checkPremium(feature); }

function activarPremiumDemo(){
  user.premium = true;
  toast('✦ Premium activado — 7 días gratis');
  setTimeout(() => go('inicio'), 1200);
}

function irAProgramas(){
  if(requierePremium('programas')) return;
  go('programas');
}

// ── Override terapia para requerir premium ──
const _go_orig = go;
// (no sobreescribimos go, usamos wrapper específico para terapia)
function irATerapia(){
  if(requierePremium('terapia')) return;
  go('terapia');
}

// ═══════════════════════════════════════
// PROGRAMAS DE RECONSTRUCCIÓN
// ═══════════════════════════════════════
const PROGRAMAS = [
  {
    id: 'volver-a-ti',
    icon: '🌱',
    name: 'Volver a ti',
    desc: 'Un programa de 21 días para reconectarte con quien eres cuando nadie te mira. Para las que se perdieron cuidando a todos los demás.',
    tags: ['identidad','autoconocimiento','21 días'],
    semanas: 3,
    ejercicios: [
      'Escribe 3 cosas que hacías antes que te daban vida',
      'Pasa 10 minutos sola sin el móvil. Observa qué sientes',
      'Identifica una creencia sobre ti misma que ya no te sirve',
      'Haz algo hoy solo por ti, sin justificarlo',
      'Escribe una carta a la versión de ti que empezó este programa',
    ]
  },
  {
    id: 'recuperar-valor',
    icon: '💎',
    name: 'Recuperar tu valor',
    desc: 'Para cuando alguien te convenció de que vales menos. 14 días para recordar quién eres y qué mereces.',
    tags: ['autoestima','límites','14 días'],
    semanas: 2,
    ejercicios: [
      'Anota una vez que alguien te trató bien y lo rechazaste. ¿Por qué?',
      'Lista 5 cosas que haces bien sin necesitar que nadie lo confirme',
      'Identifica a alguien que drena tu energía. ¿Qué límite necesitas?',
      'Di NO a algo hoy. Sin dar explicaciones largas',
      'Escribe qué mereces recibir en una relación sana',
    ]
  },
  {
    id: 'poner-limites',
    icon: '🔆',
    name: 'Poner límites',
    desc: 'Los límites no son muros, son puertas que tú controlas. 10 días de práctica real para aprender a decir lo que necesitas.',
    tags: ['límites','comunicación','10 días'],
    semanas: 2,
    ejercicios: [
      'Identifica un área donde no tienes límites. ¿Qué ocurre ahí?',
      'Practica decir "necesito pensarlo" antes de comprometerte',
      'Escribe cómo te sientes cuando dices SÍ sin querer',
      'Observa: ¿quién respeta tus límites? ¿quién no?',
      'Define un límite concreto que pondrás esta semana',
    ]
  },
  {
    id: 'sanar-relacion',
    icon: '🌊',
    name: 'Sanar una relación tóxica',
    desc: 'Para las que salieron — o están saliendo — de una relación que las dejó pequeñas. 30 días de reconstrucción real.',
    tags: ['trauma','recuperación','30 días'],
    semanas: 4,
    ejercicios: [
      'Escribe sin filtros cómo te hizo sentir esa relación',
      'Identifica qué necesidades intentabas cubrir ahí',
      'Lista las señales que ignoraste. Sin juzgarte',
      'Escribe qué parte de ti sobrevivió a esa relación',
      'Describe cómo sería una relación que sí te cuida',
    ]
  }
];

function renderProgramas(){
  const el = document.getElementById('programas-lista');
  if(!el) return;
  el.innerHTML = PROGRAMAS.map(p => {
    const progreso = JSON.parse(localStorage.getItem('inq-prog-' + p.id) || '{"paso":0}');
    const pct = Math.round((progreso.paso / p.ejercicios.length) * 100);
    return `
    <div class="programa-card" onclick="abrirPrograma('${p.id}')">
      <div class="programa-header">
        <span class="programa-icon">${p.icon}</span>
        <span class="programa-name">${p.name}</span>
      </div>
      <div class="programa-desc">${p.desc}</div>
      <div class="programa-tags">
        ${p.tags.map(t=>`<span class="programa-tag">${t}</span>`).join('')}
      </div>
      ${pct > 0 ? `<div style="margin-top:10px;height:2px;background:var(--border);border-radius:2px">
        <div style="height:100%;width:${pct}%;background:var(--rose);border-radius:2px;transition:width 0.5s"></div>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:4px;letter-spacing:1px">${pct}% completado</div>` : ''}
    </div>`;
  }).join('');
}

let _progActualId = null;

function abrirPrograma(id){
  const p = PROGRAMAS.find(x => x.id === id);
  if(!p) return;
  _progActualId = id;

  const progreso = JSON.parse(localStorage.getItem('inq-prog-' + id) || '{"paso":0,"reflexiones":{}}');
  const paso = progreso.paso;
  const totalPasos = p.ejercicios.length;
  const completado = paso >= totalPasos;
  const pct = Math.min(Math.round((paso / totalPasos) * 100), 100);

  // Rellenar cabecera
  document.getElementById('prog-det-icon').textContent    = p.icon;
  document.getElementById('prog-det-name').textContent    = p.name;
  document.getElementById('prog-det-semanas').textContent = p.tags.join(' · ');
  document.getElementById('prog-det-desc').textContent    = p.desc;
  document.getElementById('prog-det-barra').style.width   = pct + '%';
  document.getElementById('prog-det-pct').textContent     = completado ? 'Completado ✦' : pct + '% completado · Paso ' + (paso + 1) + ' de ' + totalPasos;

  const ejercicioWrap = document.getElementById('prog-det-ejercicio-wrap');
  const reflexionWrap = document.getElementById('prog-det-reflexion-wrap');
  const completoEl    = document.getElementById('prog-det-completo');
  const ta            = document.getElementById('prog-det-textarea');
  const hint          = document.getElementById('prog-det-hint');
  const btnGuardar    = document.getElementById('prog-btn-guardar');

  if(completado){
    ejercicioWrap.style.display = 'none';
    reflexionWrap.style.display = 'none';
    completoEl.style.display    = 'block';
  } else {
    ejercicioWrap.style.display = 'block';
    reflexionWrap.style.display = 'block';
    completoEl.style.display    = 'none';

    document.getElementById('prog-det-paso-lbl').textContent =
      'Ejercicio ' + (paso + 1) + ' de ' + totalPasos;
    document.getElementById('prog-det-ejercicio').textContent = p.ejercicios[paso];

    // Cargar reflexión guardada si existe
    const reflexGuardada = (progreso.reflexiones || {})[paso] || '';
    ta.value    = reflexGuardada;
    ta.disabled = false;
    if(hint) hint.textContent = '';
    if(btnGuardar){
      const span = btnGuardar.querySelector ? btnGuardar : btnGuardar;
      btnGuardar.textContent = reflexGuardada ? 'Reflexión guardada ✦' : 'Guardar reflexión';
      btnGuardar.style.opacity = '1';
    }
  }

  // Mostrar detalle, ocultar lista
  document.getElementById('prog-vista-lista').style.display  = 'none';
  document.getElementById('prog-vista-detalle').style.display = 'block';

  // Scroll al top
  const scroll = document.querySelector('#s-programas .screen-scroll');
  if(scroll) scroll.scrollTop = 0;
}

function cerrarDetalleProg(){
  document.getElementById('prog-vista-detalle').style.display = 'none';
  document.getElementById('prog-vista-lista').style.display   = 'block';
  renderProgramas();
  _progActualId = null;
}

function checkProgBtnEscrip(){
  // nada — el botón siempre está activo
}

function guardarReflexionProg(){
  if(!_progActualId) return;
  const ta   = document.getElementById('prog-det-textarea');
  const hint = document.getElementById('prog-det-hint');
  const btn  = document.getElementById('prog-btn-guardar');
  const texto = (ta ? ta.value : '').trim();
  if(!texto){
    if(hint) hint.textContent = 'Escribe algo antes de guardar.';
    return;
  }

  const p = PROGRAMAS.find(x => x.id === _progActualId);
  const progreso = JSON.parse(localStorage.getItem('inq-prog-' + _progActualId) || '{"paso":0,"reflexiones":{}}');
  if(!progreso.reflexiones) progreso.reflexiones = {};
  progreso.reflexiones[progreso.paso] = texto;
  localStorage.setItem('inq-prog-' + _progActualId, JSON.stringify(progreso));

  if(hint) hint.textContent = 'Guardado. Puedes completar el ejercicio cuando te sientas lista.';
  if(btn){ btn.textContent = 'Reflexión guardada ✦'; btn.style.opacity = '0.7'; }

  toast('Reflexión guardada ✦');
}

function completarEjercicioProg(){
  if(!_progActualId) return;
  const p = PROGRAMAS.find(x => x.id === _progActualId);
  if(!p) return;
  const progreso = JSON.parse(localStorage.getItem('inq-prog-' + _progActualId) || '{"paso":0,"reflexiones":{}}');
  const ta   = document.getElementById('prog-det-textarea');
  const texto = (ta ? ta.value : '').trim();

  // Guardar reflexión si hay texto
  if(texto){
    if(!progreso.reflexiones) progreso.reflexiones = {};
    progreso.reflexiones[progreso.paso] = texto;
  }

  progreso.paso = (progreso.paso || 0) + 1;
  localStorage.setItem('inq-prog-' + _progActualId, JSON.stringify(progreso));

  registrarHabito('programa');
  toast('Paso completado ✦');

  // Refrescar la vista detalle
  abrirPrograma(_progActualId);
}

// ═══════════════════════════════════════
// SISTEMA DE HÁBITO DIARIO
// ═══════════════════════════════════════
const HABITO_MSGS = {
  ritual:   ['Un día más cuidándote. Eso también es fuerza.', 'Tres minutos para ti. Hoy los usaste bien.', 'La constancia es la forma más silenciosa de amarte.'],
  sos:      ['Pediste ayuda a tu propio cuerpo. Eso es valentía.', 'Supiste parar. No todo el mundo sabe hacerlo.', 'Cada vez que lo usas, aprendes a cuidarte mejor.'],
  terapia:  ['Hoy te miraste por dentro. Eso no es fácil.', 'La reflexión que hiciste hoy es semilla de mañana.', 'Escribir lo que sientes es uno de los actos más valientes.'],
  programa: ['Un paso más en tu camino. No se borran.', 'Hoy avanzaste. Aunque nadie lo vea, tú lo sabes.']
};

function registrarHabito(tipo){
  const hoy = new Date().toDateString();
  const habitos = JSON.parse(localStorage.getItem('inq-habitos') || '{}');

  // Evitar mostrar el mismo tipo dos veces al día
  if(habitos[hoy] && habitos[hoy].includes(tipo)) return;
  if(!habitos[hoy]) habitos[hoy] = [];
  habitos[hoy].push(tipo);
  localStorage.setItem('inq-habitos', JSON.stringify(habitos));

  // Aumentar días fuertes si completa 2+ hábitos hoy
  if(habitos[hoy].length >= 2){
    const d = getProgresoData();
    const diasHoy = new Date().toDateString();
    if(d.ultimoHabito !== diasHoy){
      d.ultimoHabito = diasHoy;
      saveProgresoData(d);
    }
  }

  // Mostrar mensaje de hábito
  const msgs = HABITO_MSGS[tipo] || HABITO_MSGS.ritual;
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  mostrarHabitoToast(msg, tipo === 'sos' ? '💙' : tipo === 'terapia' ? '✦' : '🌱');
}

function mostrarHabitoToast(msg, icon){
  const t = document.getElementById('habito-toast');
  const i = document.getElementById('habito-toast-icon');
  const m = document.getElementById('habito-toast-msg');
  // Limpiar botones previos
  t.querySelectorAll('button').forEach(b => b.remove());
  if(i) i.textContent = icon || '✦';
  if(m) m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 5000);
}

