import bcrypt from 'bcrypt';

import { db } from '../database/knexConfig';
import { USER } from '../models';
import { validateLoginrParams, validateRegisterParams } from '../validators';

export class AuthService {
  async register(body: USER) {
    const { error, value } = validateRegisterParams(body);

    //check for errors in body data
    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    const { firstName, lastName, email, password } = value as USER;

    //make email lowercase
    const formattedEmail = this.formatEmail(email);

    //check if email is already in use
    const isEmail = await this.findUserByEmail(formattedEmail);
    if (isEmail) {
      return {
        error: true,
        message: 'Email already in use',
        statusCode: 400,
      };
    }

    //hash password
    const hashPassword = await this.hashPassword(password);

    const user = await db<USER>('users').insert({ firstName, lastName, password: hashPassword, email: formattedEmail });

    //on creating user, create wallet for user

    return {
      success: true,
      message: 'Account successfully created',
      statusCode: 201,
    };
  }

  async login(body: USER) {
    const { error, value } = validateLoginrParams(body);

    const { email, password } = value as USER;

    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    //transform email to lowercase
    const formattedEmail = this.formatEmail(email);

    //check if email is correct
    const user = await db<USER>('users').where({ email: formattedEmail }).first();
    if (!user)
      return {
        error: true,
        message: 'Email or Password is incorrect',
        statusCode: 400,
      };

    //check if password is correct
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword)
      return {
        error: true,
        message: 'Email or Password is incorrect',
        statusCode: 400,
      };

    //getToken

    return {
      statusCode: 200,
      data: null,
      user,
    };
  }

  async findUserByEmail(email: string) {
    return await db<USER>('users').where({ email }).first();
  }

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  formatEmail(email: string) {
    return email.toLowerCase();
  }
}

export const authService = new AuthService();
