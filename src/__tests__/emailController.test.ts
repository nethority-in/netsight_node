import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// ESM: mock must be set up before any import of modules that use EmailService
const mockSend = jest.fn().mockResolvedValue({ ok: true, data: { success: true } } as unknown as never);
jest.unstable_mockModule('../services/emailService.ts', () => ({
  EmailService: {
    sendTemplate: mockSend,
    sendEmail: mockSend,
  },
}));

let app: Express;

beforeAll(async () => {
  const { default: emailRoutes } = await import('../routes/emailRoutes.ts');
  app = express();  
  app.use(express.json());
  app.use('/api/email', emailRoutes);
});

describe('EmailController', () => {
  describe('sendTemplate', () => {
    it('should return 400 if "to" is missing', async () => {
      const res = await request(app)
        .post('/api/email/send-template')
        .send({ templateName: 'daily_store_performance_summary' });

      expect(res.status).toBe(400);
      expect(res.body.error?.message).toMatch(/recipient email|"to".*required/);
    });

    it('should return 400 if {templateName} is missing', async () => {
      const res = await request(app)
        .post('/api/email/send-template')
        .send({ to: 'sarangc.nethority@gmail.com' });

      expect(res.status).toBe(400);
      expect(res.body.error?.message).toMatch(/templateName.*required/);
    });

    it('should call EmailService.sendTemplate if inputs are valid', async () => {
      const res = await request(app)
        .post('/api/email/send-template')
        .send({ to: 'sarangc.nethority@gmail.com', templateName: 'daily_store_performance_summary' });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });

  describe('sendEmail', () => {
    it('should return 400 if "to" is missing', async () => {
      const res = await request(app)
        .post('/api/email/send')
        .send({ subject: 'Hello', htmlContent: '<p>Test</p>' });

      expect(res.status).toBe(400);
      expect(res.body.error?.message).toMatch(/recipient email|"to".*required/);
    });

    it('should call EmailService.sendEmail if inputs are valid', async () => {
      const res = await request(app)
        .post('/api/email/send')
        .send({ to: 'sarangc.nethority@gmail.com', subject: 'Hello', htmlContent: '<p>Test</p>' });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });
});
