import { initializePayment } from '../config/paystack';
import { db } from '../database/knexConfig';
import { PayData, USER, WALLET } from '../models';
import { validateAccountUpdate, validatePayData } from '../validators';

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
  async updateWallet(params: WALLET, user: USER) {
    const { error } = validateAccountUpdate(params);
    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    const { accountName, accountNo, bankName } = params;

    await db<WALLET>(this.tableName).where({ userId: user?.id }).update({ accountName, accountNo, bankName });

    return { success: true, message: 'Account successfully updated', statusCode: 200 };
  }

  async fundAccount(body: PayData, user: USER) {
    const { error } = validatePayData(body);
    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    const { amount } = body;
    if (amount <= 0)
      return {
        error: true,
        message: 'Invalid transaction amount',
        statusCode: 400,
      };

    const data = await initializePayment({ email: user?.email, amount: amount * 100 });

    return {
      status: true,
      message: 'Payment successfully initialised',
      data,
      statusCode: 200,
    };
  }

  //verify payment using paystack webhook
  async webHookVerifyPyment(body: any, user: USER) {}
}

export const walletService = new WalletService();
