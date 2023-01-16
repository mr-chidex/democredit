export interface WALLET {
  id?: string;
  walletId?: number;
  userId: string;
  balance?: number;
  bankName?: string;
  accountName?: string;
  accountNo?: string;
}

export interface PayData {
  email?: string;
  amount: number;
}
