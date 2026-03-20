# 📡 Twilio + Facebook API Documentation

---

## 🌐 Base URLs

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3002` |
| Server | `https://bridge.netsights.ai` |

---

## 📝 Postman Quick Notes

- JSON body ke liye `Content-Type: application/json` use karein
- Duplicate send protection ke liye optional header: `Duplicate-Message-Key: <any-string>`
- `POST /sandbox-twilio/send-sandbox-message` ke liye auth required:
  - `Authorization: Bearer <JWT>` **ya**
  - `x-api-key: <apiKey>`
  - JWT ke liye: `/auth-twilio/login-twilio`
- `/api/*` (Meta) routes mein `authenticateJWTOrApiSecret` middleware currently commented hai — token optional hai

---

## 🔵 Meta API

### 🔐 Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/auth/register` | `{ "username": "...", "password": "..." }` | JSON |
| `POST` | `/auth/login` | `{ "username": "...", "password": "..." }` | JSON |

---

### 📧 Email (Meta)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/email/send-template` | EmailController sendTemplate payload | JSON |
| `POST` | `/api/email/send` | EmailController sendEmail payload | JSON |
| `POST` | `/api/email/send-daily-kpi-snapshot` | Daily KPI snapshot payload | JSON |
| `POST` | `/api/email/send-dynamic` | Dynamic payload | JSON |
| `GET` | `/api/email/templates` | — | Templates list JSON |

---

### 💬 WhatsApp (Meta)

| Method | Endpoint | Body / Notes | Response |
|--------|----------|--------------|----------|
| `POST` | `/api/whatsapp/send-message` | `{ "to", "templateName", "languageCode"?, "components"?, "fromNumberId"? }` | JSON |
| `POST` | `/api/whatsapp/send-dynamic` | `{ "to", "templateName", "languageCode"?, "parameters"?, "components"?, "fromNumberId"? }` | JSON |
| `GET` | `/api/whatsapp/from-numbers` | — | From-numbers list JSON |
| `POST` | `/api/whatsapp/from-numbers` | `{ "cc", "phone_number", "verified_name"? }` | JSON |
| `POST` | `/api/whatsapp/templates/create` | `{ "templateName": "..." }` | JSON |
| `POST` | `/api/whatsapp/templates/create-custom` | Template definition (name/category/language/components) | JSON |
| `PUT` | `/api/whatsapp/templates/create-custom-edit` | `{ "contentSid", "friendlyName"?, "body"? }` | JSON |
| `DELETE` | `/api/whatsapp/templates/create-custom-delete` | `{ "contentSid": "..." }` | JSON |
| `GET` | `/api/whatsapp/templates` | — | Templates list JSON |
| `GET` | `/api/whatsapp/templates/twillio` | — | Templates list JSON *(backward-compat)* |
| `GET` | `/api/whatsapp/templates/:templateName` | — | `{ templateName, body }` |
| `POST` | `/api/whatsapp/templates/register` | Template definition (name/category/language/components) | JSON |

---

### 🔔 WhatsApp Webhooks (Meta)

> ⚠️ Source: `src/routes/whatsappWebhookRoutes.ts` — currently **not mounted** in `src/index.ts`

| Method | Endpoint | Query / Body | Response |
|--------|----------|--------------|----------|
| `GET` | `/webhook/whatsapp-twilio` | `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge` | `<hub.challenge>` |
| `POST` | `/webhook/whatsapp-twilio` | WhatsApp webhook payload | `200 OK` |
| `GET` | `/webhook/whatsapp` | `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge` | `<hub.challenge>` |
| `POST` | `/webhook/whatsapp` | WhatsApp webhook payload | `200 OK` |

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🟣 Twilio API

### 🔐 Auth

| Method | Endpoint | Body |
|--------|----------|------|
| `POST` | `/auth-twilio/register-twilio` | `{ "username": "...", "password": "..." }` |
| `POST` | `/auth-twilio/login-twilio` | `{ "username": "...", "password": "..." }` |

---

### 📧 Email (Twilio)

> Base: `/api-twilio/email`

| Method | Endpoint | Body / Notes | Response |
|--------|----------|--------------|----------|
| `POST` | `/api-twilio/email/preview/html-twilio` | Query/body: `templateName` + optional `parameters` / `templateVariables` | `text/html` |
| `POST` | `/api-twilio/email/preview-twilio` | `{ "templateName", "parameters"?, "templateVariables"? }` | JSON |
| `POST` | `/api-twilio/email/send-template-twilio` | `{ "to", "templateName", "templateVariables"?, "subject"?, "cc"?, "bcc"?, "attachments"? }` | JSON |
| `POST` | `/api-twilio/email/send-email-twilio` | `{ "to", "subject", "htmlContent", "textContent"?, "cc"?, "bcc"?, "attachments"? }` | JSON |
| `POST` | `/api-twilio/email/send-daily-kpi-snapshot-twilio` | Required: `to`, `storeName`, `date` + Optional: `businessOverview`, `marketingProfitability`, `operationsCash`, `keySignals`, `revenue`, `expenses`, `profit`, `newCustomers`, `returns`, `loyaltyPoints`, `cc?`, `bcc?`, `attachments?` | JSON |
| `POST` | `/api-twilio/email/send-dynamic-twilio` | `{ "to", "templateName", "parameters"?, "subject"?, "cc"?, "bcc"?, "attachments"? }` | JSON |
| `GET` | `/api-twilio/email/templates-twilio` | — | Templates list JSON |

