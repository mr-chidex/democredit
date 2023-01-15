import expressPromise from 'express-promise-router';

import { walletController } from '../controllers';

const router = expressPromise();

router.route('/').patch(walletController.updateWalletInfo);

export const walletRoute = router;
