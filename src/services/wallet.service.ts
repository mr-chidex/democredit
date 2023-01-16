import { initializePayment } from '../config/paystack';
import { db } from '../database/knexConfig';
import { PayData, TransferPayload, USER, WALLET } from '../models';
import { minimumAmount } from '../utils';
import { validateAccountUpdate, validatePayData, validatetransferPayload } from '../validators';
import { authService } from './auth.service';

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

    return { success: true, message: 'Account details successfully updated', statusCode: 200 };
  }

  async fundWallet(body: PayData, user: USER) {
    const { error } = validatePayData(body);
    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    const { amount } = body;
    if (amount < minimumAmount)
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
  async webHookVerifyPyment(body: any) {
    const { data } = body;

    const email = data?.customer?.email;

    // check if payment was successful
    if (email && data?.status === 'success') {
      // get user by email
      const user = await authService.findUserByEmail(email);

      if (user) {
        const wallet = await db<WALLET>(this.tableName).where({ userId: user.id }).first();

        //update user wallet balance
        await db<WALLET>(this.tableName)
          .where({ id: wallet?.id })
          .update({ balance: wallet?.balance! + Math.floor(data?.amount / 100) });

        //update wallet transaction history
        // yet to do
      }
    }
  }

  async transferFunds(body: TransferPayload, user: USER) {
    const { error } = validatetransferPayload(body);
    if (error)
      return {
        error: true,
        message: error.details[0].message,
        statusCode: 400,
      };

    const { amount, walletId } = body;
    if (amount < minimumAmount)
      return {
        error: true,
        message: 'Invalid transaction amount',
        statusCode: 400,
      };

    const isUserWallet = await db<WALLET>(this.tableName).where({ userId: user.id }).first();

    if (isUserWallet?.walletId === walletId)
      return {
        error: true,
        message: 'Cannot transfer money to self',
        statusCode: 400,
      };
    const receiverWallet = await db<WALLET>(this.tableName).where({ userId: user.id }).first();

    await db<WALLET>(this.tableName)
      .where({ walletId })
      .update({ balance: receiverWallet?.balance! + amount });

    //update on transaction history
    //yet to do

    return { success: true, message: 'Amount successfully transfered', statusCode: 200 };
  }
}

export const walletService = new WalletService();
