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
    text: "{{message}}",
  },

  // Daily KPI Snapshot template
  //api/email/send-daily-kpi-snapshot
  daily_kpi_snapshot: {
    subject:
      'Daily KPI Snapshot - {{storeName || "My Store"}} - {{date || "2024-01-15"}}',
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
  },

  // Daily Store Performance Summary
  // POST /api/email/send-dynamic with templateName
  daily_store_performance_summary: {
    subject:
      '📊 Daily Performance Update – {{storeName || "Store"}} – {{date || ""}}',
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
    `,
  },

  // Business Performance Summary – daily store report (image-style design)
  // POST /api/email/send-dynamic with templateName: 'business_performance_summary'
  // Parameters: StoreName, PrevDate, Revenue, Orders, AOV, RevChgPct, OrdChgPct, MetaSummary, MetaCAC, GoogleSummary, GoogleCAC, day, PositiveChanges, RequiresReviews
  business_performance_summary: {
    subject: "Daily business performance summary – {{PrevDate}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business performance summary – {{PrevDate}}</title>
      </head>
      <body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #000; background-color: #e8e8e8;">
        <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 28px 32px; color: #000;">
            <p style="margin: 0 0 16px 0;">Good day,</p>
            <p style="margin: 0 0 24px 0;">This is an automated performance summary for <strong>{{StoreName}}</strong>'s business performance for <strong>{{PrevDate}}</strong>.</p>

            <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Business Overview</h2>
            <p style="margin: 0 0 8px 0;">Total revenue of <strong>{{Revenue}}</strong> was generated from <strong>{{Orders}}</strong> orders, resulting in an Average Order Value (AOV) of <strong>{{AOV}}</strong>.</p>
            <p style="margin: 0 0 24px 0;">Compared to the previous day, revenue <strong>{{RevChgPct}}</strong> and order volume <strong>{{OrdChgPct}}</strong>.</p>

            <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Channel Performance</h2>
            <p style="margin: 0 0 8px 0;">{{MetaSummary}}</p>
            <p style="margin: 0 0 16px 0;">{{MetaCAC}}</p>
            <p style="margin: 0 0 8px 0;">{{GoogleSummary}}</p>
            <p style="margin: 0 0 24px 0;">{{GoogleCAC}}</p>

            <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Previous {{day}} comparison</h2>
            <p style="margin: 0 0 8px 0;"><strong>Performance Highlights</strong></p>
            <div style="margin: 0 0 16px 0; padding-left: 20px; white-space: pre-line;">{{PositiveChanges}}</div>
            <p style="margin: 0 0 8px 0;"><strong>Review Required</strong></p>
            <div style="margin: 0 0 24px 0; padding-left: 20px; white-space: pre-line;">{{RequiresReviews}}</div>

            <p style="margin: 0 0 20px 0; font-size: 13px; color: #555;">
              <span style="display:inline-block; width:18px; height:18px; line-height:18px; text-align:center; background:#b3e0ff; color:#0066aa; border-radius:50%; font-weight:bold;">i</span>
              This message contains automatically generated factual account data for reference purposes only.
            </p>
            <p style="margin: 0;">Regards,</p>
            <p style="margin: 4px 0 0 0;"><strong>Netsights.ai</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Good day,\n\nThis is an automated performance summary for {{StoreName}}'s business performance for {{PrevDate}}.\n\nBusiness Overview\nTotal revenue of {{Revenue}} was generated from {{Orders}} orders, resulting in an Average Order Value (AOV) of {{AOV}}. Compared to the previous day, revenue {{RevChgPct}} and order volume {{OrdChgPct}}.\n\nChannel Performance\n{{MetaSummary}}\n{{MetaCAC}}\n{{GoogleSummary}}\n{{GoogleCAC}}\n\nPrevious {{day}} comparison\nPerformance Highlights\n{{PositiveChanges}}\n\nReview Required\n{{RequiresReviews}}\n\nThis message contains automatically generated factual account data for reference purposes only.\n\nRegards,\nNetsights.ai`,
  },

  ns_temp_Notification_temp1: {
    subject: "{{StoreName}} Daily Performance Summary",
    html: `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Netsights Email Template</title>
    <style>
      body {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
          "Ubuntu", "Cantarell", sans-serif;
        margin: 0;
        background-color: #f9fafb;
        color: #111827;
        padding: 20px;
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .header {
        background: #ffffff;
        padding: 15px;
        border-bottom: 4px solid #5dbbb8;
        text-align: center;
      }

      .header img {
        height: 46px;
        object-fit: contain;
      }

      .content {
        padding: 15px 16px;
        background-color: #ffffff;
      }

      .content h1 {
        font-size: 16px;
        color: #111827;
        margin: 16px 0 8px 0;
      }

      .content h2 {
        font-size: 14px;
        color: #111827;
        margin: 12px 0 6px 0;
      }

      .content .email-intro,
      .content .email-closing,
      .content .email-closing span {
        color: #111827;
      }

      .content .dynamic-fill {
        color: #111827;
        margin: 0 0 16px 0;
        padding-left: 20px;
        white-space: pre-line;
        font-size: 14px;
      }

      .content .dynamic-fill.reviews-block {
        margin: 0 0 24px 0;
      }

      .footer .footer-copyright {
        color: #111827;
      }

      .content p {
        color: #374151;
        font-size: 14px;
        line-height: 1.625;
        margin-bottom: 12px;
      }

      .highlight-box ul {
        list-style: none;
        padding-left: 0;
        margin: 0 0 8px 0;
      }

      .highlight-box li {
        color: #374151;
        font-size: 14px;
        margin-bottom: 6px;
        display: flex;
        align-items: flex-start;
        line-height: 1.5;
      }

      .highlight-box li span:first-child {
        color: #5dbbb8;
        margin-right: 8px;
        margin-top: 2px;
      }

      .footer {
        background: #f9fafb;
        padding: 15px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
      }

      .footer p {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 8px;
        text-align: center;
      }

      .footer-links {
        color: #0066cc;
        text-decoration: none;
        font-size: 13px;
      }

      /* ── CTA Buttons ── */
      .cta-wrapper {
        margin: 0 0 12px 0;
        padding: 6px 0 0 0;
        text-align: center;
      }

      .cta-inner {
        display: inline-flex;
        flex-direction: row;
        gap: 12px;
        flex-wrap: nowrap; 
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
      }

      .cta-btn {
        display: inline-block;
        padding: 10px 18px;
        font-size: 15px;
        line-height: 20px;
        font-weight: 500;
        color: #ffffff !important;
        text-decoration: none;
        white-space: nowrap;
        border-radius: 6px;
        background-color: #5dbbb8;
      }

      /* ── LOGO SWITCHING ── */
      .logo-light {
        display: inline-block !important;
      }
      .logo-dark {
        display: none !important;
      }

      /* ══════════════════════════════════════
           DARK MODE
        ══════════════════════════════════════ */
      @media (prefers-color-scheme: dark) {
        body {
          background: #0b0b0b;
          color: #f3f4f6;
        }

        .email-container {
          background: #0b0b0b;
          box-shadow: none;
        }

        .header {
          background: #0b0b0b !important;
          border-bottom: 4px solid #5dbbb8;
        }

        .header .logo-light {
          display: none !important;
        }
        .header .logo-dark {
          display: inline-block !important;
        }

        .content {
          background-color: #0b0b0b;
        }

        .content h1,
        .content h2,
        .content h3,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          color: #f9fafb;
        }

        .content .email-intro,
        .content .email-closing,
        .content .email-closing span {
          color: #e5e7eb;
        }

        .content .dynamic-fill {
          color: #e5e7eb;
        }

        .footer .footer-copyright {
          color: #d1d5db;
        }

        p {
          color: #d1d5db;
        }

        .highlight-box li {
          color: #e5e7eb;
        }

        .footer {
          background: #0b0b0b;
          border-top: 1px solid #222;
        }

        .footer p {
          color: #9ca3af;
        }

        .footer-links {
          color: #5eead4;
        }

        .footer .logo-light {
          display: none !important;
        }
        .footer .logo-dark {
          display: inline-block !important;
        }
      }

      /* ── MOBILE ── */
      @media (max-width: 480px) {
   body { padding: 0; }
  .email-container { border-radius: 0; }
  .content { padding: 16px 12px; }
  .header { padding: 15px; }
  .footer { padding: 12px; }

  .cta-inner {
    gap: 8px;         
    justify-content: center;
    width: 100%;
  }

    .cta-wrapper a {
    font-size: 12px !important;
    padding: 9px 10px !important;
  }

  .cta-btn {
    font-size: 12px;
    padding: 9px 10px;
    white-space: nowrap;
  }
}
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <img
          src="https://app.netsights.ai/images/logo/netsight-Black.svg"
          alt="Netsights Logo"
          class="logo-light"
          style="height: 46px"
        />
        <img
          src="https://app.netsights.ai/images/logo/netsight-white.svg"
          alt="Netsights Logo"
          class="logo-dark"
          style="height: 46px"
        />
      </div>

      <!-- Content -->
      <div class="content">
        <p class="email-intro">Good day,</p>
        <p class="email-intro">
          Here is your daily performance summary for

          <b>{{StoreName}}</b> - <b>{{PrevDate}}</b>.
        </p>

        <div class="highlight-box">
          <h1>𝗕𝘂𝘀𝗶𝗻𝗲𝘀𝘀 𝗢𝘃𝗲𝗿𝘃𝗶𝗲𝘄</h1>
          <ul>
            <li>
              <span>•</span>
              <span>
                Total revenue of {{GrossRevenue}} was generated from {{Orders}}
                orders, resulting in an Average Order Value (AOV) of {{AOV}}.
                Compared to the previous day, revenue increased by {{RevChgPct}}
                and order volume increased by {{OrdChgPct}}.{{cancelRefundText}}
              </span>
            </li>
          </ul>

          <h2>Top 3 bestsellers</h2>
          <ul>
            <li><span>•</span> <span>{{Bestseller1}}</span></li>
            <li><span>•</span> <span>{{Bestseller2}}</span></li>
            <li><span>•</span> <span>{{Bestseller3}}</span></li>
          </ul>

          <h1>𝗠𝗮𝗿𝗸𝗲𝘁𝗶𝗻𝗴 𝗮𝗻𝗱 𝗚𝗿𝗼𝘄𝘁𝗵 𝗘𝗳𝗳𝗶𝗰𝗶𝗲𝗻𝗰𝘆</h1>
          <ul>
            <li><span>•</span> <span>{{MetaSummary}}</span></li>
            <li><span>•</span> <span>{{MetaCAC}}</span></li>
            {{metaAccountSummaryHtml}}
            <li><span>•</span> <span>{{GoogleSummary}}</span></li>
            <li><span>•</span> <span>{{GoogleCAC}}</span></li>
            {{googleAccountSummaryHtml}}
          </ul>

          {{inventoryHealthHtml}}

          <h1>𝗣𝗿𝗲𝘃𝗶𝗼𝘂𝘀 {{Period}} 𝗰𝗼𝗺𝗽𝗮𝗿𝗶𝘀𝗼𝗻</h1>
          <ul>
            <li>
              <span>•</span>
              <span style="font-weight: bold">Positive changes</span>
            </li>
          </ul>
          <div class="dynamic-fill">{{PositiveChanges}}</div>

          <ul>
            <li>
              <span>•</span>
              <span style="font-weight: bold">Requires a review</span>
            </li>
          </ul>
          <div class="dynamic-fill reviews-block">{{RequiresReviews}}</div>
        </div>

        <p class="email-closing" style="margin-top: 24px">
          Regards,<br />
          <span>Netsights.ai</span>
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <!-- CTA buttons — flexbox replaces nested tables -->
       <!-- CTA buttons — table layout for Gmail compatibility -->
<div class="cta-wrapper">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
    <tr>
      <td style="padding-right: 8px;">
        <a target="_blank" href="https://isight.netsights.ai/{{Url}}"
          style="display:inline-block; padding:10px 18px; font-size:15px; line-height:20px; font-weight:500; color:#ffffff !important; text-decoration:none; white-space:nowrap; border-radius:6px; background-color:#5dbbb8;">
          View Daily Report
        </a>
      </td>
      <td style="padding-left: 0px;">
        <a target="_blank" href="https://app.netsights.ai/{{ScaleUrl}}"
          style="display:inline-block; padding:10px 18px; font-size:15px; line-height:20px; font-weight:500; color:#ffffff !important; text-decoration:none; white-space:nowrap; border-radius:6px; background-color:#5dbbb8;">
          Visit Scaleboard
        </a>
      </td>
    </tr>
  </table>
</div>

        <!-- Copyright -->
        <p
          class="footer-copyright"
          style="margin-bottom: 8px; text-align: center"
        >
          © 2026 Netsights.ai. All rights reserved
        </p>

        <!-- Links -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="margin-top: 4px"
        >
          <tr>
            <td align="center">
              <a
                target="_blank"
                href="https://netsights.ai/support/"
                class="footer-links"
                style="text-decoration: none; color: #0066cc"
                >Support</a
              >
              <span style="color: #d1d5db"> | </span>
              <a
                target="_blank"
                href="https://netsights.ai/contact-us/"
                class="footer-links"
                style="text-decoration: none; color: #0066cc"
                >Contact Us</a
              >
            </td>
          </tr>
        </table>
      </div>
    </div>
  </body>
</html>
    `,
    text: "{{content}}",
  },

  ns_temp_Notification_temp2: {
    subject: "{{StoreName}} Daily Performance Summary",
    html: `
      <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Email Template</title>

<style>
body{
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell',sans-serif;
margin:0;
color:#111827;
}

.container{
max-width:600px;
margin:auto;
background:#ffffff;
border-radius:10px;
overflow:hidden;
}

.header{
background:#ffffff;
padding:15px;
border-bottom:4px solid #5DBBB8;
text-align:center;
}

.header img{
height:46px;
}

h1{
font-size:20px;
}

h2{
font-size:18px;
}

p{
font-size:14px;
color:#374151;
line-height:1.6;
}

.layer{
border-radius:14px;
padding:15px;
margin-top:10px;
border-left:4px solid;
}

.layer-header{
font-weight:600;
margin-bottom:10px;
font-size:14px;
letter-spacing:0.2px;
}

.metrics-table{
width:100%;
}

.metrics-table td{
width:33%;
padding:6px 3px;
vertical-align:top;
}

.metric-label{
font-size:13px;
color:#6b7280;
margin-bottom:2px;
}

.metric-value{
font-size:13px;
font-weight:600;
color:#111827;
}

.teal{
background:#ecfeff;
border-color:#5eead4;
}

.pink{
background:#fdf2f8;
border-color:#f9a8d4;
}

.indigo{
background:#eef2ff;
border-color:#c7d2fe;
}

.highlight{
background:#f0fdf4;
border-left:4px solid #6ee7b7;
padding:15px;
border-radius:12px;
margin-top:10px;
}

.review{
background:#fff1f2;
border-left:4px solid #fca5a5;
padding:15px;
border-radius:12px;
margin-top:10px;
}

.inventory{
background:#fffbeb;
border-left:4px solid #f59e0b;
padding:15px;
border-radius:12px;
margin-top:10px;
}

ul{
margin:3px 0 0 0;
padding-left:15px;
}

li{
margin-bottom:3px;
font-size:14px;
color:#444;
}

.footer{
background:#f9fafb;
padding:15px;
border-top:1px solid #e5e7eb;
text-align:center;
}

.footer-links a{
color:#5DBBB8;
text-decoration:none;
font-size:13px;
}

@media (max-width:600px){

.container{
border-radius:0;
}

.content{
padding:3px;
}

.metrics-table td{
display:inline-block;
box-sizing:border-box;
padding-left: 5px;
vertical-align:top;
}

.layer{
padding:7px;
}

/* base spacing */
.highlight,
.review{
padding:7px;
}

/* 🔥 NEW: specific control */
.highlight-title,
.review-title{
    padding-left: 4px !important;
}

.highlight-content,
.review-content{
    padding-left: 6px !important; /* 🔥 earlier 12px → now less */
    font-size: 13px !important;
}

/* keep others same */
.mobile-view{
padding-left: 10px;
padding-right: 10px;
}

.layer-header{
padding-left: 5px;
}

.metric-label{
font-size:11px;
color:#6b7280;
margin-bottom:2px;
}

.footer-btn-cell{
width:50% !important;
}

.footer-btn-link{
display:block !important;
font-size:14px !important;
line-height:18px !important;
padding:9px 8px !important;
}

}

.logo-light{display:inline-block !important;}
.logo-dark{display:none !important;}
@media (prefers-color-scheme: dark){
.header{
background:#0b0b0b !important;
border-bottom:4px solid #5DBBB8;
}
.header .logo-light{display:none !important;}
.header .logo-dark{display:inline-block !important;}
body{
background:#0b0b0b;
color:#f3f4f6;
}

.container{
background:#0b0b0b;
}

p{
color:#d1d5db;
}

.layer{
background:#0f0f0f;
}

.teal{
border-color:#2dd4bf;
}

.pink{
border-color:#ec4899;
}

.indigo{
border-color:#6366f1;
}

.metric-label{
color:#9ca3af;
}

.metric-value{
color:#f9fafb;
}

.highlight{
background:transparent;
border-color:#22c55e;
}

.review{
background:transparent;
border-color:#ef4444;
}

.inventory{
background:transparent;
border-color:#fbbf24;
}

.footer{
background:#0b0b0b;
border-top:1px solid #222;
}

.footer-links a{
color:#5eead4;
}

.footer .logo-light{
display:none !important;
}

.footer .logo-dark{
display:inline-block !important;
}

}

</style>
</head>

<body>

<div class="container">

<div class="header">
<img src="https://app.netsights.ai/images/logo/netsight-Black.svg" alt="Netsights Logo" class="logo-light" style="height:46px;">
<img src="https://app.netsights.ai/images/logo/netsight-white.svg" alt="Netsights Logo" class="logo-dark" style="height:46px;">
</div>

<div class="content">

<div class="" style="margin-top: -4px;">
  <h1 style="padding-left:16px; padding-right: 11px; margin-bottom: -7px;" class="mobile-view">Good day,</h1>

<p style="padding-left:16px; padding-right: 11px; font-size: 13px;">
Here is your daily performance summary for
<b>{{StoreName}}</b> - <b>{{PrevDate}}</b>.
</p>
</div>

<div class="layer teal" style="margin-top: -5px;">

<div class="layer-header">
UNIT ECONOMICS
</div>

<table class="metrics-table" cellpadding="0" cellspacing="0">

<tr>
<td>
<div class="metric-label">Gross Revenue</div>
<div class="metric-value">{{GrossRevenue}}</div>
</td>

<td>
<div class="metric-label">Net Sales</div>
<div class="metric-value">{{NetSales}}</div>
</td>

<td>
<div class="metric-label">Orders</div>
<div class="metric-value">{{Orders}}</div>
</td>
</tr>

<tr>
<td>
<div class="metric-label">AOV</div>
<div class="metric-value">{{AOV}}</div>
</td>

<td>
<div class="metric-label">LTV</div>
<div class="metric-value">{{LTV}}</div>
</td>

<td>
<div class="metric-label">LTV : CAC</div>
<div class="metric-value">{{LTVCACRatio}}</div>
</td>
</tr>

{{cancelRefundHtml}}

</table>
</div>




<div class="layer pink">

<div class="layer-header">
OPERATIONAL METRICS
</div>

<table class="metrics-table">

<tr>
<td>
<div class="metric-label">New vs Repeat</div>
<div class="metric-value">{{NewVsRepeat}}</div>
</td>

<td>
<div class="metric-label">Order Frequency</div>
<div class="metric-value">{{OrderFrequency}}</div>
</td>

<td>
<div class="metric-label">Discount Rate</div>
<div class="metric-value">{{TotalDiscountRate}}</div>
</td>
</tr>

<tr>
<td>
<div class="metric-label">Fulfilment Rate</div>
<div class="metric-value">{{OrderFulfillmentRate}}</div>
</td>

<td>
<div class="metric-label">GA4 Sessions</div>
<div class="metric-value">{{GA4Sessions}}</div>
</td>

<td>
<div class="metric-label">GA4 Users</div>
<div class="metric-value">{{GA4Users}}</div>
</td>
</tr>

</table>
</div>



<div class="layer indigo">

<div class="layer-header">
CAMPAIGN PERFORMANCE
</div>

<table class="metrics-table">
<tr>
<td>
<div class="metric-label">Blended Spend</div>
<div class="metric-value">{{BlendedSpend}}</div>
</td>

<td>
<div class="metric-label">Blended ROAS</div>
<div class="metric-value">{{BlendedROAS}}</div>
</td>

<td>
<div class="metric-label">Blended Revenue</div>
<div class="metric-value">{{BlendedRevenue}}</div>
</td>
</tr>
</table>

<table class="metrics-table">
<tr>
<td>
<div class="metric-label">Meta Spend</div>
<div class="metric-value">{{MetaSpend}}</div>
</td>

<td>
<div class="metric-label">Meta ROAS</div>
<div class="metric-value">{{MetaROAS}}</div>
</td>

<td>
<div class="metric-label">Meta Revenue</div>
<div class="metric-value">{{MetaRevenue}}</div>
</td>
</tr>
</table>

<table class="metrics-table">
<tr>
<td>
<div class="metric-label">Googlead Spend</div>
<div class="metric-value">{{Googleadsspend}}</div>
</td>

<td>
<div class="metric-label">Google ROAS</div>
<div class="metric-value">{{GoogleROAS}}</div>
</td>

<td>
<div class="metric-label">Google Revenue</div>
<div class="metric-value">{{GoogleRevenue}}</div>
</td>
</tr>
</table>

{{metaAccountsHtml}}

{{googleAccountsHtml}}

</div>

{{inventoryHealthHtml}}

<div class="highlight">

  <div class="layer-header highlight-title" style="margin-bottom:5px;">
    PERFORMANCE HIGHLIGHTS
  </div>

  <div class="highlight-content" style="white-space: pre-line !important; font-size: 14px;">{{PositiveChanges}}</div>

</div>


<div class="review">

  <div class="layer-header review-title" style="margin-bottom:5px;">
    REVIEW REQUIRED
  </div>

  <div class="review-content" style="white-space: pre-line !important; font-size: 14px;">{{RequiresReviews}}</div>

</div>


<div class="footer" style="margin-top: 0.7rem;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0; padding:0;">
<tr>
  <td align="center" style="padding:6px 0 0 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td align="center" class="footer-btn-cell" style="padding-right:6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" bgcolor="#5DBBB8" style="border-radius:6px;">
          <a target="_blank" href="https://isight.netsights.ai/{{Url}}" class="footer-btn-link" style="display:inline-block; padding:10px 18px; font-size:16px; line-height:20px; font-weight:500; color:#ffffff !important; text-decoration:none; white-space:nowrap; border-radius:6px;">
            View Daily Report
          </a>
              </td>
            </tr>
          </table>
        </td>
        <td align="center" class="footer-btn-cell" style="padding-left:6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" bgcolor="#5DBBB8" style="border-radius:6px;">
          <a target="_blank" href="https://app.netsights.ai/{{ScaleUrl}}" class="footer-btn-link" style="display:inline-block; padding:10px 18px; font-size:16px; line-height:20px; font-weight:500; color:#ffffff !important; text-decoration:none; white-space:nowrap; border-radius:6px;">
            Visit Scaleboard
          </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
</table>

<p style="margin-bottom:8px; text-align:center;">© 2026 Netsights.ai. All rights reserved</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
<tr>
  <td align="center">
    <a target="_blank" href="https://netsights.ai/support/" style="text-decoration:none;">Support</a>
    <span style="color:#d1d5db;"> | </span>
    <a target="_blank" href="https://netsights.ai/contact-us/" style="text-decoration:none;">Contact Us</a>
  </td>
</tr>
</table>



</div>

</div>

</body>
</html>
    `,
    text: "{{content}}",
  },

  ns_temp_OTP: {
    subject: "{{StoreName}} OTP Verification",
    html: `
     <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Netsights Email Template</title>
    <style>
        :root {
            --ns-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            --ns-font-size: 16px;
            --ns-font-weight: 400;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--ns-font-family);
            font-size: var(--ns-font-size);
            font-weight: var(--ns-font-weight);
            background-color: #f9fafb;
            padding: 20px;
        }

        /* Force consistent font across typical text elements */
        h1, h2, h3, h4, h5, h6,
        p, span, a, li, ul, ol, div, td, th, small, strong, b, em {
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
    background:linear-gradient(to right,#ffffff,#f9fafb);
    padding: 24px 32px;
    border-bottom: 4px solid #5DBBB8;
    text-align: center;
}

        .header img {
            height: 48px;
            object-fit: contain;
        }

        .content {
            padding: 15px;
            background-color: white;
        }

        /* Removed custom font-size/font-weight so it inherits uniformly */
        .content h2 {
            color: #111827;
            margin-bottom: 8px;
        }

        .accent-line {
            width: 64px;
            height: 4px;
            background-color: #5DBBB8;
            border-radius: 2px;
            margin-bottom: 24px;
        }

        .content p {
            color: #374151;
            line-height: 1.625;
            margin-bottom: 16px;
        }

        .highlight-box {
            background: linear-gradient(to bottom right, rgba(93, 187, 184, 0.05), rgba(93, 187, 184, 0.1));
            border-radius: 0 8px 8px 0;
            padding: 24px;
            margin: 24px 0;
        }

        /* Removed custom font-size/font-weight so it inherits uniformly */
        .highlight-box h3 {
            color: #111827;
            margin-bottom: 12px;
        }

        .highlight-box ul {
list-style: none;
padding-left:0;
}

        .highlight-box li { 
            color: #374151;
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            line-height: 1.5;
        }

        .highlight-box li span:first-child {
            color: #5DBBB8;
            margin-right: 8px;
            margin-top: 4px;
            font-weight: inherit; /* keep uniform */
        }

        .cta-button {
            display: inline-block;
            background-color: #5DBBB8;
            color: white;
            font-weight: inherit; /* keep uniform */
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            transition: background-color 0.2s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin: 32px 0;
        }

        .cta-button:hover {
            background-color: #4da9a6;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .footer {
            background: linear-gradient(to right, #f9fafb, #f3f4f6);
            padding: 15px;
            border-top: 1px solid #e5e7eb;
        }

        .footer-contact {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 24px;
            margin-bottom: 16px;
            color: #4b5563;
        }

        .footer-contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .footer-contact-item svg {
            width: 16px;
            height: 16px;
            color: #5DBBB8;
            flex-shrink: 0;
        }

        .footer-info {
            text-align: center;
            color: #6b7280;
            line-height: 1.6;
        }

        .footer-location {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .footer-location svg {
            width: 12px;
            height: 12px;
            color: #5DBBB8;
        }

        .footer-divider {
            border-top: 1px solid #d1d5db;
            margin: 12px 0;
            padding-top: 8px;
        }

        .footer-links {
            display: flex;
            justify-content: center;
            text-align: center;
            gap: 16px;
            padding-top: 8px;
        }

        .footer-links a {
            color: #5DBBB8;
            text-decoration: none;
            transition: color 0.2s;
        }

        .footer-links a:hover {
            color: #4da9a6;
        }

        .footer-separator {
            color: #d1d5db;
        }

        .logo-dark { display: none !important; }
        @media (prefers-color-scheme: dark) {
            .header {
                background: #ffffff !important;
                border-bottom: 4px solid #5DBBB8;
            }
            .header .logo-light { display: block !important; }
            .header .logo-dark { display: none !important; }
        }

        @media (max-width: 600px) {
            .email-container {
                border-radius: 0;
            }

            .content {
                padding: 24px 20px;
            }

            .header {
                padding: 20px 20px;
            }

            .footer {
                padding: 20px 20px;
            }

            .footer-contact {
                gap: 16px;
            }

            /* Removed responsive font-size change to keep uniform */
        }
      
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
    <img src="https://app.netsights.ai/images/logo/netsight-Black.svg" alt="Netsights Logo" class="logo-light" style="height:46px;">
    <img src="https://app.netsights.ai/images/logo/netsight-white.svg" alt="Netsights Logo" class="logo-dark" style="height:46px;">
    </div>

        <!-- Content -->
        <div style="background-color: #f9fafb;" class="content">
            <p>Hello,</p>

            <p>You're receiving this email because you requested to verify your email address for {{StoreName}} notifications.</p>

            <div class="highlight-box">
                <h3>Your verification code is: {{OTP}}</h3>
            </div>

            <p style="margin-top: 32px;">
                Regards,<br>
                <span style="font-weight: inherit; color: #111827;">Netsights.ai</span>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0; padding:0;">
    <tr>
      <td width="33.33%" align="center" style="padding-top:8px; padding-bottom:0; margin:0; vertical-align:middle;">
        <a href="#"><img class="logo-light" src="https://app.netsights.ai/images/email-icon/shopifylight.svg" alt="Shopify" style="width:90px;height:38px;display:inline-block;vertical-align:middle;margin:0;padding:0;" /></a>
        <a href="#"><img class="logo-dark" src="https://app.netsights.ai/images/email-icon/shopify-dark.svg" alt="Shopify" style="width:90px;height:38px;display:inline-block;vertical-align:middle;margin:0;padding:0;" /></a>
      </td>
      <td width="33.33%" align="center" style="padding-top:8px; padding-bottom:0; margin:0; vertical-align:middle;">
        <a href="#"><img class="logo-light" src="https://app.netsights.ai/images/email-icon/Klaviyolight.svg" alt="Klavio" style="width:70px;height:38px;display:inline-block;vertical-align:middle;margin:0;padding:0;" /></a>
        <a href="#"><img class="logo-dark" src="https://app.netsights.ai/images/email-icon/Klaviyo-dark.svg" alt="Klavio" style="width:70px;height:38px;display:inline-block;vertical-align:middle;margin:0;padding:0;" /></a>
      </td>
      <td width="33.33%" align="center" style="padding-top:8px; padding-bottom:0; margin:0; vertical-align:middle;">
        <a href="#"><img class="logo-light" src="https://app.netsights.ai/images/email-icon/bitspeed-light.svg" alt="bite" style="width:90px;height:38px;display:inline-block;vertical-align:middle;margin:0;padding:0;" /></a>
        <a href="#"><img class="logo-dark" src="https://app.netsights.ai/images/email-icon/bitspeed-dark.svg" alt="bite" style="width:90px;height:38px;display:inline-block;vertical-align:middle;margin:0;padding:0;" /></a>
      </td>
    </tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0; padding:0;">
    <tr>
      <td align="center" style="padding:0 6px; vertical-align:middle;">
        <a target="_blank" href="https://isight.netsights.ai/{{Url}}" style="display:inline-block; padding:8px 24px; background-color:#5DBBB8; color:#ffffff; font-weight:400; border-radius:8px; text-decoration:none; transition:all 200ms ease; box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          View Daily Report
        </a>
      </td>
      <td align="center" style="padding:0 6px; vertical-align:middle;">
        <a target="_blank" href="https://isight.netsights.ai/intelligence" style="display:inline-block; padding:8px 24px; background-color:#5DBBB8; color:#ffffff; font-weight:400; border-radius:8px; text-decoration:none; transition:all 200ms ease; box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          ASK AI
        </a>
      </td>
    </tr>
  </table>

  <p style="margin-bottom:8px; text-align:center;">© 2026 Netsights.ai. All rights reserved</p>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
    <tr>
      <td align="center">
        <a target="_blank" href="https://netsights.ai/support/" style="text-decoration:none;">Support</a>
        <span style="color:#d1d5db;"> | </span>
        <a target="_blank" href="https://netsights.ai/contact-us/" style="text-decoration:none;">Contact Us</a>
      </td>
    </tr>
  </table>

</div>
    </div>
</body>
</html>
    `,
    text: "{{content}}",
  },
};

