# Campus Lost & Found

A web application where students and staff can report items they have lost or found on campus, browse and search reports, pin the exact location on a map, message each other, and make claims so items get back to their owners.

## Features

- **Accounts** – register, verify your email, log in, reset a forgotten password
- **Report a lost or found item** – title, category, location, date, description, optional photo, and a map pin
- **Browse and search** – separate lists for lost and found items, and search on the home page
- **Item details** – full description, photo, and the location shown on a map
- **Messaging** – private conversations about an item, with an unread count in the navbar
- **Claims** – claim an item; the reporter accepts or rejects the claim
- **My Reports** – edit or delete your reports, mark them as returned, answer claims
- **Admin area** – manage all reports and user roles

How each feature works is described in [documentation.md](documentation.md).

## Tech Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | React 19, Vite, React Router, Leaflet / React Leaflet, Lucide icons |
| Backend  | PHP (plain PHP scripts, PDO)                        |
| Database | PostgreSQL                                          |
| Maps     | OpenStreetMap tiles                                 |

## Project Structure

```
CampusLostFound/
├── backend/
│   ├── api/                       # PHP API endpoints
│   ├── config/
│   │   ├── bootstrap.php          # CORS, session, shared helpers
│   │   ├── database.php           # PostgreSQL connection
│   │   ├── account.php            # Emails and one-time tokens
│   │   ├── items.php              # Report checks and photo uploads
│   │   ├── config.example.php     # Settings template
│   │   └── config.local.php       # Your settings (not in git)
│   ├── uploads/                   # Uploaded item photos
│   ├── migrate.php                # Applies database changes (command line)
│   ├── make-admin.php             # Makes a user an admin (command line)
│   └── test-db.php                # Quick database connection check
├── database/
│   ├── schema.sql                 # Full schema for a new install
│   └── migrations/                # Changes for an existing database
├── docx/                          # README and documentation
├── storage/                       # Development mail log (not in git)
└── frontend/
    ├── public/
    └── src/
        ├── components/            # Navbar, Footer, Logo, ItemCard
        ├── pages/                 # One file per page
        ├── api.js                 # API address and request helpers
        ├── App.jsx                # Routes
        └── main.jsx
```

## Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [PHP](https://www.php.net/) 8 or newer, with the `pdo_pgsql`, `fileinfo`, and `mbstring` extensions enabled in `php.ini`
- [PostgreSQL](https://www.postgresql.org/)

## Setup

### 1. Database

Create a PostgreSQL database named `campusLostFound` and load the schema:

```bash
createdb -U postgres campusLostFound
psql -U postgres -d campusLostFound -f database/schema.sql
```

The schema also adds the starting categories (Electronics, Documents, Accessories, Books, Other).

**Already have the database from an older version of the project?** Skip the commands above. Set up the backend (step 2), then apply the changes with:

```bash
php backend/migrate.php
```

### 2. Backend

Copy `backend/config/config.example.php` to `backend/config/config.local.php`, then set the host, port, database name, username, and password for your PostgreSQL server in the new file:

```bash
cp backend/config/config.example.php backend/config/config.local.php
```

`config.local.php` is ignored by git, so your database password is never committed.

Start PHP's built-in server from the project root. The frontend expects the API on port `8000`:

```bash
php -S localhost:8000 -t backend
```

Check the database connection by opening <http://localhost:8000/test-db.php>. It should show `Database connection successful!`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The backend only allows requests from this address (CORS), so keep the dev server on port `5173`.

### 4. Create an admin (optional)

Register an account on the website first, then run this from the project root and log in again:

```bash
php backend/make-admin.php your-email@example.com
```

## Emails in development

The `mail_mode` setting in `config.local.php` decides how verification and password reset emails are sent:

| Value  | What happens |
| ------ | ------------ |
| `log`  | Default. No email is sent. The email is written to `storage/mail.log`, and the website offers to open the link directly. Use this only on your own computer. |
| `mail` | The email is sent with PHP's `mail()` function. PHP must be set up to send mail (for example the sendmail settings in XAMPP). Use this on a real server. |

## Frontend Scripts

Run these inside `frontend/`:

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start the development server     |
| `npm run build`   | Build for production             |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Lint the code with Oxlint        |

## Pages

| Route              | Page                               |
| ------------------ | ---------------------------------- |
| `/`                | Home and search                    |
| `/login`           | Log in                             |
| `/register`        | Create an account                  |
| `/verify-email`    | Opened from the verification email |
| `/forgot-password` | Ask for a password reset link      |
| `/reset-password`  | Choose a new password              |
| `/lost-items`      | Lost items list                    |
| `/found-items`     | Found items list                   |
| `/report-lost`     | Report a lost item                 |
| `/report-found`    | Report a found item                |
| `/item/:id`        | Item details                       |
| `/my-reports`      | Your reports and claims            |
| `/edit-item/:id`   | Edit a report                      |
| `/messages`        | Conversations                      |
| `/admin`           | Admin area                         |

## API Endpoints

All endpoints are under `http://localhost:8000/api/` and return JSON with a `success` field. Under Access, "User" endpoints need a logged-in session and answer `401` without one; "Admin" endpoints also need the admin role and answer `403` without it.

| Method | Endpoint                  | Access | Description                                      |
| ------ | ------------------------- | ------ | ------------------------------------------------ |
| POST   | `register.php`            | Public | Create an account and send the verification link |
| POST   | `verify-email.php`        | Public | Verify an email address with the link's token    |
| POST   | `resend-verification.php` | Public | Send the verification link again                 |
| POST   | `login.php`               | Public | Log in, start a session, get the user's details  |
| POST   | `logout.php`              | Public | End the session                                  |
| POST   | `forgot-password.php`     | Public | Send a password reset link                       |
| POST   | `reset-password.php`      | Public | Set a new password with the link's token         |
| GET    | `categories.php`          | Public | List item categories                             |
| GET    | `lost-items.php`          | Public | List active lost items                           |
| GET    | `found-items.php`         | Public | List active found items                          |
| GET    | `item-details.php?id=`    | Public | Get one item (reporter's name only when logged in) |
| POST   | `report-lost.php`         | User   | Report a lost item (form data, optional photo)   |
| POST   | `report-found.php`        | User   | Report a found item (form data, optional photo)  |
| GET    | `my-items.php`            | User   | Your reports, claims on them, and your claims    |
| POST   | `update-item.php`         | User   | Edit a report (reporter or admin)                |
| POST   | `update-item-status.php`  | User   | Mark a report returned or active (reporter or admin) |
| POST   | `delete-item.php`         | User   | Delete a report (reporter or admin)              |
| POST   | `submit-claim.php`        | User   | Make a claim on an item                          |
| POST   | `update-claim.php`        | User   | Accept or reject a claim (reporter only)         |
| POST   | `send-message.php`        | User   | Send a message or a reply (`reply_to`)           |
| GET    | `get-conversations.php`   | User   | List your conversations                          |
| GET    | `get-messages.php?item_id=&user_id=` | User | Messages of one conversation            |
| GET    | `get-unread-count.php`    | User   | Count unread messages and waiting claims         |
| POST   | `mark-messages-read.php`  | User   | Mark one conversation as read                    |
| GET    | `admin-items.php`         | Admin  | List every report                                |
| GET    | `admin-users.php`         | Admin  | List every user                                  |
| POST   | `admin-update-user.php`   | Admin  | Change a user's role                             |

Uploaded photos are limited to 5 MB and must be JPEG, PNG, WebP, or GIF. They are saved in `backend/uploads/`.

## Security

- **Sessions** – logging in starts a PHP session kept in an `HttpOnly` cookie, which JavaScript cannot read. The API takes the user from the session and ignores any user ID sent by the browser, so one user cannot act as another. Sessions end after 2 hours without activity.
- **Only the frontend may call the API** – the allowed origin is set in `config.local.php`. Requests that change data from any other website are rejected.
- **Verified emails** – an account cannot log in until its email address is verified.
- **One-time links** – verification and reset links hold a random token, work once, and expire. Only a hash of the token is stored.
- **Attempt limits** – 5 wrong passwords, or 3 email requests, per 15 minutes for each email and IP address.
- **Ownership checks** – only the reporter or an admin can edit, close, or delete a report. Only the reporter can answer its claims.
- **Messages** – you can only message the reporter of an item, someone who messaged you about it, or a claimant on your own report.
- **Privacy** – visitors do not see who reported an item, and the reporter's ID is never sent to the browser.
- **Uploads** – the saved file's extension comes from the real file type, not the file name, so a script cannot be uploaded as an image.
- **Errors** – database errors go to the PHP error log. Users only see a general message.
- **Passwords** – stored hashed with `password_hash`. The database password lives in `config.local.php`, outside git.

## Notes

- The frontend reads the API address from `frontend/src/api.js`. To change it, create `frontend/.env` with `VITE_API_URL=https://your-api-address`. Change `allowed_origin` in `backend/config/config.local.php` to match the frontend address.
- The browser's `localStorage` only keeps the user's name and role for display. It is not used to prove who the user is.
- Use HTTPS and `mail_mode` = `mail` when deploying. The session cookie is then marked `Secure` automatically.
