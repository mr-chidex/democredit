import { db } from '../database/knexConfig';
import { WALLET } from '../models';

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
}

export const walletService = new WalletService();
