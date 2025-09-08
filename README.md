# Sito Lettura Tarocchi — Backend + Frontend

Questo progetto implementa un sito per la lettura dei tarocchi con:
- **Selettore lingua** (Italiano/English)
- **22 carte** coperte con `asset/dorso.jpeg`, orientate casualmente dritte o rovesciate
- **Slot** Passato/Presente/Futuro (IT) o Past/Present/Future (EN)
- **Interpretazione**: stampa a video le 3 descrizioni corrispondenti e riproduce i 3 audio correlati
- **PDF**: genera un PDF scaricabile con l’interpretazione completa (server-side)
- **Reset**: ricomincia la lettura

## Struttura
```
tarot-reading-site/
├─ asset/                      # Inserisci qui i file forniti
│  ├─ img_it/                  # 22 immagini IT (*.jpeg) — vedi elenco
│  ├─ img_en/                  # 22 immagini EN (*.jpeg) — vedi elenco
│  ├─ descrizioni_it/          # 22x3 .md (normali) + 22x3 .md (rovesciate) — vedi elenco
│  ├─ descrizioni_en/          # idem in inglese
│  ├─ audio_it/                # 22x3 .mp3 (normali) + 22x3 .mp3 (rovesciate)
│  └─ audio_en/                # idem in inglese
├─ public/
│  ├─ index.html
│  ├─ style.css
│  └─ app.js
├─ server/
│  └─ index.js
└─ package.json
```

> **Nota sui nomi file**  
> - **Immagini**: non hanno suffisso di lingua; sono distinte per cartella (`img_it` vs `img_en`).  
> - **Descrizioni (.md)**: schema _comune_ sia IT che EN: `BASE_[r_]SLOT.md` (es. `00_il_matto_Passato.md`, `00_il_matto_r_Passato.md`).  
> - **Audio (.mp3)**:  
>   - EN: `BASE_[r_]Slot.mp3` (es. `00_the_fool_Past.mp3`; rovesciata: `00_the_fool_r_Past.mp3`).  
>   - IT: **attenzione** ai due underscore prima del nome slot: non rovesciata `BASE__Slot.mp3`, rovesciata `BASE_r__Slot.mp3` (es. `00_il_matto__Passato.mp3`, `00_il_matto_r__Passato.mp3`).

## Avvio rapido
1. Copia gli **asset** nelle relative cartelle sotto `asset/`. Assicurati che ci sia `asset/dorso.jpeg` (il dorso comune).
2. Installa le dipendenze ed avvia il server:
   ```bash
   npm install
   npm run dev
   ```
3. Apri il browser su **http://localhost:3000**.

## Script NPM
- `npm run dev` — avvia il server Express in locale su `:3000`.
- `npm start` — alias di `node server/index.js`.

## Dove modificare
- **UI/Logica client**: `public/app.js` + `public/style.css` + `public/index.html`.
- **PDF/serving asset**: `server/index.js`.

Buona lettura! 🔮
