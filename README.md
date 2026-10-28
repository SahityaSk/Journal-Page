# Natural Sciences and Applied Technology journal archive

The INSAT issue archive uses the MERN stack: MongoDB stores journal issues, article records, author accounts, and private manuscript submissions; Express and Node.js provide the API; React renders the public archive and editorial tools.

## Run locally

1. Install Node.js 20 or newer and start a local MongoDB server, or create a MongoDB Atlas database.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long, private `ADMIN_TOKEN`.
4. Start both the API and React development server with `npm run dev`.
5. Open the Vite URL printed in the terminal. The API runs on port 5000 and the frontend proxies `/api` requests to it.

On first server startup, the archive inserts the existing INSAT issues and their featured article records if the issue collection is empty. The seed command is also available with `npm run seed`.

## Editorial administration

Open `/admin` and sign in with `ADMIN_TOKEN`. Editors can create, edit, and delete issues and their article records. Article records use JSON with `category`, `title`, `authors`, and an optional `pages` value. Admin requests require the token as a bearer credential; the public issue endpoints are read-only.

## Author accounts and manuscript submissions

Open `/account` to register or log in. New passwords must be at least 12 characters. Registered authors can upload PDF, DOC, or DOCX manuscripts up to 5 MB, edit their submission details or replace the file, and download their own submissions. Uploaded manuscripts remain private and are not published automatically. Readers can continue to read the open-access journal without an account. Editors can review submissions and update their status at `/admin/submissions` using the editorial token.

Account and submission features require MongoDB to be running and `MONGODB_URI` configured. This build does not yet include email verification or password recovery; configure those flows before using self-service accounts on a public production deployment.

## Production

Set `MONGODB_URI`, `ADMIN_TOKEN`, and optionally `PORT` in the host environment. Run `npm install`, `npm run build`, and `npm start`. Express serves the built React app and `/api` from the same origin. Keep `.env` private; it is ignored by Git.
