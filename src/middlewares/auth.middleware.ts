import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import config from '../config';
import { db } from '../database/knexConfig';
import { Err, USER } from '../models';
import { JWTTOKEN } from '../models/auth.model';
import { errorResponse } from '../utils';

class AuthMiddleware {
  async auth(req: Request | any, res: Response | any, next: NextFunction) {
    const { authorization } = req.headers;

    if (!authorization) {
      errorResponse('No authorization header', 401);
    }

    if (!authorization.includes('Bearer')) {
      errorResponse('Invalid token format', 401);
    }

    const token = authorization.replace('Bearer ', '');

    try {
      const decodeToken = jwt.verify(token, config.SECRET_KEY);

      const user = await db<USER>('users')
        .where({ id: (decodeToken as JWTTOKEN).userId })
        .first();

      if (!user) {
        const error: Err = new Error('Unauthorized access: Account does not exist');
        error.statusCode = 401;
        throw error;
      }

      req.user = user;

      next();
    } catch (err: any) {
      errorResponse(err.message, 401);
    }
  }
}

export const authMiddleware = new AuthMiddleware();
