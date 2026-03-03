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
  // Parameters: StoreName, PrevDate, Revenue, Orders, AOV, RevChgPct, OrdChgPct, MetaSummary, MetaCAC, GoogleSummary, GoogleCAC, day, PositiveChanges, RequiresReviews
  business_performance_summary: {
    subject: 'Daily business performance summary – {{PrevDate}}',
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
    text: `Good day,\n\nThis is an automated performance summary for {{StoreName}}'s business performance for {{PrevDate}}.\n\nBusiness Overview\nTotal revenue of {{Revenue}} was generated from {{Orders}} orders, resulting in an Average Order Value (AOV) of {{AOV}}. Compared to the previous day, revenue {{RevChgPct}} and order volume {{OrdChgPct}}.\n\nChannel Performance\n{{MetaSummary}}\n{{MetaCAC}}\n{{GoogleSummary}}\n{{GoogleCAC}}\n\nPrevious {{day}} comparison\nPerformance Highlights\n{{PositiveChanges}}\n\nReview Required\n{{RequiresReviews}}\n\nThis message contains automatically generated factual account data for reference purposes only.\n\nRegards,\nNetsights.ai`
  },

  ns_temp_Notification_temp1: {
    subject: '{{StoreName}} Daily Performance Summary',
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
            background: linear-gradient(to right, #ffffff, #f9fafb);
            padding: 24px 32px;
            border-bottom: 4px solid #5DBBB8;
        }

        .header img {
            height: 48px;
            object-fit: contain;
        }

        .content {
            padding: 40px 32px;
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
            padding: 24px 32px;
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
  <img src="cid:netsights-logo" alt="Netsights Logo">
</div>

        <!-- Content -->
        <div class="content">
            <!--<h2>Welcome to Netsights</h2>
            <div class="accent-line"></div>-->

            <p>Good day,</p>

            <p>Please find below a summary of {{StoreName}}’s business performance for {{PrevDate}} .</p>

            <div class="highlight-box">
                <h1>𝗕𝘂𝘀𝗶𝗻𝗲𝘀𝘀 𝗢𝘃𝗲𝗿𝘃𝗶𝗲𝘄</h1>
            <ul>
                    <li>
                        <span>•</span> <span>Total revenue of {{Revenue}} was generated from {{Orders}} orders, resulting in an Average Order Value (AOV) of {{AOV}}.
Compared to the previous day, revenue increased by {{RevChgPct}} and order volume increased by {{OrdChgPct}} .</span>
                    </li>
            </ul>
             <h2>Top 3 bestsellers</h2>
            <ul>
                    <li>
                        <span>•</span> <span>{{Bestseller1}}</span>
                    </li>
                    <li>
                        <span>•</span> <span>{{Bestseller2}}</span>
                    </li>
                     <li>
                        <span>•</span> <span>{{Bestseller3}}</span>
                    </li>
            </ul>
             <h1>𝗠𝗮𝗿𝗸𝗲𝘁𝗶𝗻𝗴 𝗮𝗻𝗱 𝗚𝗿𝗼𝘄𝘁𝗵 𝗘𝗳𝗳𝗶𝗰𝗶𝗲𝗻𝗰𝘆</h1>
            <ul>
                    <li>
                        <span>•</span> <span>Meta ads generated revenue of {{MetaRevenue}} with ROAS of {{MetaROAS}}. Compared to the previous day, revenue increased by {{MetaRevChgPct}} and ROAS increased by {{MetaROASChgPct}} .</span>
                    </li>
                    <li>
                        <span>•</span> <span>Customer Acquisition Cost on Meta increased to {{MetaCAC}} .</span>
                    </li>
                     <li>
                        <span>•</span> <span>Google ads generated revenue of {{GoogleRevenue}} with ROAS of {{GoogleROAS}} . Compared to the previous day, revenue increased by {{GoogleRevChgPct}} and ROAS increased by {{GoogleROASChgPct}} .</span>
                    </li>
                     <li>
                        <span>•</span> <span>Customer Acquisition Cost on Google ads increased to {{GoogleCAC}} .</span>
                    </li>
            </ul>
             <h1>𝗣𝗿𝗲𝘃𝗶𝗼𝘂𝘀 {{day}} day's 𝗰𝗼𝗺𝗽𝗮𝗿𝗶𝘀𝗼𝗻</h1>
            <ul>
                    <li>
                        <span>•</span> <span style="font-weight: bold;">Positive changes</span>
                    </li>
                    <li>
                        <span>•</span> <span>Revenue grew strongly by {{RevChgPct}} .</span>
                    </li>
                    <li>
                        <span>•</span> <span>Order volume increased by {{OrdChgPct}} .</span>
                    </li>
            </ul>
        
            <ul>
                    <li>
                        <span>•</span> <span style="font-weight: bold;">Requires a review</span>
                    </li>
                    <li>
                        <span>•</span> <span>Meta CAC increased by {{MetaCACChgPct}} .</span>
                    </li>
                    <li>
                        <span>•</span> <span>Traffic declined by {{TrafficChgPct}} .</span>
                    </li>
            </ul>
            </div>

            <p style="margin-top: 32px;">
                Regards,<br>
                <span style="font-weight: inherit; color: #111827;">Netsights.ai</span>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-info">
                <p style="margin-bottom: 8px;">© 2026 Netsights.ai. All rights reserved</p>
                <div class="footer-links">
                    <a target="_blank" href="https://netsights.ai/support/">Support</a>
                    <span class="footer-separator">|</span>
                    <a target="_blank" href="https://netsights.ai/contact-us/">Contact Us</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `,
    text: '{{content}}'
  },

  ns_temp_Notification_temp2: {
    subject: '{{StoreName}} Daily Performance Summary',
    html: `
      <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Store Daily Performance</title>

<style>
:root {
  --bg: #0b0b0b;
  --card-bg: #1a1a1a;
  --border: #2a2a2a;
  --primary: #ffffff;
  --secondary: #a1a1aa;
  --accent: #2dd4bf;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: Inter, system-ui, -apple-system, sans-serif;
}

body {
  background: var(--bg);
  color: var(--primary);
  padding: 40px;
}

.container {
  max-width: 1400px;
  margin: auto;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.logo {
  width: 180px;
  height: auto;
  object-fit: contain;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
}

.card {
  background: linear-gradient(145deg, #1c1c1c, #181818);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 28px;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.card-header .accent {
  width: 8px;
  height: 24px;
  background: var(--accent);
  margin-right: 12px;
  border-radius: 2px;
}

.card-header h2 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 32px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric-label {
  color: var(--secondary);
  font-size: 16px;
  margin-bottom: 6px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
}

@media (max-width: 1200px) {
  .metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
</head>

<body>

<div class="container">
  <div class="logo-container">
    <img src="cid:netsights-logo" alt="Netsights Logo" class="logo" />
  </div>
  <div class="title">Your Store’s Daily Performance Summary</div>

  <!-- UNIT ECONOMICS -->
  <div class="card">
    <div class="card-header">
      <div class="accent"></div>
      <h2>UNIT ECONOMICS (FOUNDATION)</h2>
    </div>
    <div class="metrics" id="unitEconomics"></div>
  </div>

  <!-- OPERATIONAL METRICS -->
  <div class="card">
    <div class="card-header">
      <div class="accent"></div>
      <h2>OPERATIONAL METRICS (GROWTH DRIVERS)</h2>
    </div>
    <div class="metrics" id="operationalMetrics"></div>
  </div>

  <!-- CAMPAIGN PERFORMANCE -->
  <div class="card">
    <div class="card-header">
      <div class="accent"></div>
      <h2>CAMPAIGN PERFORMANCE (MARKETING EFFICIENCY)</h2>
    </div>
    <div class="metrics" id="campaignPerformance"></div>
  </div>
</div>

<script>
// 🔥 Replace this with API/backend values
const data = {
  unitEconomics: [
    { label: "AOV (Average Order Value)", value: "$115" },
    { label: "Customer LTV", value: "$89" },
    { label: "LTV CAC Ratio", value: "3:1" },
    { label: "Gross Revenue", value: "$46K" },
    { label: "Net Sale", value: "$38.6" },
    { label: "Refund Rate", value: "7%" }
  ],
  operationalMetrics: [
    { label: "New vs Repeat", value: "11.5x" },
    { label: "Order Frequency", value: "1.18x" },
    { label: "Total Discount Rate", value: "2.25%" },
    { label: "Order per day", value: "45" },
    { label: "Top Customer LTV", value: "$89" },
    { label: "Active Customer Base", value: "250" }
  ],
  campaignPerformance: [
    { label: "Meta Ads Spend", value: "$25K" },
    { label: "Meta ROAS", value: "2.2x" },
    { label: "Meta Spend Growth", value: "-56.7%" },
    { label: "Google Ads Spend", value: "$18K" },
    { label: "Google ROAS", value: "1.5x" },
    { label: "Blended ROAS", value: "4.52x" },
    { label: "Meta Conversion Rate", value: "0.81%" },
    { label: "Best Campaign", value: "Black Friday Sale" },
    { label: "CAC", value: "$3.8" }
  ]
};

function renderMetrics(sectionId, metrics) {
  const container = document.getElementById(sectionId);
  container.innerHTML = "";
  metrics.forEach(metric => {
    const metricDiv = document.createElement("div");
    metricDiv.className = "metric";
    metricDiv.innerHTML = \`
      <div class="metric-label">\${metric.label}</div>
      <div class="metric-value">\${metric.value}</div>
    \`;
    container.appendChild(metricDiv);
  });
}

renderMetrics("unitEconomics", data.unitEconomics);
renderMetrics("operationalMetrics", data.operationalMetrics);
renderMetrics("campaignPerformance", data.campaignPerformance);
</script>

</body>
</html>
    `,
    text: '{{content}}'
  },

  ns_temp_OTP: {
    subject: '{{StoreName}} OTP Verification',
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
            background: linear-gradient(to right, #ffffff, #f9fafb);
            padding: 24px 32px;
            border-bottom: 4px solid #5DBBB8;
        }

        .header img {
            height: 48px;
            object-fit: contain;
        }

        .content {
            padding: 40px 32px;
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
            padding: 24px 32px;
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
            <img src="cid:netsights-logo" alt="Netsights Logo">
        </div>

        <!-- Content -->
        <div class="content">
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
            <div class="footer-info">
                <p style="margin-bottom: 8px;">© 2026 Netsights.ai. All rights reserved</p>
                <div class="footer-links">
                    <a target="_blank" href="https://netsights.ai/support/">Support</a>
                    <span class="footer-separator">|</span>
                    <a target="_blank" href="https://netsights.ai/contact-us/">Contact Us</a>
                </div>
            </div>
        </div>
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
