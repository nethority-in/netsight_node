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
9. **WhatsApp From Numbers**: List (GET) and Add in Meta (POST).

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

POST http://localhost:3002/api/whatsapp/from-numbers
{
  "cc": "91",
  "phone_number": "8698673161",
  "verified_name": "My Business Name"
}

# List all From numbers registered in Meta for your WABA.
GET http://localhost:3002/api/whatsapp/from-numbers

# Send message: use fromNumberId = Meta phone_number_id ("id" from GET /from-numbers), and "to" = recipient number.
POST http://localhost:3002/api/whatsapp/send-dynamic
{
  "to": "918605749752",
  "fromNumberId": "942341315626645",
  "templateName": "daily_business_insights",
  "languageCode": "en",
  "components": { "body": ["Sarang", "ABC Store", "22 Jan 2024", "..."] }
}

# --- POST /api/whatsapp/templates/create-custom (Postman) ---
# Option A: Positional parameters (parameter_format omitted or "positional", body_text)
POST http://localhost:3002/api/whatsapp/templates/create-custom
{
  "name": "daily_store_performance_update_v3",
  "category": "UTILITY",
  "language": "en",
  "description": "Daily operational and performance metrics update for store owners",
  "components": [
    {
      "type": "BODY",
      "text": "👋 Hello {{1}},\n\n📊 Here is your daily performance update for **{{2}}** dated **{{3}}**.\n\n💰 Sales Summary:\n• Total Revenue: {{4}}\n• Total Orders: {{5}}\n• Average Order Value: {{6}}\n• Revenue Change vs Previous Day: {{7}}\n• Orders Change vs Previous Day: {{8}}\n\n📈 Marketing Metrics:\n• ROAS (1 Day): {{9}}\n• Customer Acquisition Cost: {{10}}\n• ROAS Change: {{11}}\n• CAC Change: {{12}}\n• Contribution Margin: {{13}}\n• Contribution Margin Change: {{14}}\n\n🏭 Operations Overview:\n• Returns Count: {{15}}\n• Returns Change: {{16}}\n• RTO Percentage: {{17}}\n• RTO Change: {{18}}\n• SLA Adherence: {{19}}\n• SLA Change: {{20}}\n\n🔝 Key Improvements:\n• {{21}} increased by {{22}}\n• {{23}} increased by {{24}}\n\n⚠️ Areas to Monitor:\n• {{25}} decreased by {{26}}\n• {{27}} decreased by {{28}}\n\nℹ️ This update is shared for informational purposes.\n\nRegards,\n**Netsights.ai** 🚀",
      "example": {
        "body_text": [
          ["Sarang", "ABC Store", "22 Jan 2024", "500000", "320", "1560", "+8%", "+5%", "3.2", "950", "+0.4", "-3%", "28%", "+2%", "12", "-1%", "6%", "-0.5%", "98%", "+1%", "Revenue", "+8%", "ROAS", "+0.4", "Customer Retention", "-5%", "RTO", "-1%"]
        ]
      }
    }
  ]
}

# Option B: Named parameters (parameter_format: "named", body_text_named_params)
POST http://localhost:3002/api/whatsapp/templates/create-custom
{
  "name": "daily_store_performance_update_v3_named",
  "category": "UTILITY",
  "language": "en",
  "description": "Daily performance update with named parameters",
  "parameter_format": "named",
  "components": [
    {
      "type": "BODY",
      "text": "👋 Hello {{recipient_name}},\n\n📊 Here is your daily performance update for **{{store_name}}** dated **{{date}}**.\n\n💰 Sales Summary:\n• Total Revenue: {{total_revenue}}\n• Total Orders: {{total_orders}}\n• Average Order Value: {{avg_order_value}}\n• Revenue Change vs Previous Day: {{revenue_change}}\n• Orders Change vs Previous Day: {{orders_change}}\n\n📈 Marketing Metrics:\n• ROAS (1 Day): {{roas}}\n• Customer Acquisition Cost: {{cac}}\n• ROAS Change: {{roas_change}}\n• CAC Change: {{cac_change}}\n• Contribution Margin: {{contribution_margin}}\n• Contribution Margin Change: {{contribution_margin_change}}\n\n🏭 Operations Overview:\n• Returns Count: {{returns_count}}\n• Returns Change: {{returns_change}}\n• RTO Percentage: {{rto_percentage}}\n• RTO Change: {{rto_change}}\n• SLA Adherence: {{sla_adherence}}\n• SLA Change: {{sla_change}}\n\n🔝 Key Improvements:\n• {{improvement_metric_1}} increased by {{improvement_value_1}}\n• {{improvement_metric_2}} increased by {{improvement_value_2}}\n\n⚠️ Areas to Monitor:\n• {{monitor_metric_1}} decreased by {{monitor_value_1}}\n• {{monitor_metric_2}} decreased by {{monitor_value_2}}\n\nRegards,\n**Netsights.ai** 🚀",
      "example": {
        "body_text_named_params": [
          { "param_name": "recipient_name", "example": "Sarang" },
          { "param_name": "store_name", "example": "ABC Store" },
          { "param_name": "date", "example": "22 Jan 2024" },
          { "param_name": "total_revenue", "example": "500000" },
          { "param_name": "total_orders", "example": "320" },
          { "param_name": "avg_order_value", "example": "1560" },
          { "param_name": "revenue_change", "example": "+8%" },
          { "param_name": "orders_change", "example": "+5%" },
          { "param_name": "roas", "example": "3.2" },
          { "param_name": "cac", "example": "950" },
          { "param_name": "roas_change", "example": "+0.4" },
          { "param_name": "cac_change", "example": "-3%" },
          { "param_name": "contribution_margin", "example": "28%" },
          { "param_name": "contribution_margin_change", "example": "+2%" },
          { "param_name": "returns_count", "example": "12" },
          { "param_name": "returns_change", "example": "-1%" },
          { "param_name": "rto_percentage", "example": "6%" },
          { "param_name": "rto_change", "example": "-0.5%" },
          { "param_name": "sla_adherence", "example": "98%" },
          { "param_name": "sla_change", "example": "+1%" },
          { "param_name": "improvement_metric_1", "example": "Revenue" },
          { "param_name": "improvement_value_1", "example": "+8%" },
          { "param_name": "improvement_metric_2", "example": "ROAS" },
          { "param_name": "improvement_value_2", "example": "+0.4" },
          { "param_name": "monitor_metric_1", "example": "Customer Retention" },
          { "param_name": "monitor_value_1", "example": "-5%" },
          { "param_name": "monitor_metric_2", "example": "RTO" },
          { "param_name": "monitor_value_2", "example": "-1%" }
        ]
      }
    }
  ]
}

