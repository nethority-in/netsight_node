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
curl -X POST http://bridge.netsights.ai/api/whatsapp/send-text \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210", "text": "Test message"}'

# Send WhatsApp template
curl -X POST http://bridge.netsights.ai/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210", "templateName": "hello_world", "languageCode": "en_US"}'
```

### Using Postman:

1. **Base URL**: `http://bridge.netsights.ai`
2. **Health Check**: `GET http://bridge.netsights.ai/health`
3. **Notification Logs**: `GET http://bridge.netsights.ai/api/notification-logs`
4. **Notification Settings**: `GET http://bridge.netsights.ai/api/notification-settings`
5. **Widgets**: `GET http://bridge.netsights.ai/api/widgets`
6. **WhatsApp Text**: `POST http://bridge.netsights.ai/api/whatsapp/send-text`
7. **WhatsApp Template**: `POST http://bridge.netsights.ai/api/whatsapp/send-template`

