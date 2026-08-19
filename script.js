// ---------- Music ----------
  const bgAudio = document.getElementById('bgAudio');
  const musicBtn = document.getElementById('musicToggle');
  const musicHint = document.getElementById('musicHint');
  musicBtn.classList.add('paused');
  let hintTimer = null;

  function showMusicHint(){
    musicHint.style.opacity = '1';
    clearTimeout(hintTimer);
    hintTimer = setTimeout(()=>{ musicHint.style.opacity = '0'; }, 4000);
  }

  function toggleMusic(){
    if(bgAudio.paused){
      const p = bgAudio.play();
      if(p && p.then){
        p.then(()=>{ musicBtn.classList.remove('paused'); musicHint.style.opacity='0'; })
         .catch(()=>{ musicBtn.classList.add('paused'); showMusicHint(); });
      }
    } else {
      bgAudio.pause();
      musicBtn.classList.add('paused');
    }
  }

  function startMusicOnce(){
    bgAudio.volume = 0.75;
    const p = bgAudio.play();
    if(p && p.then){
      p.then(()=>{ musicBtn.classList.remove('paused'); })
       .catch(()=>{
         musicBtn.classList.add('paused');
         showMusicHint();
       });
    }
  }

  // ---------- Guest name from URL ----------
  const params = new URLSearchParams(window.location.search);
  const guest = params.get('to');
  if(guest){ document.getElementById('guestName').textContent = decodeURIComponent(guest.replace(/\+/g,' ')); }

  // ---------- Petals ----------
  const petalWrap = document.getElementById('petals');
  const symbols = ['&#10023;','&#10022;','&#8226;'];
  for(let i=0;i<18;i++){
    const p = document.createElement('div');
    p.className='petal';
    p.style.left = Math.random()*100+'%';
    p.style.animationDuration = (6+Math.random()*6)+'s';
    p.style.animationDelay = (Math.random()*6)+'s';
    p.style.fontSize = (10+Math.random()*10)+'px';
    p.innerHTML = symbols[Math.floor(Math.random()*symbols.length)];
    petalWrap.appendChild(p);
  }

  // ---------- Open invitation ----------
  function openInvitation(){
    const env = document.getElementById('envelope');
    env.classList.add('open');
    startMusicOnce();
    setTimeout(()=>{
      document.getElementById('cover').classList.add('opened');
      document.getElementById('content').style.display='block';
      document.body.style.overflow='auto';
      initReveal();
    }, 750);
  }
  document.body.style.overflow='hidden';

  // ---------- Scroll reveal ----------
  function initReveal(){
    const els = document.querySelectorAll('.fade-up');
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); } });
    }, {threshold:0.15});
    els.forEach(el=>obs.observe(el));
  }

  // ---------- Countdown ----------
  const target = new Date("2026-09-17T08:00:00+07:00").getTime();
  function tickCountdown(){
    const now = new Date().getTime();
    let diff = target - now;
    if(diff < 0) diff = 0;
    const d = Math.floor(diff/(1000*60*60*24));
    const h = Math.floor((diff/(1000*60*60))%24);
    const m = Math.floor((diff/(1000*60))%60);
    const s = Math.floor((diff/1000)%60);
    document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
    document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
    document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // ---------- Add to calendar (.ics) ----------
  function addToCalendar(){
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT",
      "SUMMARY:Pernikahan Abigail & Lathifa",
      "DTSTART:20260917T010000Z",
      "DTEND:20260917T090000Z",
      "LOCATION:Jl. Pilang Werda No.59, Pilangbango, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63117",
      "DESCRIPTION:Akad Nikah pukul 08.00 WIB dan Resepsi pukul 11.00 WIB.",
      "END:VEVENT","END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], {type:'text/calendar'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Pernikahan-Abigail-Lathifa.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ---------- RSVP pills ----------
  let selectedAttendance = null;
  document.querySelectorAll('.radio-pill').forEach(pill=>{
    pill.addEventListener('click', ()=>{
      document.querySelectorAll('.radio-pill').forEach(p=>p.classList.remove('active'));
      pill.classList.add('active');
      selectedAttendance = pill.dataset.val;
    });
  });

  // ======================================================================
  // GUESTBOOK BACKEND CONFIG
  // Isi 3 nilai di bawah ini dengan milikmu sendiri (Google Form + Sheet)
  // agar ucapan tersimpan permanen dan bisa dilihat semua tamu.
  // Selama masih kosong, ucapan tetap tampil indah tapi hanya di sesi
  // browser tamu itu sendiri (tidak tersimpan permanen / tidak dibagikan).
  // ======================================================================
  const GUESTBOOK = {
    formActionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSd_tpgjdU7MTYODcxgVsq-gx7646gzuVusscS0xKR8fMSxKpg/formResponse',
    entryName: 'entry.2022466084',
    entryAttendance: 'entry.612306289',
    entryMessage: 'entry.1536982105',
    sheetGvizUrl: ''     // contoh: 'https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:json&sheet=Form%20Responses%201'
  };
  const guestbookConfigured = !!(GUESTBOOK.formActionUrl && GUESTBOOK.entryName && GUESTBOOK.entryAttendance && GUESTBOOK.entryMessage);
  const guestbookReadable = !!GUESTBOOK.sheetGvizUrl;

  let sessionWishes = []; // fallback in-memory store when backend isn't configured yet

  function renderWishItem(en, animate){
    const tagClass = en.attendance === 'Hadir' ? 'hadir' : (en.attendance === 'Tidak Hadir' ? 'tidak' : 'ragu');
    const safeName = escapeHtml(en.name);
    const safeMsg = escapeHtml(en.message);
    const sparkle = animate ? '<span class="wish-sparkle">&#10023;</span>' : '';
    const cls = animate ? 'wish-item wish-new' : 'wish-item';
    return '<div class="'+cls+'">'+sparkle+'<div class="wish-name">'+safeName+' <span class="wish-tag '+tagClass+'">'+en.attendance+'</span></div><div class="wish-text">'+safeMsg+'</div></div>';
  }

  function prependWishToDom(entry){
    const listEl = document.getElementById('wishesList');
    const emptyEl = listEl.querySelector('.wish-empty');
    if(emptyEl) emptyEl.remove();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderWishItem(entry, true);
    const node = wrapper.firstElementChild;
    listEl.insertBefore(node, listEl.firstChild);
    node.scrollIntoView({behavior:'smooth', block:'nearest'});
    setTimeout(()=>{ node.classList.remove('wish-new'); }, 1600);
  }

  async function submitWish(){
    const nameEl = document.getElementById('wName');
    const msgEl = document.getElementById('wMsg');
    const btn = document.getElementById('submitBtn');
    const formMsg = document.getElementById('formMsg');
    const name = nameEl.value.trim();
    const msg = msgEl.value.trim();

    if(!name || !selectedAttendance || !msg){
      formMsg.innerHTML = 'Mohon lengkapi nama, kehadiran, dan ucapan.';
      formMsg.style.color = '#a3543a';
      return;
    }
    btn.disabled = true;
    formMsg.innerHTML = 'Mengirim...';
    formMsg.style.color = 'var(--sage-dark)';

    const entry = { name, attendance: selectedAttendance, message: msg, time: Date.now() };

    try{
      if(guestbookConfigured){
        const fd = new FormData();
        fd.append(GUESTBOOK.entryName, entry.name);
        fd.append(GUESTBOOK.entryAttendance, entry.attendance);
        fd.append(GUESTBOOK.entryMessage, entry.message);
        // no-cors: Google Forms doesn't return a readable response, but the submission still goes through.
        await fetch(GUESTBOOK.formActionUrl, { method:'POST', mode:'no-cors', body:fd });
      } else {
        sessionWishes.unshift(entry);
      }

      prependWishToDom(entry);
      formMsg.innerHTML = '<span class="success-flash"><span class="check">&#10003;</span> Terima kasih, ucapan Anda telah terkirim.</span>';
      formMsg.style.color = 'var(--sage-dark)';
      nameEl.value=''; msgEl.value='';
      document.querySelectorAll('.radio-pill').forEach(p=>p.classList.remove('active'));
      selectedAttendance = null;
    }catch(err){
      formMsg.textContent = 'Maaf, terjadi kesalahan. Coba lagi.';
      formMsg.style.color = '#a3543a';
    }
    btn.disabled = false;
  }

  function parseGvizJson(text){
    // Google's gviz endpoint wraps JSON in "google.visualization.Query.setResponse(...)"
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const json = JSON.parse(text.slice(start, end+1));
    const rows = json.table.rows || [];
    return rows.map(r=>{
      const c = r.c;
      return {
        time: c[0] && c[0].v ? new Date(c[0].v).getTime() : 0,
        name: c[1] ? (c[1].v || '') : '',
        attendance: c[2] ? (c[2].v || '') : '',
        message: c[3] ? (c[3].v || '') : ''
      };
    });
  }

  async function loadWishes(){
    const listEl = document.getElementById('wishesList');
    if(!guestbookReadable){
      if(sessionWishes.length === 0){
        listEl.innerHTML = '<div class="wish-empty">Jadilah yang pertama mengirimkan ucapan &amp; doa.</div>';
      } else {
        listEl.innerHTML = sessionWishes.map(en=>renderWishItem(en,false)).join('');
      }
      return;
    }
    try{
      const res = await fetch(GUESTBOOK.sheetGvizUrl);
      const text = await res.text();
      const entries = parseGvizJson(text).sort((a,b)=> b.time - a.time);
      if(entries.length === 0){
        listEl.innerHTML = '<div class="wish-empty">Jadilah yang pertama mengirimkan ucapan &amp; doa.</div>';
        return;
      }
      listEl.innerHTML = entries.map(en=>renderWishItem(en,false)).join('');
    }catch(err){
      listEl.innerHTML = '<div class="wish-empty">Belum dapat memuat ucapan.</div>';
    }
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  loadWishes();
