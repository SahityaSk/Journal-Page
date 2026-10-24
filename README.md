# Natural Sciences and Applied Technology journal archive

The NSAT issue archive uses the MERN stack: MongoDB stores journal issues and article records, Express and Node.js provide the API, and React renders the public archive and editorial admin.

## Run locally

1. Install Node.js 20 or newer and start a local MongoDB server, or create a MongoDB Atlas database.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long, private `ADMIN_TOKEN`.
4. Start both the API and React development server with `npm run dev`.
5. Open the Vite URL printed in the terminal. The API runs on port 5000 and the frontend proxies `/api` requests to it.

On first server startup, the archive inserts the existing NSAT issues and their featured article records if the issue collection is empty. The seed command is also available with `npm run seed`.

## Editorial administration

Open `/admin` and sign in with `ADMIN_TOKEN`. Editors can create, edit, and delete issues and their article records. Article records use JSON with `category`, `title`, `authors`, and an optional `pages` value. Admin requests require the token as a bearer credential; the public issue endpoints are read-only.

## Production

Set `MONGODB_URI`, `ADMIN_TOKEN`, and optionally `PORT` in the host environment. Run `npm install`, `npm run build`, and `npm start`. Express serves the built React app and `/api` from the same origin. Keep `.env` private; it is ignored by Git.
