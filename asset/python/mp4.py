import os
import shutil

# Percorsi
base_dir = r"C:\Users\HP\Desktop\zodiel_turbo\asset\video_it"
source_file = os.path.join(base_dir, "00_il_matto_Futuro_a.mp4")
list_file = r"C:\Users\HP\Desktop\zodiel_turbo\asset\audio_it.txt"

# Legge la lista dei file mp3 con autodetect dell’encoding
with open(list_file, "rb") as f:
    raw = f.read()

# Prova UTF-8, poi UTF-16
try:
    text = raw.decode("utf-8")
except UnicodeDecodeError:
    text = raw.decode("utf-16")

lines = [line.strip() for line in text.splitlines() if line.strip()]

# Per ogni nome nella lista
for line in lines:
    if line.lower().endswith(".mp3"):
        new_name = line[:-4] + ".mp4"  # sostituisce .mp3 con .mp4
        new_path = os.path.join(base_dir, new_name)
        shutil.copy2(source_file, new_path)
        print(f"Creato: {new_path}")

print("✅ Operazione completata con successo.")
