import request from 'supertest';

import app from '../app';
import { authMiddleware } from '../middlewares';
import { authService } from '../services';
import { mockUser1 } from './mocks';

describe('Auth User Middleware', () => {
  let token: any;

  beforeAll(() => {
    //getting token for testing
    token = authService.getToken({
      id: '123',
      email: mockUser1.email,
      password: mockUser1.password,
      firstName: mockUser1.firstName,
      lastName: mockUser1.lastName,
    });
  });

  it('should return error if authorization header is not specified', async () => {
    //**Mocking req and res */
    const req = {
      headers: {
        authorization: '',
      },
    };

    const res = {
      status: () => {
        return {
          json: () => ({
            error: true,
            message: 'Invalid token format',
          }),
        };
      },
    };

    const response = await authMiddleware.auth(req, res, jest.fn());

    expect(response.error).toBe(true);
    expect(response.message).toContain('token format');
  });

  it('should return jwt malformed error message on invalid token', async () => {
    //**Mocking req and res */
    const req = {
      headers: {
        authorization: 'Bearer xyz',
      },
    };

    const res = {
      status: () => {
        return {
          json: () => ({
            error: true,
            message: 'jwt malformed',
          }),
        };
      },
    };

    const response = await authMiddleware.auth(req, res, jest.fn());
    expect(response.message).toBe('jwt malformed');
  });

  it('should be successful on passing valid token', async () => {
    //**Mocking req and res */
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {
      status: () => {
        return {
          json: () => ({
            success: true,
          }),
        };
      },
    };

    const response = await authMiddleware.auth(req, res, jest.fn());
    expect(response.success).toBe(true);
  });
});
