"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = void 0;
const paystack_1 = require("../config/paystack");
const knexConfig_1 = require("../database/knexConfig");
const models_1 = require("../models");
const utils_1 = require("../utils");
const validators_1 = require("../validators");
const auth_service_1 = require("./auth.service");
const transaction_service_1 = require("./transaction.service");
class WalletService {
    constructor() {
        this.tableName = 'wallets';
    }
    createWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const walletId = yield this.generateWalletId();
            return yield (0, knexConfig_1.db)(this.tableName).insert({ userId, walletId });
        });
    }
    generateWalletId() {
        return __awaiter(this, void 0, void 0, function* () {
            const min = 19999999999;
            const max = 39999999999;
            while (true) {
                const walletId = Math.floor(Math.random() * (max - min + 1) + min);
                //check if generated id already belongs to a user
                const walletIdExist = yield (0, knexConfig_1.db)(this.tableName).where({ walletId }).first();
                if (!walletIdExist) {
                    return walletId;
                }
            }
        });
    }
    getWallet(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield (0, knexConfig_1.db)(this.tableName).where({ userId: user.id }).first();
            return {
                success: true,
                data: wallet,
                statusCode: 200,
            };
        });
    }
    //update user account name, number, and bank name
    updateWallet(params, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = (0, validators_1.validateAccountUpdate)(params);
            if (error)
                return {
                    error: true,
                    message: error.details[0].message,
                    statusCode: 400,
                };
            const { accountName, accountNo, bankName } = params;
            yield (0, knexConfig_1.db)(this.tableName).where({ userId: user === null || user === void 0 ? void 0 : user.id }).update({ accountName, accountNo, bankName });
            return { success: true, message: 'Account details successfully updated', statusCode: 200 };
        });
    }
    fundWallet(body, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = (0, validators_1.validatePayData)(body);
            if (error)
                return {
                    error: true,
                    message: error.details[0].message,
                    statusCode: 400,
                };
            const { amount } = body;
            if (amount < utils_1.minimumAmount)
                return {
                    error: true,
                    message: `Invalid transaction amount. Minimum #${utils_1.minimumAmount}`,
                    statusCode: 400,
                };
            const data = yield (0, paystack_1.initializePayment)({ email: user === null || user === void 0 ? void 0 : user.email, amount: amount * 100 });
            return {
                status: true,
                message: 'Payment successfully initialised',
                data,
                statusCode: 200,
            };
        });
    }
    //verify payment using paystack webhook
    webHookVerifyPyment(body) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = body;
            const email = (_a = data === null || data === void 0 ? void 0 : data.customer) === null || _a === void 0 ? void 0 : _a.email;
            // check if payment was successful
            if (email && (data === null || data === void 0 ? void 0 : data.status) === 'success') {
                // get user by email
                const user = yield auth_service_1.authService.findUserByEmail(email);
                if (user) {
                    const wallet = yield (0, knexConfig_1.db)(this.tableName).where({ userId: user.id }).first();
                    //update user wallet balance
                    yield (0, knexConfig_1.db)(this.tableName)
                        .where({ userId: user === null || user === void 0 ? void 0 : user.id })
                        .increment('balance', Math.floor((data === null || data === void 0 ? void 0 : data.amount) / 100));
                    //update wallet transaction history
                    yield this.saveTransactionHistory(models_1.TransactionType.CREDIT, Math.floor((data === null || data === void 0 ? void 0 : data.amount) / 100), user.id, wallet === null || wallet === void 0 ? void 0 : wallet.walletId, 'Bank', 'wallet');
                }
            }
        });
    }
    transferFunds(body, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = (0, validators_1.validatetransferPayload)(body);
            if (error)
                return {
                    error: true,
                    message: error.details[0].message,
                    statusCode: 400,
                };
            const { amount, walletId } = body;
            if (amount < utils_1.minimumAmount)
                return {
                    error: true,
                    message: `Invalid transaction amount. Minimum ${utils_1.minimumAmount}`,
                    statusCode: 400,
                };
            //validate sender wallet
            const userWallet = yield (0, knexConfig_1.db)(this.tableName).where({ userId: user.id }).first();
            if (!userWallet)
                return {
                    error: true,
                    message: 'Cannot make transfer from this account. Contact support team',
                    statusCode: 403,
                };
            //validate amount
            if (userWallet.balance < amount)
                return {
                    error: true,
                    message: 'Insufficient balance.',
                    statusCode: 400,
                };
            //validate receiver wallet
            const receiverWallet = yield (0, knexConfig_1.db)(this.tableName).where({ walletId }).first();
            if (!receiverWallet)
                return {
                    error: true,
                    message: 'Invalid wallet id.',
                    statusCode: 400,
                };
            if (receiverWallet.userId === user.id)
                return {
                    error: true,
                    message: 'Cannot transfer money to self',
                    statusCode: 400,
                };
            //top up receiver wallet
            yield (0, knexConfig_1.db)(this.tableName).where({ walletId }).increment('balance', amount);
            //remove amount from sender wallet
            yield (0, knexConfig_1.db)(this.tableName).where({ walletId: userWallet.walletId }).decrement('balance', amount);
            //update sender(user) wallet transaction history
            yield this.saveTransactionHistory(models_1.TransactionType.DEBIT, amount, user.id, userWallet === null || userWallet === void 0 ? void 0 : userWallet.walletId, 'me', `${receiverWallet.walletId}`);
            //update receiver wallet transaction history
            yield this.saveTransactionHistory(models_1.TransactionType.CREDIT, amount, receiverWallet.userId, receiverWallet === null || receiverWallet === void 0 ? void 0 : receiverWallet.walletId, `${userWallet.walletId}`, 'me');
            return { success: true, message: 'Transfer successful', statusCode: 200 };
        });
    }
    withdrawFunds(body, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = (0, validators_1.validateWithdrawalPayload)(body);
            if (error)
                return {
                    error: true,
                    message: error.details[0].message,
                    statusCode: 400,
                };
            const { amount } = body;
            if (amount < utils_1.minimumAmount)
                return {
                    error: true,
                    message: `Invalid transaction amount. Minimum ${utils_1.minimumAmount}`,
                    statusCode: 400,
                };
            const userWallet = yield (0, knexConfig_1.db)(this.tableName).where({ userId: user.id }).first();
            if (!userWallet)
                return {
                    error: true,
                    message: 'Cannot make withdrawals from this account. Contact support team',
                    statusCode: 403,
                };
            //validate amount
            if (userWallet.balance < amount)
                return {
                    error: true,
                    message: 'Insufficient balance.',
                    statusCode: 400,
                };
            if (!userWallet.bankName || !userWallet.accountName || !userWallet.accountNo)
                return {
                    error: true,
                    message: 'Account details (name, bank and number) must be provided before withdrawals.',
                    statusCode: 400,
                };
            //remove amount from wallet balance
            yield (0, knexConfig_1.db)(this.tableName).where({ walletId: userWallet.walletId }).decrement('balance', amount);
            this.demoTransferToBank(userWallet.bankName, userWallet.accountName, userWallet.accountNo);
            //update wallet transaction history
            yield this.saveTransactionHistory(models_1.TransactionType.DEBIT, amount, userWallet.userId, userWallet === null || userWallet === void 0 ? void 0 : userWallet.walletId, 'democredit', `${userWallet.bankName}-${userWallet.accountNo}-${userWallet.accountName}`);
            return { success: true, message: 'Withdrawal successful', statusCode: 200 };
        });
    }
    demoTransferToBank(bankName, accountName, accountNo) {
        return __awaiter(this, void 0, void 0, function* () {
            /***
             * Assumptiosn
             * ================
             * Transfer made to user bank account by admin, thus wallet debited and user bank account credited
             *
             * ***/
            return;
        });
    }
    saveTransactionHistory(type, amount, userId, walletId, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                type,
                amount,
                userId,
                walletId,
                from,
                to,
            };
            return yield transaction_service_1.transactionService.addTransaction(payload);
        });
    }
}
exports.walletService = new WalletService();
//# sourceMappingURL=wallet.service.js.map