# --- POST /api/whatsapp/send-dynamic (Postman) ---
# Option A: Positional parameters (components.body = array of values in order)
POST http://localhost:3002/api/whatsapp/send-dynamic
{
  "to": "918605749752",
  "templateName": "daily_store_performance_update_v3",
  "languageCode": "en",
  "components": {
    "body": ["Sarang", "ABC Store", "22 Jan 2024", "500000", "320", "1560", "+8%", "+5%", "3.2", "950", "+0.4", "-3%", "28%", "+2%", "12", "-1%", "6%", "-0.5%", "98%", "+1%", "Revenue", "+8%", "ROAS", "+0.4", "Customer Retention", "-5%", "RTO", "-1%"]
  }
}

# Option B: Named parameters (components.bodyNamed = object with param names as keys)
POST http://localhost:3002/api/whatsapp/send-dynamic
{
  "to": "918605749752",
  "templateName": "daily_store_performance_update_v3_named",
  "languageCode": "en",
  "components": {
    "bodyNamed": {
      "recipient_name": "Sarang",
      "store_name": "ABC Store",
      "date": "22 Jan 2024",
      "total_revenue": "500000",
      "total_orders": "320",
      "avg_order_value": "1560",
      "revenue_change": "+8%",
      "orders_change": "+5%",
      "roas": "3.2",
      "cac": "950",
      "roas_change": "+0.4",
      "cac_change": "-3%",
      "contribution_margin": "28%",
      "contribution_margin_change": "+2%",
      "returns_count": "12",
      "returns_change": "-1%",
      "rto_percentage": "6%",
      "rto_change": "-0.5%",
      "sla_adherence": "98%",
      "sla_change": "+1%",
      "improvement_metric_1": "Revenue",
      "improvement_value_1": "+8%",
      "improvement_metric_2": "ROAS",
      "improvement_value_2": "+0.4",
      "monitor_metric_1": "Customer Retention",
      "monitor_value_1": "-5%",
      "monitor_metric_2": "RTO",
      "monitor_value_2": "-1%"
    }
  }
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

{
  "name": "daily_store_performance_update_v4",
  "category": "UTILITY",
  "language": "en",
  "description": "Daily operational and performance metrics update for store owners",
  "components": [
    {
      "type": "BODY",
      "text": "👋 Hello {{1}},\n\n📊 Here is your daily performance update for **{{2}}** dated **{{3}}**.\n\n💰 Sales Summary:\n• Total Revenue: {{4}}\n• Total Orders: {{5}}\n• Average Order Value: {{6}}\n• Revenue Change vs Previous Day: {{7}}\n• Orders Change vs Previous Day: {{8}}\n\n📈 Marketing Metrics:\n• ROAS (1 Day): {{9}}\n• Customer Acquisition Cost: {{10}}\n• ROAS Change: {{11}}\n• CAC Change: {{12}}\n• Contribution Margin: {{13}}\n• Contribution Margin Change: {{14}}\n\n🏭 Operations Overview:\n• Returns Count: {{15}}\n• Returns Change: {{16}}\n• RTO Percentage: {{17}}\n• RTO Change: {{18}}\n• SLA Adherence: {{19}}\n• SLA Change: {{20}}\n\n🔝 Key Improvements:\n• {{21}} increased by {{22}}\n• {{23}} increased by {{24}}\n\n⚠️ Areas to Monitor:\n• {{25}} decreased by {{26}}\n• {{27}} decreased by {{28}}\n\nℹ️ This update is shared for informational purposes.\n\nRegards,\n**Netsights.ai** 🚀",
      "example": {
        "body_text": [
          [
            "Sarang",
            "ABC Store",
            "22 Jan 2024",
            "500000",
            "320",
            "1560",
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
        ]
      }
    }
  ]
}
