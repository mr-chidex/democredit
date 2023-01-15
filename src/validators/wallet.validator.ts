import Joi from 'joi';

import { WALLET } from '../models';

export const validateAccountUpdate = (updateParams: WALLET) => {
  return Joi.object({
    accountName: Joi.string().trim().required(),
    accountNo: Joi.string().trim().required(),
    bankName: Joi.string().required(),
  }).validate(updateParams);
};
