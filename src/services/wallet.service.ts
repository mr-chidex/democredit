import { db } from '../database/knexConfig';
import { WALLET } from '../models';

class WalletService {
  async createWallet(userId: string) {
    const walletId = await this.generateWalletId();

    const wallet = await db<WALLET>('wallets').insert({ userId, walletId });

    return wallet;
  }

  async generateWalletId() {
    const min = 19999999999;
    const max = 39999999999;

    let walletId = Math.floor(Math.random() * (max - min + 1) + min);

    //check if generated id already belongs to a user
    while (true) {
      const walletIdExist = await db<WALLET>('wallets').where({ walletId }).first();
      if (!walletIdExist) {
        return walletId;
      }
      walletId = Math.floor(Math.random() * (max - min + 1) + min);
    }
  }
}

export const walletService = new WalletService();
