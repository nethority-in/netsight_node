# NetSight Node Server

Express.js server with Prisma, WhatsApp/Twilio integration, and JWT-based auth. Users are stored in a JSON file; protected APIs require a JWT (from login/register) or an API secret.

---

## Environment (.env)

### Required for auth and protected APIs

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

- **JWT_SECRET** – Used to sign and verify JWTs. Use a long, random string in production (e.g. 32+ characters).
- **JWT_EXPIRES_IN** – Token lifetime (e.g. `24h`, `7d`, `30m`).

### Optional

```env
API_SECRET=your-api-secret-for-server-to-server
```

- **API_SECRET** – If set, you can call protected APIs with header `x-api-key: <API_SECRET>` instead of a JWT (useful for server-to-server or Postman).

### Other .env variables (as needed)

- **PORT** – Server port (default `3002`).
- **Twilio:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SANDBOX_WHATSAPP_FROM` (for sandbox WhatsApp).
- **Database:** `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, etc. (for Prisma).

---

## WhatsApp message send करण्यासाठी बनवलेले APIs (फक्त हे 3)

या folder मध्ये WhatsApp message पाठवण्यासाठी **फक्त हे 3 API** बनवले आहेत. सर्वांना **JWT** (Bearer) किंवा **x-api-key** लागतो.

| Environment | Base URL |
|-------------|----------|
| **Local**   | `http://localhost:3002` |
| **Server**  | `https://bridge.netsights.ai` |

| # | API | Local URL | Server URL |
|---|-----|-----------|------------|
| 1 | **Template message** (Meta/Twilio template) | `POST http://localhost:3002/api/whatsapp/send-message` | `POST https://bridge.netsights.ai/api/whatsapp/send-message` |
| 2 | **Dynamic message** (dynamic template + variables) | `POST http://localhost:3002/api/whatsapp/send-dynamic` | `POST https://bridge.netsights.ai/api/whatsapp/send-dynamic` |
| 3 | **Twilio Sandbox message** | `POST http://localhost:3002/sandbox/twilio/send-sandbox-message` | `POST https://bridge.netsights.ai/sandbox/twilio/send-sandbox-message` |

**Headers (सर्व 3 साठी):** `Content-Type: application/json`, `Authorization: Bearer <token>` किंवा `x-api-key: <apiKey>`

---

## How to use the APIs

### 1. Register a user (get JWT)

- **URL:** `POST http://localhost:3002/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "username": "myuser",
  "password": "mypassword123"
}
```

- **Success (201):** Returns `token`, `apiKey`, `user` (id, username), and `storageHint`. Use `token` (Bearer) or `apiKey` (x-api-key) for protected APIs.
- **User exists (409):** Use login instead.

### 2. Login (get JWT)

- **URL:** `POST http://localhost:3002/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "username": "myuser",
  "password": "mypassword123"
}
```

- **Success (200):** Returns `token`, `apiKey`, and `user`. Use `token` (Bearer) or `apiKey` (x-api-key) for protected APIs.

### 3. Call protected APIs (e.g. send WhatsApp)

Use **one** of these:

- **Option A – JWT (recommended for users):**  
  Header: `Authorization: Bearer <token>`  
  (Use the `token` from register or login.)

- **Option B – Per-user API key:**  
  Header: `x-api-key: <apiKey>`  
  (Use the `apiKey` returned from register or login. Identifies that user.)

- **Option C – Global API secret (if API_SECRET is set in .env):**  
  Header: `x-api-key: <API_SECRET>`

**Examples of protected endpoints:**

- All under `/api/*` (e.g. `/api/test`, `/api/whatsapp/send-message`, etc.)
- `POST /sandbox/twilio/send-sandbox-message`

**Example – Sandbox send message:**

- **URL:** `POST http://localhost:3002/sandbox/twilio/send-sandbox-message`
- **Headers:**  
  `Content-Type: application/json`  
  `Authorization: Bearer <your-jwt-token>`
- **Body (raw JSON):**

```json
{
  "to": "whatsapp:+919876543210",
  "contentSid": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "contentVariables": {}
}
```

---

## Testing in Postman

### Step 1: Register

1. New request → **POST** → `http://localhost:3002/auth/register`
2. **Body** → raw → JSON:

```json
{
  "username": "testuser",
  "password": "testpass123"
}
```

3. Send. Copy the **token** from the response (e.g. `eyJhbGc...`).

### Step 2: Use the token on protected APIs

