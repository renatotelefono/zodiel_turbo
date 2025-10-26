import requests

API_KEY = "sk_V2_hgu_kOHhIcP9AS1_oq8dza3WNOEoFHU2VGrPGZJh8nSBLKA6"

avatar_id = "9da2b10e5393462ba7bbf0a51a561852"   # tuo avatar “last”
voice_id  = "hWQVzfgWxCwaXkGIHaLE"               # tua voce “zingara2”

headers = {
    "accept": "application/json",
    "x-api-key": API_KEY
}

# ---------- Verifica avatar ----------
url_avatars = "https://api.heygen.com/v2/avatar_group.list?include_public=false"
response_a = requests.get(url_avatars, headers=headers)

avatar_found = False
if response_a.status_code == 200:
    avatars = response_a.json().get("data", {}).get("avatar_group_list", [])
    for a in avatars:
        if a.get("id") == avatar_id:
            print("✅ Avatar trovato:")
            print(f"  ID: {a['id']}")
            print(f"  Nome: {a['name']}")
            print(f"  Anteprima: {a['preview_image']}")
            avatar_found = True
            break
    if not avatar_found:
        print("❌ Nessun avatar con l'ID indicato trovato nel tuo account.")
else:
    print(f"Errore nella richiesta avatar: {response_a.status_code}")
    print(response_a.text)


# ---------- Verifica voce ----------
url_voices = "https://api.heygen.com/v2/voices"
response_v = requests.get(url_voices, headers=headers)

voice_found = False
if response_v.status_code == 200:
    voices = response_v.json().get("data", {}).get("voices", [])
    for v in voices:
        if v.get("voice_id") == voice_id:
            print("\n✅ Voce trovata:")
            print(f"  ID: {v['voice_id']}")
            print(f"  Nome: {v['name']}")
            print(f"  Lingua: {v['language']}")
            print(f"  Anteprima: {v['preview_audio']}")
            voice_found = True
            break
    if not voice_found:
        print("\n❌ Nessuna voce con l'ID indicato trovata nel tuo account.")
else:
    print(f"Errore nella richiesta voci: {response_v.status_code}")
    print(response_v.text)
