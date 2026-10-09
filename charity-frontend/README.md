# CareConnect Frontend

React + Vite frontend for the supplied CareConnect charity/donation backend.

## Run
1. Extract this ZIP.
2. Open terminal in the frontend folder.
3. Run `npm install`.
4. Start the backend on `http://localhost:5000`.
5. Run `npm run dev`.
6. Open `http://localhost:5173`.

The Vite dev server proxies `/api` requests to the backend, so the backend's current CORS whitelist does not need to include port 5173 during local development.
