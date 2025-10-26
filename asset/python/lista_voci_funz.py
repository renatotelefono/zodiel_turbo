import requests

url = "https://api.heygen.com/v2/voices"

headers = {
    "accept": "application/json",
    "x-api-key": "sk_V2_hgu_kOHhIcP9AS1_oq8dza3WNOEoFHU2VGrPGZJh8nSBLKA6"
}

response = requests.get(url, headers=headers)

print(response.text)