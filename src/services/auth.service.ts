export class AuthService {
  async register(params: any) {
    return 'register';
  }

  async login(params: any) {
    return 'login';
  }
}

export const authService = new AuthService();
