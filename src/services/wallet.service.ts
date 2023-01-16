import { initializePayment } from '../config/paystack';
import { db } from '../database/knexConfig';
import {
  AccountInfo,
  PayData,
  TRANSACTION,
  TransactionType,
  TransferPayload,
  USER,
  WALLET,
  WithdrawalPayload,
} from '../models';
import { minimumAmount } from '../utils';
import {
  validateAccountUpdate,
  validatePayData,
  validatetransferPayload,
  validateWithdrawalPayload,
} from '../validators';
import { authService } from './auth.service';
import { transactionService } from './transaction.service';

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

  async getWallet(user: USER) {
    const wallet = await db<WALLET>(this.tableName).where({ userId: user.id }).first();
    return {
      success: true,
      data: wallet,
      statusCode: 200,
    };
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
        message: `Invalid transaction amount. Minimum #${minimumAmount}`,
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
          .where({ userId: user?.id })
          .increment('balance', Math.floor(data?.amount / 100));

        //update wallet transaction history
        await this.saveTransactionHistory(
          TransactionType.CREDIT,
          Math.floor(data?.amount / 100),
          user.id!,
          wallet?.walletId!,
          'Bank',
          'wallet',
        );
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
        message: `Invalid transaction amount. Minimum ${minimumAmount}`,
        statusCode: 400,
      };

    //validate sender wallet
    const userWallet = await db<WALLET>(this.tableName).where({ userId: user.id }).first();
    if (!userWallet)
      return {
        error: true,
        message: 'Cannot make transfer from this account. Contact support team',
        statusCode: 403,
      };

    //validate amount
    if (userWallet.balance < amount)
      return {
        error: true,
        message: 'Insufficient balance.',
        statusCode: 400,
      };

    //validate receiver wallet
    const receiverWallet = await db<WALLET>(this.tableName).where({ walletId }).first();
    if (!receiverWallet)
      return {
        error: true,
        message: 'Invalid wallet id.',
        statusCode: 400,
      };

    if (receiverWallet.userId === user.id)
      return {
        error: true,
        message: 'Cannot transfer money to self',
        statusCode: 400,
      };

    //top up receiver wallet
    await db<WALLET>(this.tableName).where({ walletId }).increment('balance', amount);

    //remove amount from sender wallet
    await db<WALLET>(this.tableName).where({ walletId: userWallet.walletId }).decrement('balance', amount);

    //update sender(user) wallet transaction history
    await this.saveTransactionHistory(
      TransactionType.DEBIT,
      amount,
      user.id!,
      userWallet?.walletId!,
      'me',
      `${receiverWallet.walletId}`,
    );

    //update receiver wallet transaction history
    await this.saveTransactionHistory(
      TransactionType.CREDIT,
      amount,
      receiverWallet.userId,
      receiverWallet?.walletId!,
      `${userWallet.walletId}`,
      'me',
    );

    return { success: true, message: 'Transfer successful', statusCode: 200 };
  }

  async withdrawFunds(body: WithdrawalPayload, user: USER) {
    const { error } = validateWithdrawalPayload(body);
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
        message: `Invalid transaction amount. Minimum ${minimumAmount}`,
        statusCode: 400,
      };

    const userWallet = await db<WALLET>(this.tableName).where({ userId: user.id }).first();
    if (!userWallet)
      return {
        error: true,
        message: 'Cannot make withdrawals from this account. Contact support team',
        statusCode: 403,
      };

    //validate amount
    if (userWallet.balance < amount)
      return {
        error: true,
        message: 'Insufficient balance.',
        statusCode: 400,
      };

    if (!userWallet.bankName || !userWallet.accountName || !userWallet.accountNo)
      return {
        error: true,
        message: 'Account details (name, bank and number) must be provided before withdrawals.',
        statusCode: 400,
      };

    //remove amount from wallet balance
    await db<WALLET>(this.tableName).where({ walletId: userWallet.walletId }).decrement('balance', amount);

    this.demoTransferToBank(userWallet.bankName, userWallet.accountName, userWallet.accountNo);

    //update wallet transaction history
    await this.saveTransactionHistory(
      TransactionType.DEBIT,
      amount,
      userWallet.userId,
      userWallet?.walletId!,
      'democredit',
      `${userWallet.bankName}-${userWallet.accountNo}-${userWallet.accountName}`,
    );

    return { success: true, message: 'Withdrawal successful', statusCode: 200 };
  }

  async demoTransferToBank(bankName: AccountInfo, accountName: AccountInfo, accountNo: AccountInfo) {
    /***
     * Assumptiosn
     * ================
     * Transfer made to user bank account by admin, thus wallet debited and user bank account credited
     *
     * ***/
    return;
  }

  async saveTransactionHistory(
    type: TransactionType,
    amount: number,
    userId: string,
    walletId: number,
    from: string,
    to: string,
  ) {
    const payload: TRANSACTION = {
      type,
      amount,
      userId,
      walletId,
      from,
      to,
    };
    return await transactionService.addTransaction(payload);
  }
}

export const walletService = new WalletService();
