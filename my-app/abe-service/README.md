# ABE Service (FastAPI)

This service provides a local CP-ABE-like interface for development:

- `POST /abe/generate-user-key`
- `POST /abe/encrypt-key`
- `POST /abe/decrypt-key`
- `GET /health`

## Run locally

```bash
cd abe-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment

Set this before running (optional but recommended):

```bash
set ABE_MASTER_SECRET=replace-with-long-random-secret
```

## Generate a private key

```bash
curl -X POST http://localhost:8000/abe/generate-user-key ^
  -H "Content-Type: application/json" ^
  -d "{\"attributes\":[\"role:user\",\"course:cs601 applied cryptography\",\"slot:f1+tf1\"]}"
```

Use the returned `user_private_key` in `ABE_USER_PRIVATE_KEY` for end-to-end local testing.
