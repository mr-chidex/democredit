import expressPromise from 'express-promise-router';

import { walletController } from '../controllers';

const router = expressPromise();

router.route('/').patch(walletController.updateWalletInfo);
router.route('/fund').post(walletController.fundAccount);

export const walletRoute = router;
