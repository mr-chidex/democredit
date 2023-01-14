import { Request, Response } from 'express';

import { authService } from '../services';

class AuthController {
  async register(req: Request, res: Response) {
    const { statusCode, ...response } = await authService.register(req.body);
    return res.status(statusCode || 201).json({ ...response });
  }

  async login(req: Request, res: Response) {
    // const { statusCode, ...response } = await authService.login(req.body);
    // return res.status(statusCode || 200).json({ ...response });
  }
}

export const authController = new AuthController();
