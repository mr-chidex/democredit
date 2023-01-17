import { Err } from '../models';

export const errorResponse = (message: string, code: number) => {
  const error: Err = new Error(message);
  error.statusCode = code;
  throw error;
};
