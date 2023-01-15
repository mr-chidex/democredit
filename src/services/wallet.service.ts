import Joi from 'joi';
import { db } from '../database/knexConfig';
import { WALLET } from '../models';
import { validateAccountUpdate } from '../validators/wallet.validator';

class WalletService {
  async createWallet(userId: string) {
    const walletId = await this.generateWalletId();

    return await db<WALLET>('wallets').insert({ userId, walletId });
  }

  async generateWalletId() {
    const min = 19999999999;
    const max = 39999999999;

    while (true) {
      const walletId = Math.floor(Math.random() * (max - min + 1) + min);

      //check if generated id already belongs to a user
      const walletIdExist = await db<WALLET>('wallets').where({ walletId }).first();
      if (!walletIdExist) {
        return walletId;
      }
    }
  }

  async updateWallet(params: WALLET) {
    const { error, value } = validateAccountUpdate(params);

    //check for errors in body data
    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    //validate user ---

    const { accountName, accountNo, bankName } = value as WALLET;

    // await db<WALLET>('users').insert({ accountName, accountNo, bankName });

    return { success: true, message: 'Account successfully updated', data: null, statusCode: 200 };
  }
}

export const walletService = new WalletService();
