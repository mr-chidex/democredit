import expressPromise from 'express-promise-router';
import config from '../config';

import { walletController } from '../controllers';
import { authMiddleware } from '../middlewares';

const router = expressPromise();

router.route('/').patch(authMiddleware.auth, walletController.updateWalletInfo);
router.route('/fund').post(authMiddleware.auth, walletController.fundWallet);

// endpoint for wallet funding payment verification and balance update hidden (for test use: '/webhook-verify')
router.route(config.WEBHOOK_URL).post(walletController.verifyPayment);

router.route('/transfers').post(authMiddleware.auth, walletController.transferFunds);

export const walletRoute = router;
