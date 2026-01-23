export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

const templates: Record<string, EmailTemplate> = {
  // Simple text message template
  //api/email/send-template
  simple_message: {
    subject: 'Message from {{senderName || "Netsight"}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{subject || "Message from Netsight"}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2c3e50; margin-top: 0;">{{subject || "Message from Netsight"}}</h2>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <p>{{message}}</p>
          </div>
        </div>
        <div style="margin-top: 20px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>This email was sent from Netsight</p>
        </div>
      </body>
      </html>
    `,
    text: '{{message}}'
  },

  // Daily KPI Snapshot template
  //api/email/send-daily-kpi-snapshot
  daily_kpi_snapshot: {
    subject: 'Daily KPI Snapshot - {{storeName || "My Store"}} - {{date || "2024-01-15"}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily KPI Snapshot - {{storeName || "My Store"}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Daily KPI Snapshot</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{storeName || "My Store"}} - {{date || "2024-01-15"}}</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <!-- IF:businessOverview -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Business Overview</h2>
            <div style="color: #555; white-space: pre-wrap;">{{businessOverview}}</div>
          </div>
          <!-- ENDIF:businessOverview -->

          <!-- IF:marketingProfitability -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Marketing Profitability</h2>
            <div style="color: #555; white-space: pre-wrap;">{{marketingProfitability}}</div>
          </div>
          <!-- ENDIF:marketingProfitability -->

          <!-- IF:operationsCash -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Operations & Cash</h2>
            <div style="color: #555; white-space: pre-wrap;">{{operationsCash}}</div>
          </div>
          <!-- ENDIF:operationsCash -->

          <!-- IF:keySignals -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Key Signals</h2>
            <div style="color: #555; white-space: pre-wrap;">{{keySignals}}</div>
          </div>
          <!-- ENDIF:keySignals -->

          <!-- IF:revenue -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Revenue</h2>
            <div style="color: #555; white-space: pre-wrap;">{{revenue}}</div>
          </div>
          <!-- ENDIF:revenue -->

          <!-- IF:expenses -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Expenses</h2>
            <div style="color: #555; white-space: pre-wrap;">{{expenses}}</div>
          </div>
          <!-- ENDIF:expenses -->

          <!-- IF:profit -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Profit</h2>
            <div style="color: #555; white-space: pre-wrap;">{{profit}}</div>
          </div>
          <!-- ENDIF:profit -->
      
          <!-- IF:newCustomers -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">New Customers</h2>
            <div style="color: #555; white-space: pre-wrap;">{{newCustomers}}</div>
          </div>
          <!-- ENDIF:newCustomers -->
          
          <!-- IF:returns -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Returns</h2>
            <div style="color: #555; white-space: pre-wrap;">{{returns}}</div>
          </div>
          <!-- ENDIF:returns -->

          <!-- IF:loyaltyPoints -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Loyalty Points</h2>
            <div style="color: #555; white-space: pre-wrap;">{{loyaltyPoints}}</div>
          </div>
          <!-- ENDIF:loyaltyPoints -->
        </div>

        <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px; padding: 20px;">
          <p>This automated report was generated by Netsight</p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} Netsight. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Daily KPI Snapshot - {{storeName || "My Store"}} - {{date || "2024-01-15"}}
{{#if businessOverview}}
Business Overview:
{{businessOverview}}
{{/if}}
{{#if marketingProfitability}}
Marketing Profitability:
{{marketingProfitability}}
{{/if}}
{{#if operationsCash}}
Operations & Cash:
{{operationsCash}}
{{/if}}
{{#if keySignals}}
Key Signals:
{{keySignals}}
{{/if}}
{{#if revenue}}
Revenue:
{{revenue}}
{{/if}}
{{#if expenses}}
Expenses:
{{expenses}}
{{/if}}
{{#if profit}}
Profit:
{{profit}}
{{/if}}
{{#if newCustomers}}
New Customers:
{{newCustomers}}
{{/if}}
{{#if returns}}
Returns:
{{returns}}
{{/if}}
{{#if loyaltyPoints}}
Loyalty Points:
{{loyaltyPoints}}
{{/if}}
    `
  },

  // Custom template template 
  //api/email/send-template
  custom: {
    subject: '{{subject || "Custom Email Subject"}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{subject || "Custom Email Subject"}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2c3e50; margin-top: 0;">{{subject || "Custom Email Subject"}}</h2>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
            {{content}}
          </div>
        </div>
        <div style="margin-top: 20px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>This email was sent from Netsight</p>
        </div>
      </body>
      </html>
    `,
    text: '{{content}}'
  }
};

export function getEmailTemplate(templateName: string): EmailTemplate | null {
  return templates[templateName] || null;
}

export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}

export function registerTemplate(name: string, template: EmailTemplate): void {
  templates[name] = template;
}

export default {
  getEmailTemplate,
  getAvailableTemplates,
  registerTemplate
};