const baseNotificationTemplate1 = templates.ns_temp_Notification_temp1;
if (baseNotificationTemplate1) {
  templates.ns_temp_Notification_temp1_weekly = {
    ...baseNotificationTemplate1,
    subject: "{{StoreName}} Weekly Performance Summary",
    html: baseNotificationTemplate1.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your weekly performance summary for",
      )
      .replace("View Daily Report", "View Weekly Report"),
  };

  templates.ns_temp_Notification_temp1_monthly = {
    ...baseNotificationTemplate1,
    subject: "{{StoreName}} Monthly Performance Summary",
    html: baseNotificationTemplate1.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your monthly performance summary for",
      )
      .replace("View Daily Report", "View Monthly Report"),
  };

  templates.ns_temp_Notification_temp1_quarterly = {
    ...baseNotificationTemplate1,
    subject: "{{StoreName}} Quarterly Performance Summary",
    html: baseNotificationTemplate1.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your quarterly performance summary for",
      )
      .replace("View Daily Report", "View Quarterly Report"),
  };

  templates.ns_temp_Notification_temp1_halfyearly = {
    ...baseNotificationTemplate1,
    subject: "{{StoreName}} Half-Yearly Performance Summary",
    html: baseNotificationTemplate1.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your half-yearly performance summary for",
      )
      .replace("View Daily Report", "View Half Yearly Report"),
  };

  templates.ns_temp_Notification_temp1_yearly = {
    ...baseNotificationTemplate1,
    subject: "{{StoreName}} Yearly Performance Summary",
    html: baseNotificationTemplate1.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your yearly performance summary for",
      )
      .replace("View Daily Report", "View Yearly Report"),
  };
}

