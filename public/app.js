(() => {
  // --- Config dati file ---
  const CARDS = {
    it: [
      '00_il_matto','01_il_mago','02_la_papessa','03_l_imperatrice','04_l_imperatore',
      '05_il_papa','06_gli_amanti','07_il_carro','08_la_forza','09_l_eremita',
      '10_la_ruota_della_fortuna','11_la_giustizia','12_l_appeso','13_la_morte',
      '14_la_temperanza','15_il_diavolo','16_la_torre','17_la_stella','18_la_luna',
      '19_il_sole','20_il_giudizio','21_il_mondo'
    ],
    en: [
      '00_the_fool','01_the_magician','02_the_high_priestess','03_the_empress','04_the_emperor',
      '05_the_hierophant','06_the_lovers','07_the_chariot','08_strength','09_the_hermit',
      '10_wheel_of_fortune','11_justice','12_the_hanged_man','13_death','14_temperance',
      '15_the_devil','16_the_tower','17_the_star','18_the_moon','19_the_sun','20_judgement','21_the_world'
    ]
  };

  const SLOT_LABELS = {
    it: ['Passato','Presente','Futuro'],
    en: ['Past','Present','Future']
  };

  const DOM = {
    langGate: document.getElementById('langGate'),
    itBtn: document.getElementById('itBtn'),
    enBtn: document.getElementById('enBtn'),
    title: document.getElementById('title'),
    grid: document.getElementById('grid'),
    slots: [document.getElementById('slot0'), document.getElementById('slot1'), document.getElementById('slot2')],
    slotLabels: [document.getElementById('slot0label'), document.getElementById('slot1label'), document.getElementById('slot2label')],
    interpretBtn: document.getElementById('interpretBtn'),
    pauseBtn: document.getElementById('pauseBtn'), 
    pdfBtn: document.getElementById('pdfBtn'),
    resetBtn: document.getElementById('resetBtn'),
    readingTitle: document.getElementById('readingTitle'),
    readingOutput: document.getElementById('readingOutput'),
    player: document.getElementById('player'),
    shuffleBtn: document.getElementById('shuffleBtn')
  };

  let lang = null; // 'it' | 'en'
  let deck = [];   // { base, reversed, picked }
  let picks = [];  // { base, reversed, slotIndex }
  let lockBoard = false;
  let animating = false; // evita interazioni durante la mescolata

 function initLang(selected) {
  lang = selected;
  DOM.shuffleBtn.textContent = (lang === 'it') ? 'Mescola carte' : 'Shuffle deck';
  DOM.shuffleBtn.setAttribute('aria-label', DOM.shuffleBtn.textContent);

  
  DOM.langGate.style.display = 'none';
  DOM.title.textContent = (lang === 'it') ? 'Tarocchi' : 'Tarot';
  const labels = SLOT_LABELS[lang];
  labels.forEach((lab, i) => DOM.slotLabels[i].textContent = lab);
  DOM.readingTitle.textContent = (lang === 'it') ? 'Interpretazione' : 'Reading';

  // ⬇️ aggiungi queste due righe
  DOM.interpretBtn.textContent = (lang === 'it') ? 'Interpretazione' : 'interpretation';
  DOM.pdfBtn.textContent       = (lang === 'it') ? 'Genera PDF'     : 'Generate PDF';
  DOM.pauseBtn.textContent = (lang === 'it') ? 'Pausa' : 'Pause';
  DOM.pauseBtn.setAttribute('aria-label', DOM.pauseBtn.textContent);
  // opzionale accessibilità:
  DOM.interpretBtn.setAttribute('aria-label', DOM.interpretBtn.textContent);
  DOM.pdfBtn.setAttribute('aria-label', DOM.pdfBtn.textContent);
  DOM.shuffleBtn.addEventListener('click', onShuffle);
  DOM.resetBtn.disabled = false;
  resetAll();
}


  function resetAll() {
    // Clear UI
    DOM.grid.innerHTML = '';
    DOM.readingOutput.innerHTML = '';
    DOM.pdfBtn.disabled = true;
    DOM.interpretBtn.disabled = true;
    DOM.shuffleBtn.disabled = false;

    picks = [];
    lockBoard = false;
    // Make deck with random reversed
    const list = CARDS[lang];
    deck = list.map(base => ({
      base,
      reversed: Math.random() < 0.5,
      picked: false
    }));

    // Render 22 back-cards
    for (let i = 0; i < deck.length; i++) {
      const c = deck[i];
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.dataset.index = String(i);
      cardEl.dataset.base = c.base; // ⬅️ servirà per il riordino animato

      const img = document.createElement('img');
      img.alt = 'back';
      img.src = '/asset/dorso.jpeg';
      cardEl.appendChild(img);

      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = `#${String(i+1).padStart(2,'0')}`;
      cardEl.appendChild(tag);

      cardEl.addEventListener('click', onPickCard);
      DOM.grid.appendChild(cardEl);
    }

    // Clear slots
    DOM.slots.forEach(el => el.innerHTML = '');
  }

  function onPickCard(e) {
    if (lockBoard) return;
    const cardEl = e.currentTarget;
    const idx = Number(cardEl.dataset.index);
    const c = deck[idx];
    if (!c || c.picked) return;
    if (picks.length >= 3) return;
   
    if (lockBoard || animating) return;

    // push to first empty slot
    const slotIndex = picks.length;
    c.picked = true;
    picks.push({ base: c.base, reversed: c.reversed, slotIndex });

    // render in slot
    const slot = DOM.slots[slotIndex];
    const img = document.createElement('img');
    img.alt = c.base;
    const imgDir = (lang === 'it') ? 'img_it' : 'img_en';
    img.src = `/asset/${imgDir}/${c.base}.jpeg`;
    if (c.reversed) img.classList.add('reversed');
    slot.innerHTML = '';
    slot.appendChild(img);

    // disable from grid
    cardEl.classList.add('disabled');
    cardEl.removeEventListener('click', onPickCard);

    if (picks.length === 3) {
      lockBoard = true;
      DOM.interpretBtn.disabled = false;
    }
  }

  function computeMdFile(base, reversed, slotIndex) {
    const slotName = SLOT_LABELS[lang][slotIndex];
    // descrizioni: BASE_[r_]Slot.md (stessa regola per IT e EN)
    return `/asset/${lang === 'it' ? 'descrizione_it' : 'descrizione_en'}/${base}${reversed ? '_r_' : '_'}${slotName}.md`;
  }

  function computeAudioFile(base, reversed, slotIndex) {
    const slotName = SLOT_LABELS[lang][slotIndex];
    if (lang === 'en') {
      // EN: BASE_[r_]Slot.mp3
      return `/asset/audio_en/${base}${reversed ? '_r_' : '_'}${slotName}.mp3`;
    } else {
      // IT: BASE_Slot.mp3  | reversed: BASE_r_Slot.mp3
      return `/asset/audio_it/${base}${reversed ? '_r_' : '_'}${slotName}.mp3`;
    }
  }

  async function textOrError(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status}`);
      return await r.text();
    } catch (e) {
      return (lang === 'it')
        ? `**ATTENZIONE**: impossibile caricare ${url}`
        : `**WARNING**: cannot load ${url}`;
    }
  }

  function prettyBase(base) {
    const s = base.replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function onInterpret() {
    DOM.readingOutput.innerHTML = '';
    const blocks = [];

    for (let i = 0; i < picks.length; i++) {
      const p = picks[i];
      const mdUrl = computeMdFile(p.base, p.reversed, p.slotIndex);
      const md = await textOrError(mdUrl);
      const block = document.createElement('div');
      block.className = 'block';
      const title = document.createElement('h4');
      const slotLabel = SLOT_LABELS[lang][p.slotIndex];
      title.textContent = `${slotLabel}: ${prettyBase(p.base)}${p.reversed ? (lang === 'it' ? ' (rovesciata)' : ' (reversed)') : ''}`;
      const pre = document.createElement('pre');
      pre.textContent = md;
      block.appendChild(title);
      block.appendChild(pre);
      DOM.readingOutput.appendChild(block);
      blocks.push(block);
    }

    // Play 3 audio in sequenza
    const queue = picks.map(p => computeAudioFile(p.base, p.reversed, p.slotIndex));
    playQueue(queue);

    DOM.pdfBtn.disabled = false;
  }

 function playQueue(urls) {
  if (!urls || !urls.length) return;
  const audio = DOM.player;
  let i = 0;

  // abilita il pulsante pausa ad inizio riproduzione
  DOM.pauseBtn.disabled = false;
  DOM.pauseBtn.textContent = (lang === 'it') ? 'Pausa' : 'Pause';

  audio.onended = () => {
    i++;
    if (i < urls.length) {
      audio.src = urls[i];
      audio.play().catch(() => {});
    } else {
      // finita la coda: disabilita pausa
      audio.onended = null;
      audio.onerror = null;
      DOM.pauseBtn.disabled = true;
      DOM.pauseBtn.textContent = (lang === 'it') ? 'Pausa' : 'Pause';
    }
  };

  audio.onerror = () => {
    // skip se file mancante
    audio.onended();
  };

  audio.src = urls[0];
  audio.play().catch(() => {});
}

function stopAudio() {
  const a = DOM.player;
  try { a.pause(); } catch {}
  a.onended = null;
  a.onerror = null;
  a.removeAttribute('src');
  a.load(); // forza lo stop immediato
  // disabilita e reimposta il bottone pausa
  DOM.pauseBtn.disabled = true;
  DOM.pauseBtn.textContent = (lang === 'it') ? 'Pausa' : 'Pause';
}

function onTogglePause() {
  const a = DOM.player;
  if (!a.src) return; // niente da fare se non c’è una traccia

  if (a.paused) {
    a.play().catch(()=>{});
    DOM.pauseBtn.textContent = (lang === 'it') ? 'Pausa' : 'Pause';
  } else {
    a.pause();
    DOM.pauseBtn.textContent = (lang === 'it') ? 'Riprendi' : 'Resume';
  }
}

  async function onPdf() {
    try {
      const r = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          selections: picks.map(p => ({ base: p.base, reversed: p.reversed, slotIndex: p.slotIndex }))
        })
      });
      if (!r.ok) throw new Error('pdf');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (lang === 'it') ? 'interpretazione_tarocchi.pdf' : 'tarot_reading.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert((lang === 'it') ? 'Errore nella generazione del PDF' : 'Error generating PDF');
    }
  }
function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function nextFrame() {
  return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

async function onShuffle() {
  if (animating) return;
  if (!deck || deck.length <= 1) return;
  if (lockBoard || picks.length >= 3) return; // ✅ ora puoi mescolare fino a 2 scelte

  animating = true;
  DOM.shuffleBtn.disabled = true;

  const cards = Array.from(DOM.grid.querySelectorAll('.card'));
  if (cards.length <= 1) {
    animating = false;
    DOM.shuffleBtn.disabled = (picks.length >= 3);
    return;
  }

  // 1) Animazione: impila tutto sulla prima carta
  const firstRect = cards[0].getBoundingClientRect();
  cards.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const dx = firstRect.left - r.left;
    const dy = firstRect.top  - r.top;
    el.style.willChange = 'transform';
    el.style.transition = 'transform 400ms ease';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.zIndex = String(100 + i);
  });
  await new Promise(res => setTimeout(res, 450));

  // 2) Rimescola SOLO le carte non ancora scelte, mantenendo fisse le posizioni di quelle scelte
  const pickedPos = [];
  const unpickedPos = [];
  for (let i = 0; i < deck.length; i++) {
    (deck[i].picked ? pickedPos : unpickedPos).push(i);
  }
  const unpickedCards = unpickedPos.map(i => deck[i]);
  fisherYatesShuffle(unpickedCards);

  const newDeck = new Array(deck.length);
  pickedPos.forEach(pos => { newDeck[pos] = deck[pos]; });
  unpickedPos.forEach((pos, idx) => { newDeck[pos] = unpickedCards[idx]; });
  deck = newDeck;

  // 3) Riordina il DOM secondo il nuovo deck (tag e index aggiornati)
  const byBase = new Map(cards.map(el => [el.dataset.base, el]));
  DOM.grid.innerHTML = '';
  deck.forEach((c, i) => {
    const el = byBase.get(c.base);
    if (!el) return;
    el.dataset.index = String(i);
    const tag = el.querySelector('.tag');
    if (tag) tag.textContent = `#${String(i + 1).padStart(2, '0')}`;
    el.style.transition = 'none';
    DOM.grid.appendChild(el);
  });

  // 4) Effetto ridisposizione: dal “pacco” si riallinea alla griglia
  const newFirst = DOM.grid.querySelector('.card');
  const pileRect = newFirst.getBoundingClientRect();
  DOM.grid.querySelectorAll('.card').forEach((el) => {
    const r = el.getBoundingClientRect();
    const dx = pileRect.left - r.left;
    const dy = pileRect.top  - r.top;
    el.style.transform  = `translate(${dx}px, ${dy}px)`;
    el.style.zIndex = '0';
  });
  await nextFrame();
  DOM.grid.querySelectorAll('.card').forEach((el) => {
    el.style.transition = 'transform 400ms ease';
    el.style.transform  = 'translate(0, 0)';
  });
  await new Promise(res => setTimeout(res, 450));

  // pulizia
  DOM.grid.querySelectorAll('.card').forEach((el) => {
    el.style.transition = '';
    el.style.transform  = '';
    el.style.willChange = '';
    el.style.zIndex = '';
  });

  animating = false;
  // Finché non hai 3 carte, puoi continuare a mescolare
  DOM.shuffleBtn.disabled = (picks.length >= 3);
}




function onReset() {
  stopAudio();   // ⬅️ interrompe eventuale riproduzione
  resetAll();
}
  // Bind UI
  DOM.itBtn.addEventListener('click', () => initLang('it'));
  DOM.enBtn.addEventListener('click', () => initLang('en'));
  DOM.resetBtn.addEventListener('click', onReset); 
  DOM.interpretBtn.addEventListener('click', onInterpret);
  DOM.pauseBtn.addEventListener('click', onTogglePause);    
  DOM.pdfBtn.addEventListener('click', onPdf);
})();
