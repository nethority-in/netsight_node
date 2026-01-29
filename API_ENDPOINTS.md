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

# local request
 http://localhost:3002/api/kpi/total-sales?shop=celebrity-drapes.myshopify.com

 https://bridge.netsights.ai/api/kpi/total-sales?shop=celebrity-drapes.myshopify.com

 http://localhost:3002/api/kpi/total-orders?shop=celebrity-drapes.myshopify.com&date_from=2026-01-01&date_to=2026-01-15

 http://localhost:3002/api/kpi/net-sales?shop=celebrity-drapes.myshopify.com&date_from=2026-01-01&date_to=2026-01-15

 http://localhost:3002/api/kpi/gross-sales?shop=prativacollection.myshopify.com

# server request

# Total Sales
https://bridge.netsights.ai/api/kpi/total-sales?shop=celebrity-drapes.myshopify.com

# Total Orders
https://bridge.netsights.ai/api/kpi/total-orders?shop=celebrity-drapes.myshopify.com

# Net Sales
https://bridge.netsights.ai/api/kpi/net-sales?shop=celebrity-drapes.myshopify.com

# Gross Sales
https://bridge.netsights.ai/api/kpi/gross-sales?shop=celebrity-drapes.myshopify.com


# Mail
POST http://localhost:3002/api/email/send-template
{
  "to": "sarangchaudhari8699@gmail.com",
  "templateName": "simple_message",
  "templateVariables": {
    "subject": "Hello",
    "message": "This is a test message"
  }
}
# cc & bcc
{
  "to": "sarangchaudhari8699@gmail.com",
  "templateName": "simple_message",
  "templateVariables": {
    "subject": "Test Email",
    "message": "This is a test message"
  },
  "cc": ["cc1@example.com", "cc2@example.com"],
  "bcc": ["bcc1@example.com", "bcc2@example.com"]
}

POST http://localhost:3002/api/email/send-daily-kpi-snapshot
{
  "to": "sarangchaudhari8699@gmail.com",
  "storeName": "My Store",
  "date": "2024-01-15",
  "businessOverview": "Sales are up 20%",
  "marketingProfitability": "ROI: 150%",
  "operationsCash": "Cash flow positive",
  "keySignals": "All systems operational"
}
daily-kpi-snapshot same as we writtern in send-template for cc&bcc
{
  "to": "sarangchaudhari8699@gmail.com",
  "storeName": "My Store",
  "date": "2024-01-15",
  "businessOverview": "Sales are up 20%",
  "marketingProfitability": "ROI: 150%",
  "operationsCash": "Cash flow positive",
  "keySignals": "All systems operational",
  "cc": ["manager@example.com"],
  "bcc": ["archive@example.com"]
}

# Send Daily Store Performance Summary via Email (same payload shape as WhatsApp)
POST http://localhost:3002/api/email/send-dynamic
{
  "to": "sarangchaudhari8699@gmail.com",
  "templateName": "daily_store_performance_summary",
  "subject": "Optional custom subject (omit to use template default)",
  "cc": ["manager@example.com"],
  "bcc": ["archive@example.com"],
  "components": {
    "body": [
      "Sarang",
      "ABC Store",
      "22 Jan 2024",
      "₹5,00,000",
      "320",
      "₹1,560",
      "+8%",
      "+5%",
      "2.4%",
      "₹120",
      "+0.2%",
      "+6%",
      "3.2",
      "₹950",
      "+0.4",
      "-3%",
      "28%",
      "+2%",
      "12",
      "6%",
      "-1%",
      "-0.5%",
      "98%",
      "+1%",
      "Revenue",
      "+8%",
      "ROAS",
      "+0.4",
      "CAC",
      "-5%",
      "RTO",
      "-1%"
    ]
  }
}
Add "subject", "cc", "bcc" in this same JSON body when needed. "cc" and "bcc" are arrays of email strings.

