import { Request, Response } from 'express';
import { WALLET } from '../models';
import { walletService } from '../services';

class WalletController {
  //update user account name, number, and bank name
  async updateWalletInfo(req: Request, res: Response) {
    const { statusCode, ...response } = await walletService.updateWallet(req.body);
    return res.status(statusCode || 200).json({ ...response });
  }
}

export const walletController = new WalletController();