const baseNotificationTemplate = templates.ns_temp_Notification_temp2;

if (baseNotificationTemplate) {
  templates.ns_temp_Notification_temp2_weekly = {
    ...baseNotificationTemplate,
    subject: "{{StoreName}} Weekly Performance Summary",
    html: baseNotificationTemplate.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your weekly performance summary for",
      )
      .replace("View Daily Report", "View Weekly Report"),
  };

  templates.ns_temp_Notification_temp2_monthly = {
    ...baseNotificationTemplate,
    subject: "{{StoreName}} Monthly Performance Summary",
    html: baseNotificationTemplate.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your monthly performance summary for",
      )
      .replace("View Daily Report", "View Monthly Report"),
  };

  templates.ns_temp_Notification_temp2_quarterly = {
    ...baseNotificationTemplate,
    subject: "{{StoreName}} Quarterly Performance Summary",
    html: baseNotificationTemplate.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your quarterly performance summary for",
      )
      .replace("View Daily Report", "View Quarterly Report"),
  };

  templates.ns_temp_Notification_temp2_halfyearly = {
    ...baseNotificationTemplate,
    subject: "{{StoreName}} Half-Yearly Performance Summary",
    html: baseNotificationTemplate.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your half-yearly performance summary for",
      )
      .replace("View Daily Report", "View Half Yearly Report"),
  };

  templates.ns_temp_Notification_temp2_yearly = {
    ...baseNotificationTemplate,
    subject: "{{StoreName}} Yearly Performance Summary",
    html: baseNotificationTemplate.html
      .replace(
        "Here is your daily performance summary for",
        "Here is your yearly performance summary for",
      )
      .replace("View Daily Report", "View Yearly Report"),
  };
}

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
  registerTemplate,
};
