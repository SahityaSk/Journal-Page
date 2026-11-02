# Natural Sciences and Applied Technology journal archive

The INSAT journal archive uses React and Node.js with an Express API and a MariaDB/MySQL relational database. Journal issues, articles, author accounts, login sessions, and private manuscript submissions are stored in SQL tables.

## Run locally

1. Install Node.js 20 or newer and Docker Desktop. The included Compose file starts MariaDB for the site and a separate MariaDB database for OJS.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env`; set `SQL_PASSWORD` to the same value as `SQL_DB_PASSWORD` in `.env.ojs`, and set a long, private `ADMIN_TOKEN`.
4. Start both the API and React development server with `npm run dev`.
5. Open the Vite URL printed in the terminal. The API runs on port 5000 and the frontend proxies `/api` requests to it.

On first server startup, the archive inserts the existing INSAT issues and their featured article records if the issue collection is empty. The seed command is also available with `npm run seed`.

## Editorial administration

Open `/admin` and sign in with `ADMIN_TOKEN`. Editors can create, edit, and delete issues and their article records. Article records use JSON with `category`, `title`, `authors`, and an optional `pages` value. Admin requests require the token as a bearer credential; the public issue endpoints are read-only.

## Author accounts and manuscript submissions

Open `/account` to register or log in. New passwords must be at least 12 characters. Registered authors can upload PDF, DOC, or DOCX manuscripts up to 5 MB, edit their submission details or replace the file, and download their own submissions. Uploaded manuscripts remain private and are not published automatically. Readers can continue to read the open-access journal without an account. Editors can review submissions and update their status at `/admin/submissions` using the editorial token.

Account and submission features require the configured SQL database to be running. This build does not yet include email verification or password recovery; configure those flows before using self-service accounts on a public production deployment.

## Production

Set the `SQL_*` variables, `ADMIN_TOKEN`, and optionally `PORT` in the host environment. Run `npm install`, `npm run build`, and `npm start`. Express serves the built React app and `/api` from the same origin. Keep `.env` private; it is ignored by Git.

## Open Journal Systems (OJS)

OJS runs as a separate PHP application with its own MariaDB database and persistent uploads. This project includes a Docker Compose stack for local development; OJS is available at `http://localhost:8081` by default. The website's Journals menu links to OJS. Set `VITE_OJS_URL` at build time when the OJS installation uses a different public URL.

1. Install and start Docker Desktop.
2. Copy `.env.ojs.example` to `.env.ojs` and replace all four database passwords with unique long random values. Keep `.env.ojs` private.
3. Copy `.env.example` to `.env`. Set `SQL_PASSWORD` to the same value as `SQL_DB_PASSWORD` in `.env.ojs`, then set a long, private `ADMIN_TOKEN`.
4. Download the OJS 3.5.0-4 config template and create its persistent data directories:

   ```powershell
   New-Item -ItemType Directory -Force ojs/public, ojs/files
   Invoke-WebRequest https://github.com/pkp/ojs/raw/3_5_0-4/config.TEMPLATE.inc.php -OutFile ojs/config.inc.php
   ```

   The `files` directory is mounted outside OJS's web root for private uploads.
5. Start both SQL services with `docker compose --env-file .env.ojs -f compose.ojs.yaml up -d`. The INSAT API connects to MariaDB at `127.0.0.1:3307`; OJS connects to its private MariaDB service. Run `npm run dev` for the website and API. Finish OJS installation at `http://localhost:8081` with driver `mysqli`, host `ojs-db`, database and username `ojs`, the `OJS_DB_PASSWORD` value, and upload directory `/var/www/files`.

Stop the stack with `docker compose --env-file .env.ojs -f compose.ojs.yaml down`. The database volumes are retained. To remove journal data, the volumes must be explicitly removed; back them up before doing so.
