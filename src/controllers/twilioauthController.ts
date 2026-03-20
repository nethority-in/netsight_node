import { Request, Response } from 'express';
import { register as doRegister, login as doLogin } from '../services/twilioauthService.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      ErrorHandler.sendValidationError(res, 'Username and password are required');
      return;
    }
    const result = await doRegister(String(username).trim(), String(password));
    if (result.ok) {
      res.status(201).json(result);
      return;
    }
    if ('alreadyExists' in result && result.alreadyExists) {
      res.status(409).json(result);
      return;
    }
    res.status('status' in result ? (result.status ?? 400) : 400).json(result);
  } catch (error) {
    ErrorHandler.sendErrorResponse(res, error, 'Registration failed', 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      ErrorHandler.sendValidationError(res, 'Username and password are required');
      return;
    }
    const result = await doLogin(String(username).trim(), String(password));
    if (result.ok) {
      res.status(200).json(result);
      return;
    }
    res.status(result.status ?? 401).json(result);
  } catch (error) {
    ErrorHandler.sendErrorResponse(res, error, 'Login failed', 500);
  }
}