1. New request → **GET** → `http://localhost:3002/api/test`
2. **Authorization** tab → Type: **Bearer Token** → Token: paste the token you copied.
3. Send. You should get a successful response.

### Step 3: Login (if user already exists)

1. **POST** → `http://localhost:3002/auth/login`
2. Body → raw → JSON:

```json
{
  "username": "testuser",
  "password": "testpass123"
}
```

3. Send. Copy the new **token** and use it as Bearer as in Step 2.

### Step 4: Send sandbox WhatsApp (if Twilio is configured)

1. **POST** → `http://localhost:3002/sandbox/twilio/send-sandbox-message`
2. **Authorization** → Bearer Token → paste your JWT.
3. **Body** → raw → JSON:

```json
{
  "to": "whatsapp:+91xxxxxxxxxx",
  "contentSid": "HX...",
  "contentVariables": {}
}
```

### Step 5: WhatsApp template – numbered variables {{1}}, {{2}} (send-message)

**URL:** `POST http://localhost:3002/api/whatsapp/send-message`  
**Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>` (or `x-api-key: <apiKey>`)

**Body (positional parameters):**

```json
{
  "to": "+919876543210",
  "templateName": "new_order",
  "languageCode": "en",
  "parameters": [
    "John Doe",
    "ORD-12345",
    "NetSight Store",
    "15 Jan 2024",
    "John Doe",
    "₹2,500",
    "Credit Card",
    "Mumbai",
    "Mumbai",
    "16 Jan 2024"
  ]
}
```

### Step 6: WhatsApp template – named variables {{Store Name}}, {{Previous Date}} (send-message)

Templates with **named placeholders** (e.g. business performance report) use `components.bodyNamed`: keys must match the variable names in your Twilio template. **Twilio does not allow spaces in variable names** – use underscores in the template (e.g. `{{Store_Name}}`, `{{Previous_Date}}`) and same keys in the body.

**URL:** `POST http://localhost:3002/api/whatsapp/send-message`  
**Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>` (or `x-api-key: <apiKey>`)

**Body (named parameters – business_performance_report):**

1. In `src/config/twilioTemplateConfig.ts`, set `business_performance_report` to your approved Twilio Content SID (e.g. `HX...`).
2. In Postman:

```json
{
  "to": "+919876543210",
  "templateName": "business_performance_report",
  "languageCode": "en",
  "components": {
    "bodyNamed": {
      "Store_Name": "NetSight Store",
      "Previous_Date": "12 Feb 2025",
      "Revenue": "₹45,000",
      "Orders": "120",
      "AOV": "₹375",
      "Revenue_%_Change": "+12%",
      "Orders_%_Change": "+8%",
      "Fb_ROAS": "FB ROAS: 2.4x",
      "GoogleAds_ROAS": "Google ROAS: 1.9x",
      "CAC": "CAC: ₹180",
      "CM": "CM: 22%",
      "Metric": "Conversion rate",
      "%_Change": "5%"
    }
  }
}
```

Note: Your approved template has repeated placeholders (e.g. **Metric** and **% Change** multiple times). Twilio substitutes the same value for every occurrence of that variable name. If your template uses different names for each bullet (e.g. `Metric_1`, `Metric_2`), add those keys in `bodyNamed`. Adjust keys to match **exactly** the variable names in your Twilio template (no spaces; use underscores).

### Optional: Use API secret instead of JWT

1. Add **API_SECRET** to your `.env` (e.g. `API_SECRET=my-secret-key`).
2. In Postman, for any protected request, either:
   - **Headers** → Add: `x-api-key` = `my-secret-key`,  
   or
   - Keep using **Authorization: Bearer** with the JWT.

---

## Project structure

- **Auth:** Users stored in `src/data/users.json` (dev) or `data/users.json` (prod). Auth events logged to `logs-auth.json`.
- **Auth routes:** `/auth/register`, `/auth/login` (no auth required).
- **Protected routes:** All `/api/*` and `POST /sandbox/twilio/send-sandbox-message` require **JWT** (Bearer) or **x-api-key** (per-user `apiKey` from register/login, or global `API_SECRET`).

---

## Logs — Server आणि local वर कुठे आहेत (Where logs are stored)

Server वर logs दिसत नसल्यास: **`NODE_ENV=production`** असल्यावर logs **project root च्या `logs/` folder** मध्ये जातात. Local वर `src/` मध्ये जातात.

| Environment | Location (project root = जिथून server start होतो) |
|-------------|--------------------------------------------------------|
| **Server (production)** | `logs/logs-whatsapp.json`, `logs/logs-email.json`, `logs/logs-auth.json`, इ. |
| **Local (dev)** | `src/logs-whatsapp.json`, `src/logs-email.json`, `src/logs-auth.json`, इ. |

**Server वर logs बघण्यासाठी:**

1. **`.env` मध्ये किंवा start command मध्ये `NODE_ENV=production` सेट करा** (PM2 / ecosystem.config.js मध्ये `env: { NODE_ENV: 'production' }`).
2. Project root मध्ये **`logs/` folder** तुमच्या app च्या working directory मध्ये तयार होईल (पहिल्या log write वेळी auto-create होतो).
3. Path: ज्या directory मधून तुम्ही `npm start` किंवा `node dist/...` चालवता त्या **त्याच folder मध्ये** `logs/` दिसेल.  
   - उदा. जर server `/var/www/myapp` मधून चालत असेल तर logs येथे: **`/var/www/myapp/logs/logs-whatsapp.json`**, **`/var/www/myapp/logs/logs-email.json`**.

**फाइल्स:** `logs-whatsapp.json`, `logs-email.json`, `logs-auth.json`, `logs-meta-api.json`, `logs-notification.json`, `logs-from-numbers.json`, `logs-create-custom-template.json`, इ.

---

## Prisma commands

- `npm run prisma:generate` – Generate Prisma Client
- `npm run prisma:migrate` – Create and apply database migrations
- `npm run prisma:push` – Push schema to database (development)
- `npm run prisma:studio` – Open Prisma Studio

## Run the server

```bash
npm run dev
# or
npm start
```

"bodyNamed": {
  "Store_Name": "My Store",
  "Previous_Date": "12 Feb 2025",
  "Revenue": "₹45,000",
  "Orders": "120",
  "AOV": "₹375",
  "Revenue_%_Change": "+12%",
  "Orders_%_Change": "+8%",
  "Fb_ROAS": "FB ROAS: 2.4",
  "GoogleAds_ROAS": "Google ROAS: 1.8",
  "CAC": "CAC: ₹150",
  "CM": "CM: 35%",
  "Metric1": "Conversion Rate",
  "%_Change1": "5%",
  "Metric2": "Avg. Order Value",
  "%_Change2": "3%",
  "Metric3": "Bounce Rate",
  "%_Change3": "2%",
  "Metric4": "Cart Abandonment",
  "%_Change4": "1.5%"
}

{
  "to": "+919876543210",
  "templateName": "copy_netsightsdailyreports_13feb",
  "languageCode": "en",
  "components": {
    "bodyNamed": {
      "1": "My Store",
      "2": "12 Feb 2025",
      "3": "₹45,000",
      "4": "120",
      "5": "₹375",
      "6": "+12%",
      "7": "+8%",
      "8": "FB ROAS: 2.4",
      "9": "Google ROAS: 1.8",
      "10": "CAC: ₹150",
      "11": "CM: 35%",
      "12": "Conversion Rate",
      "13": "5%",
      "14": "Avg. Order Value",
      "15": "3%",
      "16": "Bounce Rate",
      "17": "2%",
      "18": "Cart Abandonment",
      "19": "1.5%"
    }
  }
}


{
  "to": "+919876543210",
  "templateName": "copy_netsightsdailyreports_13feb",
  "languageCode": "en",
  "components": {
    "body": [
      "My Store",
      "12 Feb 2025",
      "₹45,000",
      "120",
      "₹375",
      "+12%",
      "+8%",
      "FB ROAS: 2.4",
      "Google ROAS: 1.8",
      "CAC: ₹150",
      "CM: 35%",
      "Conversion Rate",
      "5%",
      "Avg. Order Value",
      "3%",
      "Bounce Rate",
      "2%",
      "Cart Abandonment",
      "1.5%"
    ]
  }
}

whsatpp request 
for preview 
http://localhost:3002/api/whatsapp/send-message-preview
for sending
http://localhost:3002/api/whatsapp/send-message

{
  "to": "+918698673161",
  "templateName": "copy_new_order_2",
  "languageCode": "en_US",
  "components": {
  "bodyNamed": {
    "StoreName": "Celebrity Drapes",
    "PrevDate": "15 Feb 2026",
    "Revenue": "₹46,613.14",
    "Orders": "14",
    "AOV": "₹3,049.26",
    "RevChgPct": "+31.6%",
    "OrdChgPct": "+27.3%",
    "MetaSummary": "Meta ads generated ₹ 300,696.86 with ROAS of 40.23. Revenue increased by 846.15% and ROAS increased by 504.96%.",
    "MetaCAC": "Customer Acquisition Cost on Meta increased to ₹ 679.44.",
    "GoogleSummary": "Google ads: No activity recorded for this period.",
    "GoogleCAC": "customer",
    "day":"5",
    "PositiveChanges": "Revenue grew strongly by 31.6% vs previous day, Order volume increased by 27.3% vs previous day,• Meta ad revenue surged by ~846% — exceptional growth vs previous day, Meta ROAS surged by ~505% — exceptional ROAS improvement,",
    "RequiresReviews": "Meta CAC increased by 13.7% — monitor closely,"
  }
 }
}


**Postman: Email Preview (no Mailjet send)**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/email/preview` (or your port)
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "templateName": "business_performance_summary",
  "parameters": {
    "StoreName": "My Store",
    "PrevDate": "21st Dec 2024",
    "Revenue": "$46K",
    "Orders": "40",
    "AOV": "$115",
    "RevChgPct": "+37%",
    "OrdChgPct": "+23%",
    "MetaSummary": "Meta ads generated revenue of $25K with ROAS of 2.2.",
    "MetaCAC": "Customer Acquisition Cost on Meta increased to $3.2.",
    "GoogleSummary": "Google ads generated $18K with ROAS of 1.5.",
    "GoogleCAC": "Customer Acquisition Cost on Google ads increased to $5.7.",
    "day": "1 day",
    "PositiveChanges": "Revenue grew strongly by 31.6% vs previous day.",
    "RequiresReviews": "Meta CAC increased by 37.7%."
  }
}
```

- **Response:** `{ ok: true, meta: { dryRun: true, templateName, subject, html, text, parameters } }` — email NOT sent via Mailjet.
- **Note:** Use `parameters` or `templateVariables` — both work. Same templates as `send-dynamic` / `send-template`.

**Postman: send-dynamic (business_performance_summary)**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/email/send-dynamic`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "to": "surendras@nethority.com",
  "templateName": "business_performance_summary",
  "parameters": {
    "StoreName": "My Store",
    "PrevDate": "21st Dec 2024",
    "Revenue": "$46K",
    "Orders": "40",
    "AOV": "$115",
    "RevChgPct": "increased by 37%",
    "OrdChgPct": "increased by 23%",
    "MetaSummary": "Meta ads generated revenue of $25K with ROAS of 2.2. Revenue increased by 18% and ROAS increased by 12%.",
    "MetaCAC": "Customer Acquisition Cost on Meta increased to $3.2.",
    "GoogleSummary": "Google ads generated $18K with ROAS of 1.5. Revenue increased by 12% and ROAS increased by 9%.",
    "GoogleCAC": "Customer Acquisition Cost on Google ads increased to $5.7.",
    "day": "1 day",
    "PositiveChanges": "• Revenue grew strongly by 31.6% vs previous day\n• Order volume increased by 27.3% vs previous day",
    "RequiresReviews": "• Meta CAC increased by 37.7%\n• Traffic declined by 9%"
  },
  "subject": "Daily business performance summary – 21st Dec 2024"
}
```

- **Optional:** Add `"subject": "Daily business performance summary – 21st Dec 2024"` at the same level as `"parameters"` to override the subject. If omitted, subject is built from the template using `PrevDate`.
- **Optional:** `"cc"`: `["email@example.com"]`, `"bcc"`: `["email@example.com"]` (arrays of strings).
- **Note:** Parameter keys are case-sensitive (e.g. `StoreName`, `PrevDate`, not `storeName`).

whastapp
https://api.netsights.ai/api/debug/whatsapp-payload?shop=celebrity-drapes.myshopify.com

https://api.netsights.ai/api/debug/whatsapp-payload?shop=celebrity-drapes.myshopify.com&date_from=2026-02-20&date_to=2026-02-20

preview

https://api.netsights.ai/api/notifications/whatsapp-payload?shop=celebrity-drapes.myshopify.com&preview=1

https://api.netsights.ai/api/notifications/whatsapp-payload?shop=celebrity-drapes.myshopify.com&date_from=2026-02-20&date_to=2026-02-20&preview=1

email
https://api.netsights.ai/api/debug/email-payload?shop=celebrity-drapes.myshopify.com

if want to check specific date
https://api.netsights.ai/api/debug/email-payload?shop=celebrity-drapes.myshopify.com&date_from=2026-02-20&date_to=2026-02-20

ngrok if json change hit this cmd
// copy src\data\qa_data.json dist\data\qa_data.json 