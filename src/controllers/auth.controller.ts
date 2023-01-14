import { Request, Response } from 'express';

import { authService } from '../services';

class AuthController {
  async register(req: Request, res: Response) {
    const response = await authService.register('test');
    return res.json({ authService: response });
  }

  async login(req: Request, res: Response) {
    return res.json({ authService: await authService.login('test') });
  }
}

export const authController = new AuthController();
