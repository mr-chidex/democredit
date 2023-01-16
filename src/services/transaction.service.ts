import { db } from '../database/knexConfig';
import { TRANSACTION } from '../models';

class WalletTransactionService {
  private tableName = 'transaction_history';

  async addTransaction(payload: TRANSACTION) {
    return await db<TRANSACTION>(this.tableName).insert({ ...payload });
  }
}
export const transactionService = new WalletTransactionService();
