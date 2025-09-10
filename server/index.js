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

    // --- helper: trova il file immagine provando più estensioni ---
    const resolveImageFile = (dir, base) => {
      const exts = ['jpeg', 'jpg', 'png', 'webp'];
      for (const ext of exts) {
        const p = path.join(dir, `${base}.${ext}`);
        if (fs.existsSync(p)) return p;
      }
      return null;
    };

    // --- dove stanno le immagini, coerente con lo static server /asset ---
    
    function drawImageMaybeReversed(doc, imgPath, x, y, boxW, boxH, reversed) {
  if (!imgPath) return;
  if (!reversed) {
    doc.image(imgPath, x, y, { fit: [boxW, boxH] });
    return;
  }
  doc.save();
  doc.translate(x + boxW / 2, y + boxH / 2);
  doc.rotate(180);
  doc.image(imgPath, -boxW / 2, -boxH / 2, { fit: [boxW, boxH] });
  doc.restore();
}

    
    
    
    const imgDir = path.join(__dirname, '../asset', lang === 'it' ? 'img_it' : 'img_en');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="interpretazione_tarocchi.pdf"');

    const doc = new PDFDocument({ autoFirstPage: true, margin: 48 });
    doc.pipe(res);

    // Titolo
    //doc.fontSize(20).text(lang === 'it' ? 'Interpretazione Tarocchi' : 'Tarot Reading', { align: 'center' });
    doc.moveDown();

    // ================ COPERTINA CON LE TRE CARTE ================
    (function renderCover() {
      const availableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const cardW = Math.floor((availableW - 2 * 16) / 3); // 3 carte + 2 spazi da 16pt
      const cardH = Math.floor(cardW * 1.6); // rapporto tipico 1:1.6 (circa)
      const yTop = doc.y; // punto di partenza sotto il titolo
      let x = doc.page.margins.left;

      selections.forEach((sel, idx) => {
        const imgPath = resolveImageFile(imgDir, sel.base);
        if (imgPath) {
          
          drawImageMaybeReversed(doc, imgPath, x, yTop, cardW, cardH, !!sel.reversed);

          //doc.image(imgPath, x, yTop, { fit: [cardW, cardH] });
        } else {
          // cornice vuota se immagine mancante
          doc.rect(x, yTop, cardW, cardH).stroke();
          doc.fontSize(10).text(lang === 'it' ? 'Immagine mancante' : 'Image not found', x + 8, yTop + 8, { width: cardW - 16 });
        }
        x += cardW + 16;
      });

      // Vai sotto alle immagini
      doc.y = yTop + cardH + 24;
      doc.moveDown();
      doc.addPage();
    })();
    // ============================================================

    // ========== PAGINE DETTAGLIO: IMMAGINE + TESTO ==========
    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i]; // { base, reversed, slotIndex }
      const slotLabel = slotNames[sel.slotIndex];

      // --- testo ---
      const mdDir = lang === 'it' ? 'descrizione_it' : 'descrizione_en';
      const mdFile = `${sel.base}${sel.reversed ? '_r_' : '_'}${slotLabel}.md`;
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

      // --- titolo pagina ---
      const title = `${slotLabel}: ${prettyNameFromBase(sel.base)}${sel.reversed ? (lang === 'it' ? ' (rovesciata)' : ' (reversed)') : ''}`;
      doc.fontSize(16).text(title, { underline: true });
      doc.moveDown(0.5);

      // --- immagine carta ---
      const imgPath = resolveImageFile(imgDir, sel.base);
      const maxW = 220;      // larghezza massima immagine sulla pagina
      const maxH = 350;      // altezza massima
      const x = doc.page.margins.left;
      const imgTop = doc.y;  // memorizza la Y corrente

      if (imgPath) {
        // centra grossomodo l'immagine nella colonna sinistra
        drawImageMaybeReversed(doc, imgPath, x, imgTop, maxW, maxH, !!sel.reversed);

        //doc.image(imgPath, x, imgTop, { fit: [maxW, maxH] });
      } else {
        // box placeholder
        doc.rect(x, imgTop, maxW, maxH).stroke();
        doc.fontSize(10).text(lang === 'it' ? 'Immagine mancante' : 'Image not found', x + 8, imgTop + 8, { width: maxW - 16 });
      }

      // --- testo a destra dell'immagine ---
      const textX = x + maxW + 16;
      const textW = doc.page.width - doc.page.margins.right - textX;

      doc.fontSize(12).text(plain, textX, imgTop, { width: textW });

      // porta il cursore sotto il riquadro immagine/testo
      doc.y = Math.max(imgTop + maxH, doc.y) + 18;

      if (i < selections.length - 1) doc.addPage();
    }
    // =========================================================

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
