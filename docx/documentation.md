# Campus Lost & Found – Project Documentation

## 1. What this project is

Campus Lost & Found is a website for a university campus. When someone loses something (a phone, an ID card, a book), they post a "lost" report. When someone finds something, they post a "found" report. Other people can look through these reports, see on a map where the item was lost or found, send a private message to the person who posted it, and make a claim so the item can be returned.

In short, it replaces the notice board and the "has anyone seen my…" group chat messages with one place to look.

## 2. Who uses it

| User | What they can do |
| ---- | ---------------- |
| Visitor (not logged in) | See the home page, search, browse lost and found items, open item details (without the reporter's name) |
| Logged-in user | Everything above, plus report items, edit or delete their own reports, mark them as returned, send messages, make claims, and accept or reject claims on their own reports |
| Admin | Everything above, plus edit, close, or delete any report, and give or remove the admin role |

New accounts get the `student` role. The first admin is created from the command line (see section 4.12).

## 3. How the system is built

The project has three parts that talk to each other:

```
 Browser (React app)            PHP API                  PostgreSQL
 http://localhost:5173   -->    http://localhost:8000    -->   campusLostFound
 frontend/                      backend/api/                   database
                                backend/uploads/  (item photos)
```

1. **Frontend** – a React app (built with Vite). It shows the pages and sends requests to the API with `fetch`.
2. **Backend** – plain PHP files. Each file is one API endpoint. It checks the input, runs an SQL query through PDO, and sends back JSON.
3. **Database** – PostgreSQL. It stores users, items, categories, messages, claims, and one-time email tokens.

Maps are drawn with Leaflet using OpenStreetMap tiles. No map API key is needed.

Every API answer has the same shape: a `success` field (true or false), a `message` when something needs to be shown to the user, and the data that was asked for.

## 4. What happens, step by step

### 4.1 Registering and verifying the email

1. The user fills in name, email, and password on the Register page.
2. The page checks the password: at least 8 characters, one uppercase letter, one lowercase letter, one number.
3. `register.php` checks the same rules again, hashes the password, and saves the user as "not verified".
4. The API emails a verification link that works for 24 hours and only once.
5. Opening the link shows the Verify Email page, which calls `verify-email.php`. The account is now verified.
6. If the email is already used, the API answers "Email already exists."

**Development mode:** on a local computer no real email is sent. The email is written to `storage/mail.log`, and the website asks "open the link from the email now?" so the flow can still be tested. This is controlled by `mail_mode` in `backend/config/config.local.php` (see section 7).

### 4.2 Logging in and out

1. The user enters email and password on the Login page.
2. `login.php` finds the user by email and compares the password with the stored hash. After 5 wrong passwords in 15 minutes it refuses further tries for that email and IP address.
3. If the email is not verified yet, login is refused and the page offers to send the verification link again (`resend-verification.php`).
4. On success the API starts a session on the server and sends the browser a session cookie. It also sends back the user's `id`, `name`, `email`, and `role` (never the password).
5. The frontend saves this user in the browser's `localStorage` (only to show the name and menu) and goes to the home page.
6. Every later request carries the session cookie. The API reads the user from the session, not from anything the browser sends.
7. Logout asks for confirmation, ends the session through `logout.php`, and goes to the Login page.
8. If the session has expired (2 hours without activity), the next request gets a `401` answer and the frontend sends the user back to the Login page.

### 4.3 Forgotten password

1. On the Login page the user clicks **Forgot your password?** and enters their email.
2. `forgot-password.php` emails a reset link that works for 1 hour and only once. The answer is the same whether or not the email has an account, so nobody can use this page to find out who is registered.
3. Opening the link shows the New Password page. `reset-password.php` checks the link and the password rule, then saves the new password.

### 4.4 Reporting a lost or found item

1. The user opens Report Lost Item or Report Found Item. The category list is loaded from `categories.php`.
2. The user enters a title, category, location name, date, description, and can add a photo.
3. The user clicks on the map to drop a pin. This gives the latitude and longitude.
4. If the user is not logged in, or no map pin is set, the page stops and shows a message.
5. The form is sent to `report-lost.php` or `report-found.php` as form data (because it can contain a file).
6. The API checks the user is logged in, then checks the coordinates, date, and required fields. A photo must be JPEG, PNG, WebP, or GIF and under 5 MB. It is saved in `backend/uploads/` with a random name, and its extension is chosen from the real file type.
7. The item is saved in the `items` table with type `lost` or `found` and status `active`, under the logged-in user.

### 4.5 Browsing and searching

- **Lost Items** and **Found Items** pages each load their list from `lost-items.php` or `found-items.php`, newest first. Items already marked as returned are not listed.
- The **Home** page loads both lists, joins them, and shows the three most recently reported items.
- **Search** on the home page happens inside the browser, not on the server. It filters the loaded items by the text typed (matched against title, location, and description) and by the chosen category.

### 4.6 Viewing an item

1. Clicking an item opens `/item/<id>`.
2. The page asks `item-details.php` for that item.
3. The page shows the photo (or a placeholder), a LOST or FOUND label, a RETURNED label if it is closed, description, location, date, category, and a map with a pin.
4. The reporter's name is shown only to logged-in users. The reporter's id is never sent to the browser.
5. The reporter sees a **Go to My Reports** button instead of the message and claim buttons.

### 4.7 Messaging

1. On the item page, a logged-in user clicks **Send Message**. A visitor is asked to log in first.
2. The message goes to `send-message.php` with the item. The server works out the receiver (the reporter) by itself.
3. A user may only message: the reporter of an item, someone who already messaged them about that item, or (as the reporter) someone who made a claim on it.

### 4.8 Inbox

1. The navbar asks `get-unread-count.php` every 5 seconds and shows a number badge next to Messages when there are unread messages.
2. The Messages page groups messages into **conversations**: one conversation is all the messages with one other person about one item (`get-conversations.php`). Each row shows the other person's name, the item, the latest message, and an unread count.
3. Clicking a conversation opens it on the right (`get-messages.php`), oldest message at the top, like a chat.
4. Only the conversation that is opened is marked as read (`mark-messages-read.php`). Other conversations keep their unread count.
5. The user types in the box at the bottom to answer. Clicking **Reply** on a message quotes it above the answer.
6. The page checks for new messages every 5 seconds.

### 4.9 Claims

1. On a **lost** item, a logged-in user can click **I Found This Item** and describe where and how they found it.
2. On a **found** item, a logged-in user can click **This Is My Item** and give details that prove it is theirs.
3. `submit-claim.php` saves the claim as `pending`. A user cannot claim their own report, cannot claim a returned item, and can have only one pending claim on an item.
4. The reporter sees a number badge next to **My Reports** in the navbar while claims are waiting.
5. On the My Reports page the reporter reads each claim and clicks **Accept** or **Reject** (`update-claim.php`), or **Message** to talk to the claimant first.
6. **Accept** marks the item as returned and rejects the other waiting claims on it.
7. Each claimant gets a message in their inbox with the decision, and can see the status of all their claims under **My Claims** on the My Reports page.

### 4.10 Managing your own reports

The My Reports page (`my-items.php`) lists everything the user reported. For each report the user can:

- **Edit** – change any detail or replace the photo (`update-item.php`).
- **Mark as Returned** / **Mark as Active** – close or reopen it (`update-item-status.php`).
- **Delete** – remove it together with its photo, claims, and messages (`delete-item.php`).

The API allows these only for the person who reported the item, or an admin.

### 4.11 Admin area

Admins see an **Admin** link in the navbar. The Admin page has two tabs:

- **Reports** – every report, including returned ones, with Edit, Close/Reopen, and Delete (`admin-items.php`).
- **Users** – every user with their role, number of reports, and a button to give or remove the admin role (`admin-users.php`, `admin-update-user.php`). An admin cannot remove their own admin role.

The server checks the admin role in the database on every admin request, so hiding the link is not what protects the page.

### 4.12 Creating the first admin

Run this from the project root, then log in again with that account:

```bash
php backend/make-admin.php someone@example.com
```

## 5. Data that is stored

The full schema is in `database/schema.sql`.

| Table | What it holds | Main columns |
| ----- | ------------- | ------------ |
| `users` | Accounts | `id`, `name`, `email` (unique), `password` (hashed), `role` (`student` / `admin`), `email_verified_at`, `created_at` |
| `categories` | Item categories | `id`, `name` |
| `items` | Lost and found reports | `id`, `user_id`, `category_id`, `title`, `type` (`lost` / `found`), `location`, `latitude`, `longitude`, `item_date`, `description`, `image_url`, `status` (`active` / `returned`), `created_at` |
| `messages` | Private messages | `id`, `sender_id`, `receiver_id`, `item_id`, `message`, `reply_to`, `is_read`, `created_at` |
| `claims` | Claims on items | `id`, `item_id`, `user_id`, `message`, `status` (`pending` / `accepted` / `rejected`), `created_at` |
| `user_tokens` | One-time links for email verification and password reset | `id`, `user_id`, `type`, `token_hash`, `expires_at`, `used_at` |

How they connect:

- An item belongs to one user (who reported it) and one category.
- A message has a sender, a receiver, and the item it is about. A reply points to the message it answers through `reply_to`.
- A claim belongs to one item and one user.
- A token belongs to one user. Only a hash of the token is stored, so a copy of the database cannot be used to open someone's link.

Changes to an existing database are kept in `database/migrations/` and applied with `php backend/migrate.php`.

## 6. Where things are in the code

### Frontend (`frontend/src/`)

| File | Purpose |
| ---- | ------- |
| `App.jsx` | Defines the routes |
| `api.js` | The API address and the helpers every page uses to call the API |
| `components/Navbar.jsx` | Top menu, login state, unread message and waiting claim badges, logout |
| `components/Logo.jsx` | The logo (map pin with a check mark) used in the navbar and footer |
| `components/Footer.jsx` | Page footer with links |
| `components/ItemCard.jsx` | The item card used on the home, lost and found pages |
| `pages/Home.jsx` | Hero section, search, recent reports |
| `pages/Login.jsx`, `pages/Register.jsx` | Account pages |
| `pages/VerifyEmail.jsx` | Opened from the verification email |
| `pages/ForgotPassword.jsx`, `pages/ResetPassword.jsx` | Password reset |
| `pages/LostItems.jsx`, `pages/FoundItems.jsx` | Item lists |
| `pages/ReportLostItem.jsx`, `pages/ReportFoundItem.jsx` | Report forms with map pin and photo |
| `pages/ItemDetails.jsx` | One item, its map, message form, claim form |
| `pages/MyReports.jsx` | The user's reports, claims on them, and claims the user made |
| `pages/EditItem.jsx` | Edit a report |
| `pages/Inbox.jsx` | Conversations and messages |
| `pages/Admin.jsx` | Admin area |
| `App.css`, `index.css` | All styling. The colours, fonts and spacing are defined once at the top of `App.css` |

### Backend (`backend/`)

| File | Purpose |
| ---- | ------- |
| `config/bootstrap.php` | Loaded by every endpoint: CORS headers, session, login and admin checks, attempt limits, shared helpers |
| `config/database.php` | Connects to PostgreSQL |
| `config/config.local.php` | Database settings, the allowed frontend address, and the mail mode (not in git; copied from `config.example.php`) |
| `config/account.php` | Sends emails and creates and checks one-time tokens |
| `config/items.php` | Checks report fields, saves and deletes photos, checks who may manage a report |
| `api/register.php`, `api/login.php`, `api/logout.php` | Accounts and sessions |
| `api/verify-email.php`, `api/resend-verification.php` | Email verification |
| `api/forgot-password.php`, `api/reset-password.php` | Password reset |
| `api/categories.php` | Category list |
| `api/lost-items.php`, `api/found-items.php` | Lists of active items |
| `api/item-details.php` | One item |
| `api/report-lost.php`, `api/report-found.php` | Save a report |
| `api/my-items.php` | The user's reports and claims |
| `api/update-item.php`, `api/update-item-status.php`, `api/delete-item.php` | Edit, close or reopen, and delete a report |
| `api/submit-claim.php`, `api/update-claim.php` | Make a claim; accept or reject it |
| `api/send-message.php` | Save a message or a reply |
| `api/get-conversations.php`, `api/get-messages.php` | The conversation list; one conversation |
| `api/get-unread-count.php` | Number of unread messages and waiting claims |
| `api/mark-messages-read.php` | Mark one conversation as read |
| `api/admin-items.php`, `api/admin-users.php`, `api/admin-update-user.php` | Admin area |
| `api/reply-message.php` | Older name for sending a reply; it runs `send-message.php` |
| `migrate.php`, `make-admin.php` | Command-line tools: apply database changes; create an admin |
| `test-db.php` | Shows whether the database connection works |
| `uploads/` | Item photos |

### Other folders

| Folder | Purpose |
| ------ | ------- |
| `database/` | `schema.sql` for a new install and `migrations/` for changes |
| `storage/` | `mail.log`, the emails written in development mode (not in git) |
| `docx/` | This documentation and the README |

## 7. Current limits

Things to know when presenting the project or planning the next steps.

1. **Real emails need a mail server.** The project is set to development mode (`mail_mode` = `log`): no email is sent and the website shows the link itself. For real use, set `mail_mode` to `mail` in `backend/config/config.local.php` and configure PHP's `mail()` (for example the sendmail settings in XAMPP). Until then anyone could "verify" any email address, so development mode must not be used on a public server.
2. **Accepting a claim closes the item at once.** The website does not track whether the item was really handed over. The reporter can reopen it with **Mark as Active**.
3. **Deleting a report deletes its messages** for both people in the conversation.
4. **Admins cannot delete users or manage categories** from the website. Categories are changed in the database.
5. **Search works on the items already loaded in the browser**, and the lists are not split into pages. This is fine for a campus-sized list but would be slow with thousands of items.
6. **New messages appear after up to 5 seconds**, because the pages ask the server on a timer. There are no notifications outside the website (no email when a message or claim arrives).

## 8. Security

How the project protects users and data:

| Risk | Protection |
| ---- | ---------- |
| Pretending to be another user | The API takes the user from the server session, never from the request. Reporting, messaging, claiming, and reading messages all need a login. |
| Changing someone else's report or claim | Edit, status, and delete are allowed only for the reporter or an admin. Only the reporter can answer a claim. |
| Reaching the admin area | The admin role is read from the database on every admin request. |
| Stealing the login from the browser | The session cookie is `HttpOnly`, so JavaScript cannot read it. |
| Another website sending requests for a logged-in user (CSRF) | The cookie is `SameSite=Lax`, and requests that change data are rejected unless they come from the frontend's address. |
| Guessing passwords | 5 wrong tries per 15 minutes for each email and IP address. Passwords need 8+ characters with upper case, lower case, and a number. |
| Fake email addresses | An account cannot log in until its email address is verified. |
| Stolen or guessed email links | Links hold a long random token, work once, expire (24 hours for verification, 1 hour for password reset), and only a hash is stored. Requests for links are limited to 3 per 15 minutes. |
| Finding out who has an account | Password reset and resend-verification give the same answer for known and unknown emails. |
| Reading stored passwords | Passwords are hashed with `password_hash`. |
| SQL injection | Every query uses prepared statements. |
| Uploading a script as an image | The file type is checked from the file's content, and the saved extension comes from that type, not from the uploaded file name. |
| Unwanted messages | A user can only message the reporter of an item, someone who messaged them about it, or a claimant on their own report. |
| Exposing who reported an item | Visitors do not see the reporter's name, and the reporter's id is never sent to the browser. |
| Leaking server details | Database errors are written to the PHP error log; the user sees a general message. |
| Leaking the database password | It is kept in `config/config.local.php`, which git ignores. |

## 9. Running the project

Setup steps (database, backend, frontend) are in the [README](README.md).
