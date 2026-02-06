
 **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```
   This generates the Prisma Client based on your schema.

 **Run Database Migrations (Optional)**
   ```bash
   # Push schema to database (for development)
   npm run prisma:push
   
   # Or create a migration (recommended for production)
   npm run prisma:migrate
   ```

5. **Start the Server**
  
   # npm run dev
   # npm start
 

## Project Structure

## Features

- Express.js server
- Prisma ORM with MySQL database connection
- CORS enabled
- Environment variable configuration
- Modular structure for easy expansion

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:push` - Push schema changes to database (development)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
*************************************************************************************************************

## API Reference & Postman

### Live base URL

- **Production:** `https://bridge.netsights.ai`
- **Local:** `http://localhost:3002`

### Authentication (for `/api/*` routes)

सर्व `/api/*` endpoints साठी **Authorization** header लागतो (Facebook callback आणि webhooks सोडून):

- **Header:** `Authorization: Bearer <CUSTOM_TOKEN>`
- **Postman:** Headers मध्ये Key = `Authorization`, Value = `Bearer <your-CUSTOM_TOKEN-from-.env>`

### Available APIs (summary)

| Category        | Method | Endpoint (live) | Use |
|----------------|--------|------------------|-----|
| Health         | GET    | `https://bridge.netsights.ai/health` | Server up आहे का ते check (auth नाही) |
| Notification   | GET    | `https://bridge.netsights.ai/api/notification-logs` | Notification logs |
| Notification   | GET    | `https://bridge.netsights.ai/api/notification-settings` | Notification settings |
| Widgets        | GET    | `https://bridge.netsights.ai/api/widgets` | Widget list |
| WhatsApp       | POST   | `https://bridge.netsights.ai/api/whatsapp/send-text` | Text message पाठवणे |
| WhatsApp       | POST   | `https://bridge.netsights.ai/api/whatsapp/send-template` | Template message |
| WhatsApp       | POST   | `https://bridge.netsights.ai/api/whatsapp/send-daily-kpi-snapshot` | Daily KPI snapshot |
| WhatsApp       | GET    | `https://bridge.netsights.ai/api/whatsapp/from-numbers` | From numbers list |
| WhatsApp       | POST   | `https://bridge.netsights.ai/api/whatsapp/send-dynamic` | Dynamic template message |
| Email          | POST   | `https://bridge.netsights.ai/api/email/send-template` | Email template |
| Email          | POST   | `https://bridge.netsights.ai/api/email/send-daily-kpi-snapshot` | Daily KPI email |
| Email          | GET    | `https://bridge.netsights.ai/api/email/templates` | Email templates list |
| Facebook OAuth | GET    | `https://bridge.netsights.ai/api/facebook/connect` | OAuth start (returns `oauth_url`) |
| Webhook        | GET    | `https://bridge.netsights.ai/webhook/whatsapp?hub.mode=subscribe&...` | WhatsApp verify (auth नाही) |
| Webhook        | POST   | `https://bridge.netsights.ai/webhook/whatsapp` | WhatsApp events (auth नाही) |

### Postman मध्ये कसे check करायचे

1. **Base URL set करा**  
   Postman मध्ये base URL: `https://bridge.netsights.ai` (किंवा local: `http://localhost:3002`).

2. **Auth set करा** (सर्व `/api/*` साठी)  
   - Tab: **Authorization** → Type: **Bearer Token** → Token: `.env` मधील `CUSTOM_TOKEN`  
   किंवा  
   - Tab: **Headers** → Key: `Authorization`, Value: `Bearer <CUSTOM_TOKEN>`

3. **काय check करायचे**  
   - **Status:** `200` (success) किंवा `201` (created).  
   - **Body:** JSON मध्ये `ok: true` किंवा expected data दिसतो का.  
   - Health साठी: `GET https://bridge.netsights.ai/health` → Body मध्ये `"status":"ok"` येईल (auth नाही).

4. **Quick tests**  
   - Health (no auth): `GET https://bridge.netsights.ai/health`  
   - API auth test: `GET https://bridge.netsights.ai/api/widgets` (Bearer token लागेल)  
   - WhatsApp: `POST https://bridge.netsights.ai/api/whatsapp/send-text` with Body (raw, JSON): `{"to":"91XXXXXXXXXX","text":"Test"}`

सर्व endpoints आणि request/response details साठी **API_ENDPOINTS.md** पहा.


**********************************************************************************************************************

## Integration

This Node.js server can work alongside:
- **React Frontend** (in the root directory)
- **Node Backend** (separate node project)
