(() => {
  // --- Config carte ---
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

  // --- DOM refs ---
  const DOM = {
    langGate: document.getElementById('langGate'),
    itBtn: document.getElementById('itBtn'),
    enBtn: document.getElementById('enBtn'),
    title: document.getElementById('title'),
    grid: document.getElementById('grid'),

    instructionsBtn: document.getElementById('instructionsBtn'),
    instructionsPanel: document.getElementById('instructionsPanel'),
    instructionsContent: document.getElementById('instructionsContent'),
    backBtn: document.getElementById('backBtn'),

    slots: [document.getElementById('slot0'), document.getElementById('slot1'), document.getElementById('slot2')],
    slotLabels: [document.getElementById('slot0label'), document.getElementById('slot1label'), document.getElementById('slot2label')],
   
    videoBtn: document.getElementById('videoBtn'),
    
    pdfBtn: document.getElementById('pdfBtn'),
    resetBtn: document.getElementById('resetBtn'),
    readingTitle: document.getElementById('readingTitle'),
    readingOutput: document.getElementById('readingOutput'),
    player: document.getElementById('player'),
    shuffleBtn: document.getElementById('shuffleBtn')
  };

  // --- Stato ---
  let lang = null;                 // 'it' | 'en'
  let deck = [];                   // { base, reversed, picked }
  let picks = [];                  // { base, reversed, slotIndex }
  let lockBoard = false;
  let animating = false;
  window.picks = picks;            // esponi globalmente (utile per debug/estensioni)

  // --- Helpers path ---
  const imgDir = () => (lang === 'it') ? 'img_it' : 'img_en';
  const descDir = () => (lang === 'it') ? 'descrizione_it' : 'descrizione_en';
  const audioDir = () => (lang === 'it') ? 'audio_it' : 'audio_en';
  const videoDir = () => (lang === 'it') ? 'video_it' : 'video_en';

  function computeMdFile(base, reversed, slotIndex) {
    const slotName = SLOT_LABELS[lang][slotIndex];
    // BASE[_r_]Slot.md
    return `/asset/${descDir()}/${base}${reversed ? '_r_' : '_'}${slotName}.md`;
  }

  function computeAudioFile(base, reversed, slotIndex) {
    const slotName = SLOT_LABELS[lang][slotIndex];
    // BASE[_r_]Slot.mp3
    return `/asset/${audioDir()}/${base}${reversed ? '_r_' : '_'}${slotName}.mp3`;
  }

  // --- Init lingua ---
  function initLang(selected) {
    lang = selected;

    DOM.shuffleBtn.textContent = (lang === 'it') ? 'Mescola carte' : 'Shuffle deck';
    DOM.shuffleBtn.setAttribute('aria-label', DOM.shuffleBtn.textContent);

    DOM.instructionsBtn.textContent = (lang === 'it') ? 'Istruzioni' : 'Instructions';
    DOM.backBtn.textContent = (lang === 'it') ? 'Torna indietro' : 'Back';
    DOM.instructionsBtn.disabled = false;

    DOM.langGate.style.display = 'none';
    DOM.title.textContent = (lang === 'it') ? 'Tarocchi' : 'Tarot';
    SLOT_LABELS[lang].forEach((lab, i) => DOM.slotLabels[i].textContent = lab);
    DOM.readingTitle.textContent = (lang === 'it') ? 'Interpretazione' : 'Reading';
    
    DOM.pdfBtn.textContent       = (lang === 'it') ? 'Genera PDF' : 'Generate PDF';
   
    DOM.pauseBtn.setAttribute('aria-label', DOM.pauseBtn.textContent);
    DOM.interpretBtn.setAttribute('aria-label', DOM.interpretBtn.textContent);
    DOM.pdfBtn.setAttribute('aria-label', DOM.pdfBtn.textContent);

    // attiva controlli
    DOM.shuffleBtn.addEventListener('click', onShuffle);
    DOM.resetBtn.disabled = false;

    // riparti
    resetAll();

    // classi lingua sul body
    document.body.classList.remove('lang-it','lang-en');
    document.body.classList.add(lang === 'it' ? 'lang-it' : 'lang-en');

    // Assicurati che il bottone Video non abbia altri listener (es. quelli del modal in index.html)
    neuterVideoButton();
    DOM.videoBtn.addEventListener('click', onVideo);
  }

  // Clona #videoBtn per rimuovere tutti i vecchi event listener
  function neuterVideoButton() {
    const oldBtn = DOM.videoBtn;
    if (!oldBtn) return;
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    DOM.videoBtn = newBtn;
  }

  // --- Reset & setup mazzo ---
  function resetAll() {
    DOM.grid.innerHTML = '';
    DOM.readingOutput.innerHTML = '';
    DOM.pdfBtn.disabled = true;
   
    DOM.shuffleBtn.disabled = false;
    if (DOM.videoBtn) DOM.videoBtn.disabled = true;

    picks = [];
    window.picks = picks;
    lockBoard = false;

    const list = CARDS[lang || 'it'];
    deck = list.map(base => ({
      base,
      reversed: Math.random() < 0.5,
      picked: false
    }));

    // disegna carte coperte
    for (let i = 0; i < deck.length; i++) {
      const c = deck[i];
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.dataset.index = String(i);
      cardEl.dataset.base = c.base;

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

    // svuota slot
    DOM.slots.forEach(el => el.innerHTML = '');
  }

  // --- Scelta carta ---
  function onPickCard(e) {
    if (lockBoard || animating) return;
    const cardEl = e.currentTarget;
    const idx = Number(cardEl.dataset.index);
    const c = deck[idx];
    if (!c || c.picked || picks.length >= 3) return;

    const slotIndex = picks.length;
    c.picked = true;
    picks.push({ base: c.base, reversed: c.reversed, slotIndex });
    window.picks = picks;

    const slot = DOM.slots[slotIndex];
    const img = document.createElement('img');
    img.alt = c.base;
    img.src = `/asset/${imgDir()}/${c.base}.jpeg`;
    if (c.reversed) img.classList.add('reversed');
    slot.innerHTML = '';
    slot.appendChild(img);

    cardEl.classList.add('disabled');
    cardEl.removeEventListener('click', onPickCard);

    if (picks.length === 3) {
      lockBoard = true;
    

       if (DOM.videoBtn) DOM.videoBtn.disabled = false;
       if (DOM.pdfBtn) DOM.pdfBtn.disabled = false; // ✅ abilita Genera PDF
    }
  }

  // --- Interpretazione ---


  // --- Video (nuova pagina con la carta del Passato) ---
  function onVideo() {
    if (!picks || picks.length < 1) {
      alert((lang === 'it') ? 'Devi prima fare l\'interpretazione.' : 'You must interpret first.');
      return;
    }
// Salva le carte scelte (base, reversed, slotIndex)
  localStorage.setItem('tarotReading', JSON.stringify({
    lang,
    picks
  }));

    // Apri la pagina del Passato (prima carta)
  const p = picks.find(x => x.slotIndex === 0);
  const slot = (lang === 'it') ? 'Passato' : 'Past';
  const url = `video.html?slot=${slot}`;
  window.open(url, "_blank");
} 

  // --- Istruzioni ---
  async function onInstructions() {
    const fileUrl = (lang === 'it') ? '/Istruzioni.txt' : '/Instructions.txt';
    try {
      const r = await fetch(fileUrl);
      if (!r.ok) throw new Error(r.status);
      const text = await r.text();

      const paragraphs = text.split('.').map(p => p.trim()).filter(Boolean);
      DOM.instructionsContent.innerHTML = paragraphs
        .map(p => `<p style="margin-bottom:1em;">${p}.</p>`)
        .join('');
      DOM.instructionsPanel.style.display = 'block';
    } catch {
      DOM.instructionsContent.textContent = (lang === 'it')
        ? 'Errore: impossibile caricare le istruzioni.'
        : 'Error: cannot load instructions.';
      DOM.instructionsPanel.style.display = 'block';
    }
  }
  function onBack() {
    DOM.instructionsPanel.style.display = 'none';
  }

  // --- Audio ---
  function playQueue(urls) {
    if (!urls || !urls.length) return;
    const audio = DOM.player;
    let i = 0;

   
   
    audio.onended = () => {
      i++;
      if (i < urls.length) {
        audio.src = urls[i];
        audio.play().catch(() => {});
      } else {
        audio.onended = null;
        audio.onerror = null;
      
        
      }
    };
    audio.onerror = () => { audio.onended(); };

    audio.src = urls[0];
    audio.play().catch(() => {});
  }

  function stopAudio() {
    const a = DOM.player;
    try { a.pause(); } catch {}
    a.onended = null;
    a.onerror = null;
    a.removeAttribute('src');
    a.load();

  
  }



  // --- PDF ---
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
    } catch {
      alert((lang === 'it') ? 'Errore nella generazione del PDF' : 'Error generating PDF');
    }
  }

  // --- Mescola con animazione, evitando le carte già scelte ---
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
    if (lockBoard || picks.length >= 3) return;

    animating = true;
    DOM.shuffleBtn.disabled = true;

    const cards = Array.from(DOM.grid.querySelectorAll('.card'));
    if (cards.length <= 1) {
      animating = false;
      DOM.shuffleBtn.disabled = (picks.length >= 3);
      return;
    }

    // 1) impila su prima carta
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

    // 2) rimescola solo le non scelte
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

    // 3) riordina DOM
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

    // 4) riallinea alla griglia
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
    DOM.shuffleBtn.disabled = (picks.length >= 3);
  }

  // --- Utility ---
  async function textOrError(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status}`);
      return await r.text();
    } catch {
      return (lang === 'it')
        ? `**ATTENZIONE**: impossibile caricare ${url}`
        : `**WARNING**: cannot load ${url}`;
    }
  }

  function prettyBase(base) {
    const s = base.replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function onReset() {
    stopAudio();
    resetAll();
  }

  // --- Bind iniziali ---
  DOM.itBtn.addEventListener('click', () => initLang('it'));
  DOM.enBtn.addEventListener('click', () => initLang('en'));
  DOM.resetBtn.addEventListener('click', onReset);
  

  DOM.pdfBtn.addEventListener('click', onPdf);
  DOM.instructionsBtn.addEventListener('click', onInstructions);
  DOM.backBtn.addEventListener('click', onBack);

window.resetGame = () => {
  stopAudio();
  // se la lingua non è impostata, recuperala da localStorage o imposta 'it' di default
  if (!lang) {
    try {
      const saved = JSON.parse(localStorage.getItem('tarotReading'));
      lang = (saved && saved.lang) ? saved.lang : 'it';
    } catch {
      lang = 'it';
    }
  }
  resetAll();

  // Riattiva i listener base
  DOM.shuffleBtn.addEventListener('click', onShuffle);
  DOM.videoBtn.addEventListener('click', onVideo);
  DOM.resetBtn.addEventListener('click', onReset);
};








})();
