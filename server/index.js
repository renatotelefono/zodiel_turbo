const express = require('express');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve SPA
app.use(express.static(path.join(__dirname, '../public')));
// Serve asset (immagini, audio, descrizioni) direttamente
app.use('/asset', express.static(path.join(__dirname, '../asset'), {
  setHeaders: (res, filePath) => {
    // un piccolo hint per caching/static
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

app.get('/api/ping', (req, res) => {
  res.json({ ok: true });
});

// Slot labels per lingua
const SLOT_LABELS = {
  it: ['Passato', 'Presente', 'Futuro'],
  en: ['Past', 'Present', 'Future']
};

function stripMarkdown(md) {
  // una rimozione leggera del markdown
  return md
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // code inline/block
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // images
    .replace(/\[[^\]]*\]\([^)]+\)/g, '$1') // links -> testo
    .replace(/[#>*_~`>-]+/g, '')          // simboli markdown
    .replace(/\r/g, '')
    .trim();
}

function prettyNameFromBase(base) {
  // "03_l_imperatrice" -> "03 l imperatrice" -> "03 L imperatrice"
  const s = base.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

app.post('/api/pdf', async (req, res) => {
  try {
    const { lang, selections } = req.body;
    if (!lang || !Array.isArray(selections) || selections.length !== 3) {
      return res.status(400).json({ error: 'Payload non valido' });
    }
    const slotNames = SLOT_LABELS[lang];
    if (!slotNames) return res.status(400).json({ error: 'Lingua non supportata' });

    // Prepara il PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=\"interpretazione_tarocchi.pdf\"');

    const doc = new PDFDocument({ autoFirstPage: true, margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text(lang === 'it' ? 'Interpretazione Tarocchi' : 'Tarot Reading', { align: 'center' });
    doc.moveDown();

    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i]; // { base, reversed, slotIndex }
      const slotLabel = slotNames[sel.slotIndex];
      const mdDir = lang === 'it' ? 'descrizione_it' : 'descrizione_en';
      const slotForFile = slotLabel; // già nella corretta lingua per il nome file
      const mdFile = `${sel.base}${sel.reversed ? '_r_' : '_'}${slotForFile}.md`;
      const fullPath = path.join(__dirname, '../asset', mdDir, mdFile);

      let content = '';
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      } else {
        content = lang === 'it'
          ? `**ATTENZIONE:** descrizione mancante: ${mdFile}`
          : `**WARNING:** missing description: ${mdFile}`;
      }
      const plain = stripMarkdown(content);

      const title = `${slotLabel}: ${prettyNameFromBase(sel.base)}${sel.reversed ? (lang === 'it' ? ' (rovesciata)' : ' (reversed)') : ''}`;
      doc.fontSize(16).text(title, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12).text(plain, { align: 'left' });

      if (i < selections.length - 1) doc.addPage();
    }

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore generazione PDF' });
  }
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
