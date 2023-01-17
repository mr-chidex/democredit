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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const services_1 = require("../services");
class AuthController {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = yield services_1.authService.register(req.body), { statusCode } = _a, response = __rest(_a, ["statusCode"]);
            return res.status(statusCode || 201).json(Object.assign({}, response));
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = yield services_1.authService.login(req.body), { statusCode } = _a, response = __rest(_a, ["statusCode"]);
            return res.status(statusCode || 200).json(Object.assign({}, response));
        });
    }
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map