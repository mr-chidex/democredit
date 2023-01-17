import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import config from '../config';
import { db } from '../database/knexConfig';
import { USER } from '../models';
import { JWTTOKEN } from '../models/auth.model';

class AuthMiddleware {
  async auth(req: Request | any, res: Response | any, next: NextFunction) {
    const { authorization } = req.headers;

    if (!authorization?.startsWith('Bearer'))
      return res.status(401).json({
        error: true,
        message: 'Unauthorized access: Invalid token format',
      });

    const token = authorization.replace('Bearer ', '');

    try {
      const decodeToken = jwt.verify(token, config.SECRET_KEY);

      const user = await db<USER>('users')
        .where({ id: (decodeToken as JWTTOKEN).userId })
        .first();

      if (!user) {
        return res.status(401).json({
          error: true,
          message: 'Unauthorized access: Account does not exist',
        });
      }

      req.user = user;

      next();
    } catch (error: any) {
      return res.status(400).json({
        error: true,
        message: error?.message,
      });
    }
  }
}

export const authMiddleware = new AuthMiddleware();
