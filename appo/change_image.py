import os

def change_jpg_to_jpeg(folder_path):
    if not os.path.isdir(folder_path):
        print(f"❌ La cartella non esiste: {folder_path}")
        return

    for fname in os.listdir(folder_path):
        # Verifica estensione .jpg (anche maiuscola)
        if fname.lower().endswith(".jpg"):
            base = os.path.splitext(fname)[0]
            new_name = base + ".jpeg"

            old_path = os.path.join(folder_path, fname)
            new_path = os.path.join(folder_path, new_name)

            # Evita sovrascritture
            if os.path.exists(new_path):
                print(f"⚠️ Salto {fname}, perché {new_name} già esiste.")
                continue

            os.rename(old_path, new_path)
            print(f"✅ Rinominato {fname} → {new_name}")

    print("✅ Operazione completata.")

# Usa il percorso specificato:
folder = r"C:\Users\HP\Desktop\zodiel_turbo\asset\img_it2"
change_jpg_to_jpeg(folder)