http://localhost:3002/api/email/send
{
  "to": "sarangchaudhari8699@gmail.com",
  "subject": "Custom Email Subject",
  "htmlContent": "<h1>Hello</h1><p>This is a custom HTML email.</p>",
  "textContent": "Hello\nThis is a custom text email.",
  "cc": ["cc1@example.com", "cc2@example.com"],
  "bcc": ["bcc@example.com"]
}

#get template 
http://localhost:3002/api/email/templates

# register (only use for save template at code level)
http://localhost:3002/api/whatsapp/templates/register

  # sam code as given in custom template

# create 
http://localhost:3002/api/whatsapp/templates/create
```json
{
  "templateName": "template_name"
}
```

# custom template
http://localhost:3002/api/whatsapp/templates/create-custom
{
  "name": "daily_info_update",
  "category": "UTILITY",
  "language": "en",
  "description": "Daily informational update template for users",
  "components": [
    {
      "type": "BODY",
      "text": "Hello {{1}},\n\nThis is your daily update:\n{{2}}\n\nDate: {{3}}\nReference ID: {{4}}\nStatus: {{5}}\n\nThank you for your attention.",
      "example": {
        "body_text": [
          [
            "Rohit Sharma",
            "Your account balance has been updated",
            "2024-01-22",
            "REF-4587",
            "Completed"
          ]
        ]
      }
    }
  ]
}
# send message 
{
  "to": "918698673161",
  "templateName": "daily_info_update",
  "languageCode": "en",
  "components": {
    "body": [
      "Rohit Sharma",
      "Your account balance has been updated",
      "2024-01-22",
      "REF-4587",
      "Completed"
    ]
  }
}
OR
{
  "to": "918698673161",
  "templateName": "daily_info_update",
  "languageCode": "en",
  "parameters": [
    "Rohit Sharma",
    "Your account balance has been updated",
    "2024-01-22",
    "REF-4587",
    "Completed"
  ]
}

# Check Template Status

http://localhost:3002/api/whatsapp/templates/meta

# Get All Templates from Code

http://localhost:3002/api/whatsapp/templates

# Get Specific Template Details

http://localhost:3002/api/whatsapp/templates/templateName

# Send Message Using Template

http://localhost:3002/api/whatsapp/send-dynamic

{
  "to": "1234567890",
  "templateName": "product_alert",
  "languageCode": "en",
  "parameters": {
    "customerName": "John",
    "productName": "iPhone 15",
    "price": "$999",
    "stock": "In Stock"
  }
}

# Edit the template
http://localhost:3002/api/whatsapp/templates/create-custom-edit

{
  "templateId": "2666208380425785",
  "template": {
    "name": "daily_info",
    "category": "UTILITY",
    "language": "en",
    "description": "Updated daily informational update template",
    "components": [
      {
        "type": "BODY",
        "text": "Hello {{1}},\n\nThis is your updated daily update:\n{{2}}\n\nDate: {{3}}\nReference ID: {{4}}\nStatus: {{5}}\n\nThank you!",
        "example": {
          "body_text": [
            [
              "ruturaj Sharma",
              "Your balance has been updated",
              "2024-01-26",
              "REF-4587",
              "pending"
            ]
          ]
        }
      }
    ]
  }
}

# delete template  just need to add templateId
http://localhost:3002/api/whatsapp/templates/create-custom-delete
{
  "templateId": "1374048857227941"
}

api/whatsapp/send-dynamic
with emoji and professional output for whatsapp
{
  "to": "918605749752",
  "templateName": "daily_business_insights",
  "languageCode": "en",
  "components": {
    "body": [
      "Sarang",          
      "ABC Store",       
      "22 Jan 2024",     
      "5,00,000",        
      "320",             
      "1,560",           
      "+8%",             
      "+5%",             
      "3.2",             
      "950",             
      "+0.4",            
      "-3%",             
      "28%",             
      "+2%",             
      "12",              
      "-1%",             
      "6%",              
      "-0.5%",           
      "98%",             
      "+1%",             
      "Revenue",         
      "+8%",             
      "ROAS",            
      "+0.4",            
      "Customer Retention", 
      "-5%",             
      "RTO",             
      "-1%"              
    ]
  }
}