import { db } from '../database/knexConfig';
import { USER, WALLET } from '../models';
import { validateAccountUpdate } from '../validators/wallet.validator';

class WalletService {
  private tableName = 'wallets';

  async createWallet(userId: string) {
    const walletId = await this.generateWalletId();

    return await db<WALLET>(this.tableName).insert({ userId, walletId });
  }

  async generateWalletId() {
    const min = 19999999999;
    const max = 39999999999;

    while (true) {
      const walletId = Math.floor(Math.random() * (max - min + 1) + min);

      //check if generated id already belongs to a user
      const walletIdExist = await db<WALLET>(this.tableName).where({ walletId }).first();
      if (!walletIdExist) {
        return walletId;
      }
    }
  }

  //update user account name, number, and bank name
  async updateWallet(params: WALLET, user?: USER) {
    const { error, value } = validateAccountUpdate(params);

    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    const { accountName, accountNo, bankName } = value as WALLET;

    await db<WALLET>(this.tableName).where({ userId: user?.id }).update({ accountName, accountNo, bankName });

    return { success: true, message: 'Account successfully updated', statusCode: 200 };
  }

  async fundAccount(params: any) {
    return { success: true, message: 'successful', statusCode: 200 };
  }
}

export const walletService = new WalletService();
