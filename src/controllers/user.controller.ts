import { Response } from 'express';
import { IRequest } from '../models';
import { userService } from '../services';

class UserController {
  async getUser(req: IRequest, res: Response) {
    const { statusCode, ...response } = await userService.getProfile(req.user!);
    return res.status(statusCode || 200).json({ ...response });
  }
}

export const userController = new UserController();
