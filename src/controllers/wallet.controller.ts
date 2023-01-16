import { Response } from 'express';
import { IRequest } from '../models';
import { walletService } from '../services';

class WalletController {
  //update user account name, number, and bank name
  async updateWalletInfo(req: IRequest, res: Response) {
    const { statusCode, ...response } = await walletService.updateWallet(req.body, req.user!);
    return res.status(statusCode || 200).json({ ...response });
  }

  //user funding their account
  async fundAccount(req: IRequest, res: Response) {
    const { statusCode, ...response } = await walletService.fundAccount(req.body, req.user!);
    return res.status(statusCode || 200).json({ ...response });
  }

  //verify payment upon successful funding of account
  async verifyPayment(req: IRequest, res: Response) {
    res.sendStatus(200);

    return await walletService.webHookVerifyPyment(req.body, req.user!);
  }
}

export const walletController = new WalletController();
