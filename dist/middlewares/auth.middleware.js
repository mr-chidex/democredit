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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const knexConfig_1 = require("../database/knexConfig");
class AuthMiddleware {
    auth(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { authorization } = req.headers;
            if (!(authorization === null || authorization === void 0 ? void 0 : authorization.startsWith('Bearer')))
                return res.status(401).json({
                    error: true,
                    message: 'Unauthorized access: Invalid token format',
                });
            const token = authorization.replace('Bearer ', '');
            if (!token)
                return res.status(401).json({
                    error: true,
                    message: 'Unauthorized access: Token not found',
                });
            try {
                const decodeToken = jsonwebtoken_1.default.verify(token, config_1.default.SECRET_KEY);
                const user = yield (0, knexConfig_1.db)('users')
                    .where({ id: decodeToken.userId })
                    .first();
                if (!user) {
                    return res.status(401).json({
                        error: true,
                        message: 'Unauthorized access: Account does not exist',
                    });
                }
                req.user = user;
                next();
            }
            catch (error) {
                return res.status(400).json({
                    error: true,
                    message: error === null || error === void 0 ? void 0 : error.message,
                });
            }
        });
    }
}
exports.authMiddleware = new AuthMiddleware();
//# sourceMappingURL=auth.middleware.js.map