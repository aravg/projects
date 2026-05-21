import requests

with open('test_file.txt', 'w') as f:
    f.write('This is a test document.')

res = requests.post('http://127.0.0.1:5000/upload', files={'file': open('test_file.txt', 'rb')})
print(res.status_code)
print(res.text)
