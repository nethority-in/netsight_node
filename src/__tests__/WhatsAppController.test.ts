// WhatsAppController.test.ts – tests aligned with ErrorHandler response shape and WhatsApp Cloud API policy
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// mock must be set up before any import of modules that use WhatsAppService
const mockSendTemplate = jest.fn();
const mockSendText = jest.fn();
jest.unstable_mockModule('../services/whatsappService.js', () => ({
  WhatsAppService: {
    sendTemplate: mockSendTemplate,
    sendText: mockSendText,
  },
}));

let app: Express;

beforeAll(async () => {
  const { default: whatsappRoutes } = await import('../routes/whatsappRoutes.js');
  app = express();
  app.use(express.json());
  app.use('/api/whatsapp', whatsappRoutes);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WhatsAppController', () => {
  describe('POST /send-text', () => {
    it('should return 400 if "to" is missing', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-text')
        .send({ text: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/to|recipient|phone|required/i);
    });

    it('should return 400 if "text" is missing', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-text')
        .send({ to: '918698673161' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/text|message|required/i);
    });

    it('should send text successfully', async () => {
      mockSendText.mockResolvedValue({
        ok: true,
        meta: {
          messaging_product: 'whatsapp',
          contacts: [{ input: '918698673161', wa_id: '918698673161' }],
          messages: [{ id: 'msg123' }],
        },
      }); 

      const res = await request(app)
        .post('/api/whatsapp/send-text')
        .send({ to: '918698673161', text: 'Hello world' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.messaging_product).toBe('whatsapp');
      expect(mockSendText).toHaveBeenCalledWith('918698673161', 'Hello world');
    });

    it('should return 400 when service returns invalid phone (WhatsApp policy: 10-12 digits)', async () => {
      mockSendText.mockResolvedValue({
        ok: false,
        error: { message: 'Invalid phone number format. Must be digits only (10-12 digits), no + or spaces.', status: 400, code: 400 },
      }); 

      const res = await request(app)
        .post('/api/whatsapp/send-text')
        .send({ to: 'invalid', text: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/phone|digit|invalid/i);
    });
  });

  describe('POST /send-template', () => {
    it('should return 400 if "to" is missing', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-template')
        .send({ templateName: 'welcome' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/to|recipient|phone|required/i);
    });

    it('should return 400 if "templateName" is missing', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-template')
        .send({ to: '918698673161' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/templateName|required/i);
    });

    it('should send template successfully with valid payload (languageCode en_US per WhatsApp policy)', async () => {
      mockSendTemplate.mockResolvedValue({
        ok: true,
        meta: {
          messaging_product: 'whatsapp',
          contacts: [{ input: '918698673161', wa_id: '918698673161' }],
          messages: [{ id: 'tmpl123' }],
        },
      });

      const res = await request(app)
        .post('/api/whatsapp/send-template')
        .send({
          to: '918698673161',
          templateName: 'welcome',
          languageCode: 'en_US',
          components: {
            body: ['Hello {{1}}'],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(mockSendTemplate).toHaveBeenCalledWith(
        '918698673161',
        'welcome',
        'en_US',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'body',
            parameters: expect.arrayContaining([expect.objectContaining({ type: 'text', text: 'Hello {{1}}' })]),
          }),
        ])
      );
    });
  });

  describe('POST /send-daily-kpi-snapshot', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-daily-kpi-snapshot')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/required|to|storeName|date/i);
    });

    it('should call sendDynamic internally and succeed', async () => {
      mockSendTemplate.mockResolvedValue({ ok: true, meta: { messages: [{ id: 'kpi123' }] } });

      const payload = {
        to: '918698673161',
        storeName: 'My Store',
        date: '2026-01-28',
        revenue: 1000,
        profit: 500,
      };

      const res = await request(app)
        .post('/api/whatsapp/send-daily-kpi-snapshot')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(mockSendTemplate).toHaveBeenCalled();
    });
  });

  describe('POST /send-dynamic', () => {
    it('should return 400 if "to" is missing', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-dynamic')
        .send({ templateName: 'dynamic1', parameters: {} });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/to|recipient|phone|required/i);
    });

    it('should return 400 if "templateName" is missing', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-dynamic')
        .send({ to: '918698673161', parameters: {} });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.message).toMatch(/templateName|required/i);
    });

    it('should send dynamic template successfully (uses WhatsAppService.sendTemplate)', async () => {
      mockSendTemplate.mockResolvedValue({
        ok: true,
        meta: { messaging_product: 'whatsapp', contacts: [], messages: [{ id: 'dyn123' }] },
      });

      const payload = {
        to: '918698673161',
        templateName: 'dynamic1',
        parameters: { name: 'John' },
      };

      const res = await request(app)
        .post('/api/whatsapp/send-dynamic')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(mockSendTemplate).toHaveBeenCalledWith(
        '918698673161',
        'dynamic1',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('should accept daily_business_insights payload (28 body params) for user 918698673161', async () => {
      mockSendTemplate.mockResolvedValue({
        ok: true,
        meta: { messaging_product: 'whatsapp', contacts: [{ input: '918698673161', wa_id: '918698673161' }], messages: [{ id: 'wamid.xxx' }] },
      });

      const bodyValues = [
        'Sarang', 'ABC Store', '22 Jan 2024', '5,00,000', '320', '1,560', '+8%', '+5%',
        '3.2', '950', '+0.4', '-3%', '28%', '+2%', '12', '-1%', '6%', '-0.5%', '98%', '+1%',
        'Revenue', '+8%', 'ROAS', '+0.4', 'Customer Retention', '-5%', 'RTO', '-1%',
      ];

      const res = await request(app)
        .post('/api/whatsapp/send-dynamic')
        .send({
          to: '918698673161',
          templateName: 'daily_business_insights',
          languageCode: 'en',
          components: { body: bodyValues },
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(mockSendTemplate).toHaveBeenCalledWith(
        '918698673161',
        'daily_business_insights',
        'en',
        expect.any(Array)
      );
      const components = mockSendTemplate.mock.calls[mockSendTemplate.mock.calls.length - 1][3];
      const bodyComp = components.find((c: { type: string }) => c.type === 'body');
      expect(bodyComp).toBeDefined();
      expect(bodyComp.parameters).toHaveLength(28);
      expect(bodyComp.parameters.map((p: { text: string }) => p.text)).toEqual(bodyValues);
    });
  });
});
