import { Request } from 'express';
import { USER } from './users.model';

export interface IRequest extends Request {
  user?: USER;
}
