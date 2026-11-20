# Deikhlo CC Portal

Run with Node.js 20 or later:

    npm install
    npm start

Start MySQL in XAMPP. Open http://127.0.0.1:3000 and sign in as admin using the saved password. Stop an existing server with Ctrl+C before starting another. A fresh database prompts once to create the admin password.

## Reports workspace

Everyone signs in at `/login` (or the portal root). The previous `/reports/login` URL redirects to the same login. There is no role selector or separate reports login form. The authenticated user's assigned role determines their destination and menu.

Admin opens **Admin Users → Add User**, enters a username and password, chooses **Admin** or **Reports**, and saves. Edit changes a role or password; a blank password keeps the existing one. Delete removes the login and sessions. The primary `admin` account cannot be deleted or demoted, and users cannot remove their own admin access. Role/password updates revoke that user's existing sessions.

`server/adminUsersRepository.js` manages accounts in the existing `cc_portal_admins` table. Passwords remain salted scrypt hashes in MySQL. To honor the no-schema-change requirement, assignments are stored in `server/private/account-roles.json` by `server/roleStore.js`. This private directory is excluded from Git and blocked from browser access. **Back up this directory alongside the database when moving/restoring the portal.** Keep a single application instance managing this file; role-file writes are serialized and replaced atomically. Database transactions and file replacement are separate resources, so backups must preserve both.

`server/access.js` reads the stored assignments. `scripts/local.mjs` enforces roles for page and API requests, including direct URLs. Admin can access all customer-care pages, reports and user management. Reports users see only the report menu and cannot access customer-care or user-management APIs. No database tables or columns are created or altered.

`server/planRevenueRepository.js` reads `charging_logs_new` for a selected date range. Counts are charging counts, not distinct people. Calculated revenue excludes tax and uses the supplied rates: service 99171 = PKR 4, 99144 = PKR 5, 89130 = PKR 7. Change rates in `reportPlans` when confirmed business rules change. Unknown services are counted but excluded from revenue with a visible notice. No monthly service is configured in these charging records.

`src/pages/PlanRevenueReport.jsx` implements date filters and daily breakdown; `src/utils/exportPlanRevenue.js` exports the report. Both reports initially show an empty state and only generate results on form submission. Filters start with the current Pakistan month. A loading overlay blurs the page during generation.

`src/pages/CampaignReport.jsx` supports all sources or one source, daily user/charged counts, conversion, inclusive calendar days and Excel export. Sources come from actual `users.source_id` values, labelled by ID because no campaign-name mapping exists. The Affiliate Campaign menu and route are removed.

`server/campaignReportRepository.js` groups existing users by `creation_date` and `source_id`. A charged user is a user record with a nonzero `last_success_charge` on/after creation, independent of the selected charging period. Missing dates are not evidence that a user was never charged. Phone variants are not deduplicated. Database source IDs do not prove a campaign is currently running. Invalid creation dates are excluded from dated reports. Results use a shared in-memory snapshot for up to 5 minutes because the imported users table has no suitable date/source index; the bounded aggregation creates no tables or indexes. First load can take about 25 seconds on the current imported database.

Run `node --test server/reports.test.js server/campaignReport.test.js` for role, date-range, filtering, calculation and Excel checks.

The campaign dropdown is independent of report aggregation. `server/campaignOptionsCache.js` saves the real source list in `server/private/campaign-options.json`, reuses it across restarts, and refreshes it in the background after five minutes. Only a first load without this file waits for a distinct-source query. Full campaign counts are calculated when Generate Report is selected.

## Dashboard components

- src/components/Header.jsx — header and logout
- src/components/Sidebar.jsx — menu
- src/components/SearchUser.jsx — number search form
- src/components/UserDetails.jsx — subscriber details and balance
- src/pages/Dashboard.jsx — search state and dashboard layout
- src/utils/phone.js — Pakistani phone number normalization
- src/services/subscribers.js — API request
- src/styles.css — black/red theme and responsive styles
- scripts/local.mjs — local server and authentication integration
- worker/index.js — login and session validation

Dashboard, Deactivations, Activation History and Blacklist are available through the sidebar.

The authenticated API reads subscriber and history records from binjee_db.

npm run build checks and builds the React frontend. npm start runs the local server with Vite development middleware.

## Database authentication

Startup reads the existing cc_portal_admins and cc_portal_sessions tables and checks for the admin account. It does not create or alter database tables. When moving to another database, restore a backup containing these login tables and the existing account.

server/auth.js stores a random-salt scrypt hash (N=32768, r=8, p=3), the salt and scheme in cc_portal_admins. The raw password is never stored in the database. An existing account is never overwritten by startup or ADMIN_PASSWORD. On a fresh database only, startup asks for a password of at least 10 characters or uses ADMIN_PASSWORD for initial provisioning.

