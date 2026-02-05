# WhatsApp API Endpoints Documentation

## Base URL
- **Local**: `http://localhost:3002/api/whatsapp`
- **Production**: `https://bridge.netsights.ai/api/whatsapp`

---

## Twilio Webhook (Incoming WhatsApp Messages)

जेव्हा कोणी तुमच्या Twilio WhatsApp number वर message पाठवतो, तेव्हा Twilio हा URL call करतो. हा endpoint सेट करण्यासाठी Twilio Console मध्ये "When a message comes in" webhook URL द्या.

**Webhook URL (सेट करायचे)**:
- **Local**: `http://localhost:3002/webhook/twilio/whatsapp` (ngrok सारखा public URL वापरा)
- **Production**: `https://bridge.netsights.ai/webhook/twilio/whatsapp`

**Twilio Console मध्ये कसे सेट करावे**:
1. [Twilio Console](https://console.twilio.com) → Messaging → Try it out → Send a WhatsApp message (किंवा WhatsApp Sender settings).
2. तुमच्या WhatsApp-enabled number वर click करा → "Configure" / "Webhook".
3. **"A MESSAGE COMES IN"** → Webhook URL: `https://bridge.netsights.ai/webhook/twilio/whatsapp`, HTTP: **POST**.
4. Save.

**याचा उपयोग**:
- Incoming messages log होतात (server console मध्ये).
- तुम्ही या controller मध्ये logic जोडू शकता: auto-reply, CRM sync, bot, ticket creation इ.

**Request (Twilio → तुमचा server)**:  
Twilio POST करतो `application/x-www-form-urlencoded` with `MessageSid`, `From`, `To`, `Body`, `ProfileName`, `NumMedia` इ.

**Response**: Server TwiML (XML) return करतो. सध्या empty `<Response></Response>` (कोणतीही auto-reply नाही).

---

## 1. Send Text Message

Send a plain text WhatsApp message.

**Endpoint**: `POST /send-text`

**Request Body**:
```json
{
  "to": "+919876543210",
  "text": "Hello! This is a test message from NetSight."
}
```

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/send-text
Content-Type: application/json

{
  "to": "+919876543210",
  "text": "Hello! This is a test message from NetSight."
}
```

**Response**:
```json
{
  "ok": true,
  "meta": {
    "sid": "SM1234567890abcdef",
    "status": "queued",
    "to": "whatsapp:+919876543210",
    "from": "whatsapp:+19785889593",
    "body": "Hello! This is a test message from NetSight.",
    "dateCreated": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2. Send Template Message

Send a WhatsApp message using a pre-approved template.

**Endpoint**: `POST /send-template`

**Request Body**:
```json
{
  "to": "+919876543210",
  "templateName": "netsightsdailyreports1",
  "languageCode": "en",
  "parameters": [
    "John Doe",
    "NetSight Store",
    "15 Jan 2024",
    "₹12.4Cr",
    "6,420",
    "₹1,930",
    "+5%",
    "+7%",
    "1.8",
    "₹640",
    "+5%",
    "-3%",
    "34%",
    "+2%",
    "8%",
    "-1%",
    "6%",
    "-2%",
    "96%",
    "+1%",
    "ROAS",
    "5%",
    "AOV",
    "7%",
    "Orders",
    "3%",
    "Returns",
    "2%"
  ]
}
```

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/send-template
Content-Type: application/json

{
  "to": "+919876543210",
  "templateName": "netsightsdailyreports1",
  "languageCode": "en",
  "parameters": [
    "John Doe",
    "NetSight Store",
    "15 Jan 2024",
    "₹12.4Cr",
    "6,420",
    "₹1,930",
    "+5%",
    "+7%",
    "1.8",
    "₹640",
    "+5%",
    "-3%",
    "34%",
    "+2%",
    "8%",
    "-1%",
    "6%",
    "-2%",
    "96%",
    "+1%",
    "ROAS",
    "5%",
    "AOV",
    "7%",
    "Orders",
    "3%",
    "Returns",
    "2%"
  ]
}
```

**Response**:
```json
{
  "ok": true,
  "meta": {
    "sid": "SM1234567890abcdef",
    "status": "queued",
    "to": "whatsapp:+919876543210",
    "from": "whatsapp:+19785889593"
  }
}
```

---

## 3. Send New Order Template

**Endpoint**: `POST /send-template`

**Request Body**:
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

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/send-template
Content-Type: application/json

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

---

## 4. Send Fulfilled Order Template

**Endpoint**: `POST /send-template`

**Request Body**:
```json
{
  "to": "+919876543210",
  "templateName": "fulfilled_order",
  "languageCode": "en",
  "parameters": [
    "John Doe",
    "ORD-12345",
    "NetSight Store",
    "16 Jan 2024",
    "3",
    "5",
    "BlueDart",
    "Warehouse A",
    "2:00 PM",
    "Ready for Dispatch"
  ]
}
```

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/send-template
Content-Type: application/json

{
  "to": "+919876543210",
  "templateName": "fulfilled_order",
  "languageCode": "en",
  "parameters": [
    "John Doe",
    "ORD-12345",
    "NetSight Store",
    "16 Jan 2024",
    "3",
    "5",
    "BlueDart",
    "Warehouse A",
    "2:00 PM",
    "Ready for Dispatch"
  ]
}
```

---

## 5. Send Delivered Order Template

**Endpoint**: `POST /send-template`

**Request Body**:
```json
{
  "to": "+919876543210",
  "templateName": "delivered_order",
  "languageCode": "en",
  "parameters": [
    "John Doe",
    "ORD-12345",
    "NetSight Store",
    "17 Jan 2024",
    "John Doe",
    "3",
    "5",
    "Credit Card",
    "Mumbai",
    "3:30 PM"
  ]
}
```

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/send-template
Content-Type: application/json

{
  "to": "+919876543210",
  "templateName": "delivered_order",
  "languageCode": "en",
  "parameters": [
    "John Doe",
    "ORD-12345",
    "NetSight Store",
    "17 Jan 2024",
    "John Doe",
    "3",
    "5",
    "Credit Card",
    "Mumbai",
    "3:30 PM"
  ]
}
```

---

## 6. Send Dynamic Template (Advanced)

Send a template with dynamic components (header, body, buttons).

**Endpoint**: `POST /send-dynamic`

**Request Body**:
```json
{
  "to": "+919876543210",
  "templateName": "netsightsdailyreports1",
  "languageCode": "en",
  "components": {
    "body": [
      "John Doe",
      "NetSight Store",
      "15 Jan 2024",
      "₹12.4Cr",
      "6,420",
      "₹1,930"
    ]
  }
}
```

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/send-dynamic
Content-Type: application/json

{
  "to": "+919876543210",
  "templateName": "netsightsdailyreports1",
  "languageCode": "en",
  "components": {
    "body": [
      "John Doe",
      "NetSight Store",
      "15 Jan 2024",
      "₹12.4Cr",
      "6,420",
      "₹1,930",
      "+5%",
      "+7%",
      "1.8",
      "₹640",
      "+5%",
      "-3%",
      "34%",
      "+2%",
      "8%",
      "-1%",
      "6%",
      "-2%",
      "96%",
      "+1%",
      "ROAS",
      "5%",
      "AOV",
      "7%",
      "Orders",
      "3%",
      "Returns",
      "2%"
    ]
  }
}
```

---

## 7. Send Daily KPI Snapshot

Send a daily KPI snapshot report.

**Endpoint**: `POST /send-daily-kpi-snapshot`

**Request Body**:
```json
{
  "to": "+919876543210",
  "storeName": "NetSight Store",
  "date": "15 Jan 2024",
  "businessOverview": "Revenue: ₹12.4Cr | Orders: 6,420 | AOV: ₹1,930 | CR: 2.9% | RPV: ₹56",
  "marketingProfitability": "ROAS (1D): 1.8 | CAC: ₹640 | CM%: 34%",
  "operationsCash": "Returns: 8% | RTO: 6% | SLA: 96% | Net Cash: ₹9.1Cr",
  "keySignals": "ROAS ↑5% | AOV ↑7% | Orders ↓3%"
}
```

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/send-daily-kpi-snapshot
Content-Type: application/json

{
  "to": "+919876543210",
  "storeName": "NetSight Store",
  "date": "15 Jan 2024",
  "businessOverview": "Revenue: ₹12.4Cr | Orders: 6,420 | AOV: ₹1,930 | CR: 2.9% | RPV: ₹56",
  "marketingProfitability": "ROAS (1D): 1.8 | CAC: ₹640 | CM%: 34%",
  "operationsCash": "Returns: 8% | RTO: 6% | SLA: 96% | Net Cash: ₹9.1Cr",
  "keySignals": "ROAS ↑5% | AOV ↑7% | Orders ↓3%"
}
```

---

## 8. Get All Templates from Twilio

Get all WhatsApp Content Templates from your Twilio account.

**Endpoint**: `GET /templates/meta`

**Example (Postman)**:
```
GET http://localhost:3002/api/whatsapp/templates/twillio
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "templates": [
      {
        "sid": "HX76ba66f51b489342b00955c8da29806b",
        "friendlyName": "netsightsdailyreports1",
        "language": "en",
        "types": {
          "twilio/text": {
            "body": "Hello {{1}}, ..."
          }
        },
        "dateCreated": "2024-01-15T10:00:00.000Z",
        "dateUpdated": "2024-01-15T10:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

## 9. Create Template in Twilio

Create a new WhatsApp Content Template in Twilio.

**Endpoint**: `POST /templates/create-custom`

**Request Body** (Direct Twilio Format):
```json
{
  "friendlyName": "my_custom_template",
  "body": "Hello {{1}}, Your order {{2}} has been confirmed!",
  "language": "en"
}
```

**Example (Postman)**:
```json
POST http://localhost:3002/api/whatsapp/templates/create-custom
Content-Type: application/json

{
  "friendlyName": "my_custom_template",
  "body": "Hello {{1}}, Your order {{2}} has been confirmed!",
  "language": "en"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "sid": "HX1234567890abcdef",
    "friendlyName": "my_custom_template",
    "language": "en",
    "types": {
      "twilio/text": {
        "body": "Hello {{1}}, Your order {{2}} has been confirmed!"
      }
    },
    "dateCreated": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 10. Update Template in Twilio

Update an existing WhatsApp Content Template.

**Endpoint**: `PUT /templates/create-custom-edit`

**Request Body**:
```json
{
  "contentSid": "HX1234567890abcdef",
  "friendlyName": "updated_template_name",
  "body": "Hello {{1}}, Your updated order {{2}} has been confirmed!"
}
```

**Example (Postman)**:
```json
PUT http://localhost:3002/api/whatsapp/templates/create-custom-edit
Content-Type: application/json

{
  "contentSid": "HX1234567890abcdef",
  "friendlyName": "updated_template_name",
  "body": "Hello {{1}}, Your updated order {{2}} has been confirmed!"
}
```

---

## 11. Delete Template from Twilio

Delete a WhatsApp Content Template.

**Endpoint**: `DELETE /templates/create-custom-delete`

**Request Body**:
```json
{
  "contentSid": "HX1234567890abcdef"
}
```

**Example (Postman)**:
```json
DELETE http://localhost:3002/api/whatsapp/templates/create-custom-delete
Content-Type: application/json

{
  "contentSid": "HX1234567890abcdef"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "message": "Template HX1234567890abcdef deleted successfully"
  }
}
```

---

## 12. Get All Templates (from Code)

Get all templates registered in the codebase.

**Endpoint**: `GET /templates`

**Example (Postman)**:
```
GET http://localhost:3002/api/whatsapp/templates
```

---

## 13. Get Specific Template (from Code)

Get a specific template definition from the codebase.

**Endpoint**: `GET /templates/:templateName`

**Example (Postman)**:
```
GET http://localhost:3002/api/whatsapp/templates/netsightsdailyreports1
```

---

## 14. Register Template (in Code)

Register a new template in the codebase (does not create in Twilio).

**Endpoint**: `POST /templates/register`

**Request Body**:
```json
{
  "name": "my_template",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hello {{1}}, Your order {{2}} has been confirmed!"
    }
  ]
}
```

---

## 15. List From Numbers

Get all WhatsApp-enabled phone numbers from Twilio.

**Endpoint**: `GET /from-numbers`

**Example (Postman)**:
```
GET http://localhost:3002/api/whatsapp/from-numbers
```

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": "+19785889593",
      "display_phone_number": "+19785889593",
      "verified_name": "Default WhatsApp Number"
    }
  ]
}
```

---

## Template Parameter Mapping

### netsightsdailyreports1 (28 parameters)
1. Customer Name
2. Store Name
3. Report Date
4. Total Revenue
5. Total Orders
6. Average Order Value
7. Revenue Change vs Previous Day
8. Orders Change vs Previous Day
9. ROAS (1 Day)
10. Customer Acquisition Cost
11. ROAS Change
12. CAC Change
13. Contribution Margin
14. Contribution Margin Change
15. Returns Count
16. Returns Change
17. RTO Percentage
18. RTO Change
19. SLA Adherence
20. SLA Change
21. Key Improvement Metric 1
22. Key Improvement Change 1
23. Key Improvement Metric 2
24. Key Improvement Change 2
25. Monitor Metric 1
26. Monitor Change 1
27. Monitor Metric 2
28. Monitor Change 2

### new_order (10 parameters)
1. Customer Name
2. Order ID
3. Store Name
4. Order Date
5. Customer Name (duplicate)
6. Order Value
7. Payment Method
8. Delivery City
9. Received City
10. Expected Dispatch Date

### fulfilled_order (10 parameters)
1. Customer Name
2. Order ID
3. Store Name
4. Fulfillment Date
5. Items Packed
6. Total Quantity
7. Courier Partner
8. Pickup Location
9. Estimated Dispatch Time
10. Current Status

### delivered_order (10 parameters)
1. Customer Name
2. Order ID
3. Store Name
4. Delivery Date
5. Customer Name (duplicate)
6. Items Delivered
7. Total Quantity
8. Payment Method
9. Delivery City
10. Delivery Time

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "ok": false,
  "error": {
    "message": "Error description",
    "status": 400,
    "code": 400
  }
}
```

**Common Error Codes**:
- `400`: Bad Request (missing or invalid parameters)
- `404`: Not Found (template not found)
- `500`: Internal Server Error
- `503`: Service Unavailable (network/timeout errors)

---

## WhatsApp delivery: Error 63049 (Meta did not deliver)

If Twilio shows **status "Undelivered"** and **Warning 63049: "Meta chose not to deliver this WhatsApp marketing message"**:

- **Cause**: WhatsApp (Meta) treats the template as **marketing** and is blocking delivery (per-user limits or policy).
- **Fix (Twilio/Meta side)**:
  1. In **Meta Business Manager** (or Twilio Content Template), ensure order templates (`new_order`, `fulfilled_order`, `delivered_order`) are submitted and approved as **UTILITY** (transactional), not **MARKETING**.
  2. Template wording should be clearly transactional (e.g. "Your order has been fulfilled") rather than promotional.
  3. For international numbers: avoid sending the same marketing template repeatedly; Meta may temporarily block delivery. Retry after some time.
- **Reference**: [Twilio Error 63049](https://www.twilio.com/docs/api/errors/63049)

---

## Notes

1. **Phone Number Format**: Always use E.164 format with country code (e.g., `+919876543210` for India, `+19785889593` for US).

2. **Template Names**: Use the exact template names as defined in `twilioTemplateConfig.ts`:
   - `netsightsdailyreports1` or `daily_kpi_snapshot`
   - `new_order`
   - `fulfilled_order`
   - `delivered_order`

3. **Template Parameters**: Parameters are positional and must match the template structure. Use `{{1}}`, `{{2}}`, etc. in templates.

4. **Rate Limiting**: All send endpoints have rate limiting and duplicate message protection enabled.

5. **Environment Variables**: Ensure these are set in your `.env` file:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`