---

### 💬 WhatsApp (Twilio)

> Base: `/api-twilio/whatsapp`

| Method | Endpoint | Body / Notes | Response |
|--------|----------|--------------|----------|
| `POST` | `/api-twilio/whatsapp/send-message-twilio` | `{ "to", "templateName", "languageCode"?, "components"?, "fromNumberId"?, "renderHtml"? }` — also accepts query `renderHtml=1\|true` | JSON *(or `text/html` when htmlPreview is returned)* |
| `POST` | `/api-twilio/whatsapp/send-message-preview-twilio` | Same as `send-message-twilio` | `text/html` |
| `POST` | `/api-twilio/whatsapp/send-dynamic-twilio` | `{ "to", "templateName", "languageCode"?, "components"? \| "parameters"?, "fromNumberId"? }` | JSON |
| `GET` | `/api-twilio/whatsapp/from-numbers-twilio` | — | From-numbers list JSON |
| `POST` | `/api-twilio/whatsapp/from-numbers-twilio` | `{ "cc", "phone_number", "verified_name"? }` | JSON |
| `POST` | `/api-twilio/whatsapp/templates/create-twilio` | `{ "templateName": "..." }` | JSON |
| `POST` | `/api-twilio/whatsapp/templates/create-custom-twilio` | **Body A:** `{ "friendlyName", "body", "language"?, "category"?, "variables"? }` **OR Body B:** `{ "name", "category", "language", "components": [...] }` | JSON |
| `PUT` | `/api-twilio/whatsapp/templates/create-custom-edit-twilio` | `{ "contentSid", "friendlyName"?, "body"? }` | JSON |
| `DELETE` | `/api-twilio/whatsapp/templates/create-custom-delete-twilio` | `{ "contentSid": "..." }` | JSON |
| `GET` | `/api-twilio/whatsapp/templates-twilio` | — | Templates list JSON |
| `GET` | `/api-twilio/whatsapp/templates/twillio` | — | Templates list JSON *(backward-compat)* |
| `GET` | `/api-twilio/whatsapp/templates/:templateName-twilio` | — | `{ templateName, body }` |
| `POST` | `/api-twilio/whatsapp/templates/register-twilio` | `{ "name", "category", "language", "components": [...] }` | JSON |

---

### 🔔 Webhooks (Incoming)

| Method | Endpoint | Content-Type / Body | Response |
|--------|----------|---------------------|----------|
| `POST` | `/webhook/twilio/whatsapp` | `application/x-www-form-urlencoded` — Fields: `MessageSid`, `AccountSid`, `From`, `To`, `Body`, `NumMedia`, `ProfileName`, ... | `text/xml` `<Response></Response>` |
| `GET` | `/webhook/whatsapp-twilio/twilio` | Query: `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge` | `<hub.challenge>` |
| `POST` | `/webhook/whatsapp-twilio/twilio` | Payload handled asynchronously | `200 OK` |

> 📌 Same GET/POST endpoints also mounted at: `/webhook/whatsapp/twilio`

---

### 🧪 Sandbox

> Base: `/sandbox-twilio`

| Method | Endpoint | Auth / Body | Response |
|--------|----------|-------------|----------|
| `GET` | `/sandbox-twilio/config` | — | JSON |
| `POST` | `/sandbox-twilio/send-sandbox-message` | **Auth:** `Authorization: Bearer <JWT>` or `x-api-key: <apiKey>` — **Body:** `{ "to": "whatsapp:+<number>" \| "+<number>", "from"?, "contentSid": "HX...", "contentVariables"? }` | JSON |

---

## 🔶 Facebook API

### 🔗 OAuth Connect / Callback

| Method | Endpoint | Notes | Response |
|--------|----------|-------|----------|
| `GET` | `/api/facebook/connect` | — | `{ "oauth_url": "..." }` |
| `GET` | `/api-twilio/facebook/connect` | Same as `/api/facebook/connect` | `{ "oauth_url": "..." }` |
| `GET` | `/api/facebook/callback?code=...&state=...` | Required query params: `code`, `state` | HTML + `window.opener.postMessage(...)` |

---

### 🔄 Facebook OAuth Flow

```
Step 1 → GET /api/facebook/connect
         → Returns { oauth_url }

Step 2 → Open / redirect user to oauth_url

Step 3 → Facebook redirects to /api/facebook/callback
         with query params: code + state
```

---

*Last updated: refer to source repository for latest changes.*




{
    "ok": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTc3Mzk5NjgyMDQ1N19jd2V4bzRsIiwidXNlcm5hbWUiOiJuZXRAMSIsImlhdCI6MTc3Mzk5NjgyMCwiZXhwIjoxNzc0MDgzMjIwfQ.dlD7MCCrN3ckalJRAp8atrrd9-I-RVetsfGJkNXyOQE",
    "apiKey": "81a5e5af08433d8c9605806481721d7d3cbdfc3fe2f7d5a6828972f68c7c4b21",
    "user": {
        "id": "user_1773996820457_cwexo4l",
        "username": "net@1"
    },
    "storageHint": "Store token in sessionStorage (logout on tab close) or localStorage (persist). Do not store password."
}