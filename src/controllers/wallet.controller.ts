import { Request, Response } from 'express';
import { IRequest } from '../models';
import { walletService } from '../services';

class WalletController {
  //update user account name, number, and bank name
  async updateWalletInfo(req: IRequest, res: Response) {
    const { statusCode, ...response } = await walletService.updateWallet(req.body, req?.user);
    return res.status(statusCode || 200).json({ ...response });
  }

  async fundAccount(req: Request, res: Response) {
    const { statusCode, ...response } = await walletService.fundAccount(req.body);
    return res.status(statusCode || 200).json({ ...response });
  }
}

export const walletController = new WalletController();
