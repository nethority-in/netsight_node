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
    `
  },

  // Daily Store Performance Summary 
  // POST /api/email/send-dynamic with templateName
  daily_store_performance_summary: {
    subject: '📊 Daily Performance Update – {{storeName || "Store"}} – {{date || ""}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Performance Update – {{storeName || "Store"}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 28px; border-radius: 10px 10px 0 0; color: white;">
          <h1 style="margin: 0; font-size: 24px;">📊 Daily Performance Summary</h1>
          <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.95;">{{storeName || "Store"}} · {{date || ""}}</p>
        </div>
        <div style="background-color: #f8fafc; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 20px 0; color: #475569;">Good day {{recipientName}},</p>
          <p style="margin: 0 0 24px 0; color: #475569;">This is an automated performance update for <strong>{{storeName}}</strong> for <strong>{{date}}</strong>.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <h2 style="color: #0f766e; margin: 0 0 12px 0; font-size: 16px;">💼 Overall Business Performance</h2>
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding:4px 0; color:#64748b;">Revenue:</td><td style="padding:4px 0; font-weight:600;">{{revenue}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Orders:</td><td style="padding:4px 0;">{{orders}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Average Order Value:</td><td style="padding:4px 0;">{{avgOrderValue}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Revenue Change vs Prior Day:</td><td style="padding:4px 0; color:#059669;">{{revenueChange}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Orders Change vs Prior Day:</td><td style="padding:4px 0; color:#059669;">{{ordersChange}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Conversion Rate:</td><td style="padding:4px 0;">{{conversionRate}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Revenue per Visitor:</td><td style="padding:4px 0;">{{revenuePerVisitor}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">CR Change:</td><td style="padding:4px 0;">{{crChange}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">RPV Change:</td><td style="padding:4px 0;">{{rpvChange}}</td></tr>
            </table>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <h2 style="color: #0f766e; margin: 0 0 12px 0; font-size: 16px;">📈 Marketing Performance Summary</h2>
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding:4px 0; color:#64748b;">ROAS (1-day):</td><td style="padding:4px 0;">{{roas}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Customer Acquisition Cost:</td><td style="padding:4px 0;">{{cac}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">ROAS Change:</td><td style="padding:4px 0;">{{roasChange}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">CAC Change:</td><td style="padding:4px 0;">{{cacChange}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Contribution Margin:</td><td style="padding:4px 0;">{{contributionMargin}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Contribution Margin Change:</td><td style="padding:4px 0;">{{contributionMarginChange}}</td></tr>
            </table>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <h2 style="color: #0f766e; margin: 0 0 12px 0; font-size: 16px;">✅ Operations & Fulfilment Health</h2>
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding:4px 0; color:#64748b;">Returns:</td><td style="padding:4px 0;">{{returns}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">RTO:</td><td style="padding:4px 0;">{{rto}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">Returns Change:</td><td style="padding:4px 0;">{{returnsChange}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">RTO Change:</td><td style="padding:4px 0;">{{rtoChange}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">SLA Adherence:</td><td style="padding:4px 0;">{{slaAdherence}}</td></tr>
              <tr><td style="padding:4px 0; color:#64748b;">SLA Change:</td><td style="padding:4px 0;">{{slaChange}}</td></tr>
            </table>
          </div>

          <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h2 style="color: #047857; margin: 0 0 8px 0; font-size: 15px;">📈 Key Positive Movements</h2>
            <ul style="margin: 0; padding-left: 20px; color: #065f46;">
              <li><strong>{{positiveMetric1}}</strong> improved by {{positiveChange1}}</li>
              <li><strong>{{positiveMetric2}}</strong> improved by {{positiveChange2}}</li>
            </ul>
          </div>

          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #ef4444;">
            <h2 style="color: #b91c1c; margin: 0 0 8px 0; font-size: 15px;">📉 Metrics to Monitor</h2>
            <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
              <li><strong>{{monitorMetric1}}</strong> declined by {{monitorChange1}}</li>
              <li><strong>{{monitorMetric2}}</strong> declined by {{monitorChange2}}</li>
            </ul>
          </div>

          <p style="margin: 0; color: #64748b;">Regards,<br><strong>Netsights.ai</strong></p>
        </div>
        <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p>This is an automated performance report from Netsights.ai</p>
        </div>
      </body>
      </html>
    `
  },

  // Business Performance Summary – daily store report (image-style design)
  // POST /api/email/send-dynamic with templateName: 'business_performance_summary'
  business_performance_summary: {
    subject: 'Daily business performance summary – {{reportDate}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business performance summary – {{reportDate}}</title>
      </head>
      <body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #000; background-color: #e8e8e8;">
        <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 28px 32px; color: #000;">
            <p style="margin: 0 0 16px 0;">Good day,</p>
            <p style="margin: 0 0 24px 0;">Please find below a summary of your store's business performance for <strong>{{reportDate}}</strong>.</p>

            <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Business Overview</h2>
            <p style="margin: 0 0 8px 0;">Total revenue of <strong>{{revenue}}</strong> was generated from <strong>{{orders}}</strong> orders, resulting in an Average Order Value (AOV) of <strong>{{aov}}</strong>.</p>
            <p style="margin: 0 0 24px 0;">Compared to the previous day, revenue <strong>{{revenueChange}}</strong> and order volume <strong>{{ordersChange}}</strong>.</p>

            <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Marketing and Growth Efficiency</h2>
            <p style="margin: 0 0 8px 0;">Meta ads generated revenue of <strong>{{metaRevenue}}</strong> with ROAS of <strong>{{metaRoas}}</strong>. Revenue <strong>{{metaRevenueChange}}</strong> and ROAS <strong>{{metaRoasChange}}</strong>.</p>
            <p style="margin: 0 0 8px 0;">Customer Acquisition Cost on Meta <strong>{{metaCac}}</strong>.</p>
            <p style="margin: 0 0 8px 0;">Google ads generated <strong>{{googleRevenue}}</strong> with ROAS of <strong>{{googleRoas}}</strong>. Revenue <strong>{{googleRevenueChange}}</strong> and ROAS <strong>{{googleRoasChange}}</strong>.</p>
            <p style="margin: 0 0 24px 0;">Customer Acquisition Cost on Google ads <strong>{{googleCac}}</strong>.</p>

            <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Previous 1 day comparison</h2>
            <p style="margin: 0 0 8px 0;"><strong>Positive Changes</strong></p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px;">
              <li>Revenue grew strongly by <strong>{{positiveChange1}}</strong> vs previous day</li>
              <li>Order volume increased by <strong>{{positiveChange2}}</strong> vs previous day</li>
            </ul>
            <p style="margin: 0 0 8px 0;"><strong>Requires a Review</strong></p>
            <ul style="margin: 0 0 24px 0; padding-left: 20px;">
              <li>Meta CAC <strong>{{reviewChange1}}</strong></li>
              <li>Traffic <strong>{{reviewChange2}}</strong></li>
            </ul>

            <p style="margin: 0 0 20px 0; font-size: 13px; color: #555;">
              <span style="display:inline-block; width:18px; height:18px; line-height:18px; text-align:center; background:#b3e0ff; color:#0066aa; border-radius:50%; font-weight:bold;">i</span>
              This is a system-generated operational update for your account, shared upon request.
            </p>
            <p style="margin: 0;">Regards,</p>
            <p style="margin: 4px 0 0 0;"><strong>Netsights.ai</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Good day,\n\nPlease find below a summary of your store's business performance for {{reportDate}}.\n\nBusiness Overview\nTotal revenue of {{revenue}} was generated from {{orders}} orders, resulting in an Average Order Value (AOV) of {{aov}}. Compared to the previous day, revenue {{revenueChange}} and order volume {{ordersChange}}.\n\nMarketing and Growth Efficiency\nMeta ads: {{metaRevenue}}, ROAS {{metaRoas}}. Revenue {{metaRevenueChange}}, ROAS {{metaRoasChange}}. Meta CAC {{metaCac}}. Google ads: {{googleRevenue}}, ROAS {{googleRoas}}. Revenue {{googleRevenueChange}}, ROAS {{googleRoasChange}}. Google CAC {{googleCac}}.\n\nPrevious 1 day comparison\nPositive Changes: Revenue grew strongly by {{positiveChange1}} vs previous day; Order volume increased by {{positiveChange2}} vs previous day.\nRequires a Review: Meta CAC {{reviewChange1}}; Traffic {{reviewChange2}}.\n\nRegards,\nNetsights.ai`
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
