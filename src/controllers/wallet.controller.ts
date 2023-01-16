import { Request, Response } from 'express';
import { IRequest } from '../models';
import { walletService } from '../services';

class WalletController {
  //update user account name, number, and bank name
  async updateWalletInfo(req: IRequest, res: Response) {
    const { statusCode, ...response } = await walletService.updateWallet(req.body, req.user!);
    return res.status(statusCode || 200).json({ ...response });
  }

  //user funding their wallet
  async fundWallet(req: IRequest, res: Response) {
    const { statusCode, ...response } = await walletService.fundWallet(req.body, req.user!);
    return res.status(statusCode || 200).json({ ...response });
  }

  //verify payment upon successful funding of account
  async verifyPayment(req: Request, res: Response) {
    await walletService.webHookVerifyPyment(req.body!);
    res.sendStatus(200);
  }
}

export const walletController = new WalletController();