Sessions use random 32-byte tokens with only their SHA-256 hashes stored in cc_portal_sessions. They expire after eight hours, survive server restarts and are deleted at logout. Five incorrect attempts lock the account for 15 minutes. The failed-attempt counter and lock persist in MySQL.

The server binds to 127.0.0.1. Public deployment requires HTTPS and a production server in place of Vite development middleware.

## Local MySQL integration

Start MySQL in XAMPP, then run npm start. The backend uses local defaults 127.0.0.1:3306, database binjee_db, user root with an empty password, matching the inspected XAMPP setup. Override these using DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD environment variables.

- server/database.js manages the MySQL pool and 15-second query timeout.
- server/subscriberRepository.js contains parameterized queries and UI field mapping.
- server/api.js validates phone numbers and returns API responses.
- scripts/local.mjs checks the admin session before calling the API.

Subscriber data comes from users joined to subscription_plans. Status 1 maps to Active, 0 to Inactive, and other values retain their code. Historical deactivate_date can coexist with status 1 in the imported data. Balance has no verified source and displays N/A. Timeline currently represents the user creation record. Charging logs come from charging_logs (latest 1,000 matching rows, ordered by log_date and id); the August/September archive tables are separate. OTPs come from signup_otp, and recent deactivations from users.deactivate_date/reason. SMS logs have no matching table. History returns at most 1,000 rows per log section and recent deactivations returns 100.

Authentication uses the two existing portal login tables. Deactivation updates local users.status to 0 and records the reason and Pakistan date. It uses row locks and an atomic transaction for up to 1,000 numbers. Already-inactive records retain their existing date and reason. Operator/network unsubscription is not integrated.


## Blacklist management

Open /blacklist to search a number and add or remove its blacklist status. The shared phone input normalizes Pakistani numbers. A number can be listed before it has a users record.

server/blacklistRepository.js synchronizes users_blacklist.msisdn (10 digits) and users.is_blacklist (1/0) in one transaction. Blacklisting also sets matching users.status and users.plan_id to 0. Removing a blacklist flag does not reactivate the subscription or restore the plan. For an existing users record, is_blacklist is authoritative: 0 clears the displayed blacklist status even if users_blacklist still contains the number. For numbers without a users record, users_blacklist continues to hold the blacklist status. Adding/removing again is safe. Other operator-specific blacklist tables are outside this option.

The dashboard shows the effective blacklist status, including numbers saved only in users_blacklist. These show their phone and blacklist status with no subscription; missing subscriber details remain N/A and no activation event is invented. POST /api/blacklist is protected by the existing admin session and same-origin check. No schema migration is needed. The current schema has no blacklist reason or timestamp columns, so this page does not invent a blacklist history.

Signup, operator charging and activation systems must enforce this blacklist themselves. This portal manages local records and does not call an operator blocking API.



## Bulk preview and reports

Bulk upload displays file details, valid/invalid/duplicate counts and row issues. Preview Deikhlo Status checks unique valid numbers against users and users_blacklist in batches of 500. It returns subscription status, plan, blacklist flag, source, creation and deactivation details. This preview performs read-only queries. Its progress reflects completed requests.

Downloadable CSV reports include every input row and escape spreadsheet formulas. Invalid and duplicate rows are marked skipped. The on-screen table paginates 50 rows at a time.

Process Deactivation enables after a file has valid numbers and requires a reason. If a preview has not been generated, clicking it checks subscriber status automatically before processing. It submits active records in batches of 500, with a transaction per batch. Invalid, duplicate, missing, ambiguous, inactive and unsupported-status rows are skipped. On failure, processing stops; earlier committed batches remain reflected in the results report. A failed request is marked for status verification before retry because a network error can occur after commit. Refresh the preview before retrying. Keep this page open until processing finishes.

The result report includes each row's deactivation outcome. No subscriber modifications are made by uploading a file or generating a preview.

## Recent deactivation performance

The existing users index cc_portal_recent_deactivations covers deactivate_date, updated_at and id. The recent-history query returns 100 rows in descending date/update/id order. The application does not create or alter indexes. Restore the existing database backup, including its indexes, when moving to another database.

Recent Deactivations is shown under Quick Deactivation. It refreshes after a successful operation and has a manual Refresh button.



New numbers blacklisted through the portal now receive a permanent users record with status=0, plan_id=0, is_blacklist=1, trial=0 and source_id=cc_portal. Unblacklisting retains that record and clears is_blacklist. For a newly created record, required creation_date and recharge_date are initialized to the Pakistan creation date; recharge_date is an initial schema value, while last_success_charge remains NULL. Existing phone formats are checked before insertion to avoid duplicate users.
