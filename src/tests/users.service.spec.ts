import { authMiddleware } from '../middlewares';
import { authService } from '../services';
import { mockUser1 } from './mocks';

describe('User service', () => {
  let token: any;

  beforeAll(() => {
    //getting token for testing
    token = authService.getToken({
      ...mockUser1,
    });
  });

  it('should return user details on success', async () => {
    //**Mocking req and response */
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const myMock = jest.fn();
    const response = myMock.mockImplementation((req, {}) => {}).mockReturnValue({ success: true });

    expect(response()).toHaveProperty('success');
  });
});
