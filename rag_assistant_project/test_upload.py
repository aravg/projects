import requests

with open('test_file.txt', 'w') as f:
    f.write('This is a test document about ChromaDB and LangChain RAG pipelines.')

res = requests.post('http://127.0.0.1:8000/upload', files={'file': open('test_file.txt', 'rb')})
print(res.status_code)
print(res.json())

if res.status_code == 200:
    query_res = requests.post(
        'http://127.0.0.1:8000/query',
        json={'question': 'What is this document about?', 'use_history': False}
    )
    print('\nQuery response:')
    print(query_res.json())
