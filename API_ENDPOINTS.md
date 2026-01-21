# API Endpoints Reference

## Base URLs

- **Local**: `http://localhost:3002`
- **Server**: `http://bridge.netsights.ai` or `http://139.59.95.78:3002`

### Using cURL:

```bash
# Health check
curl http://bridge.netsights.ai/health

# Notification logs
curl http://bridge.netsights.ai/api/notification-logs

# Notification settings
curl http://bridge.netsights.ai/api/notification-settings

# Widgets
curl http://bridge.netsights.ai/api/widgets

# Send WhatsApp text
curl -X POST https://bridge.netsights.ai/api/whatsapp/send-text \
  -H "Content-Type: application/json" \
  -d '{"to": "918605749752", "text": "Test message"}'

# Send WhatsApp template
curl -X POST https://bridge.netsights.ai/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{"to": "918605749752", "templateName": "hello_world", "languageCode": "en_US"}'

# Send WhatsApp template with parameters
curl -X POST https://bridge.netsights.ai/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{"to": "918605749752", "templateName": "hello_world", "languageCode": "en_US", "parameters": ["param1", "param2"]}'

# Send Daily KPI Snapshot template
curl -X POST https://bridge.netsights.ai/api/whatsapp/send-daily-kpi-snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "to": "918605749752",
    "storeName": "Netsight Store",
    "date": "15 Jan 2026",
    "businessOverview": "Revenue: ₹12.4Cr | Orders: 6,420 | AOV: ₹1,930 | CR: 2.9% | RPV: ₹56",
    "marketingProfitability": "ROAS (1D): 1.8 | CAC: ₹640 | CM%: 34%",
    "operationsCash": "Returns: 8% | RTO: 6% | SLA: 96% | Net Cash: ₹9.1Cr",
    "keySignals": "ROAS ↑5% | AOV ↑7% | Orders ↓3%"
  }'
```

### Using Postman:

1. **Base URL**: `https://bridge.netsights.ai`
2. **Health Check**: `GET https://bridge.netsights.ai/health`
3. **Notification Logs**: `GET https://bridge.netsights.ai/api/notification-logs`
4. **Notification Settings**: `GET https://bridge.netsights.ai/api/notification-settings`
5. **Widgets**: `GET https://bridge.netsights.ai/api/widgets`
6. **WhatsApp Text**: `POST https://bridge.netsights.ai/api/whatsapp/send-text`
7. **WhatsApp Template**: `POST https://bridge.netsights.ai/api/whatsapp/send-template`
8. **WhatsApp Daily KPI Snapshot**: `POST https://bridge.netsights.ai/api/whatsapp/send-daily-kpi-snapshot`

### for local

http://localhost:3002/api/whatsapp/send-daily-kpi-snapshot

{
  "to": "918605749752",
  "storeName": "Netsight Store",
  "date": "15 Jan 2026",
  "businessOverview": "Revenue: ₹12.4Cr | Orders: 6,420 | AOV: ₹1,930 | CR: 2.9% | RPV: ₹56",
  "marketingProfitability": "ROAS (1D): 1.8 | CAC: ₹640 | CM%: 34%",
  "operationsCash": "Returns: 8% | RTO: 6% | SLA: 96% | Net Cash: ₹9.1Cr",
  "keySignals": "ROAS ↑5% | AOV ↑7% | Orders ↓3%"
}

POST http://localhost:3002/api/whatsapp/send-template

{
  "to": "918605749752",
  "templateName": "daily_kpi_snapshot",
  "languageCode": "en",
  "parameters": [
    "Netsight Store",
    "15 Jan 2026",
    "Revenue: ₹12.4Cr | Orders: 6,420 | AOV: ₹1,930 | CR: 2.9% | RPV: ₹56",
    "ROAS (1D): 1.8 | CAC: ₹640 | CM%: 34%",
    "Returns: 8% | RTO: 6% | SLA: 96% | Net Cash: ₹9.1Cr",
    "ROAS ↑5% | AOV ↑7% | Orders ↓3%"
  ]
}

# Basic request
curl "http://localhost:3002/api/kpi/total-sales?shop=celebrity-drapes.myshopify.com"
https://bridge.netsights.ai/api/kpi/total-sales?shop=celebrity-drapes.myshopify.com

 http://localhost:3002/api/kpi/total-orders?shop=celebrity-drapes.myshopify.com&date_from=2026-01-01&date_to=2026-01-15

 http://localhost:3002/api/kpi/net-sales?shop=celebrity-drapes.myshopify.com&date_from=2026-01-01&date_to=2026-01-15

# With date range
curl "http://localhost:3002/api/kpi/total-sales?shop=celebrity-drapes.myshopify.com&date_from=2026-01-01&date_to=2026-01-15"
https://bridge.netsights.ai/api/kpi/total-sales?shop=celebrity-drapes.myshopify.com&date_from=2026-01-01&date_to=2026-01-15
