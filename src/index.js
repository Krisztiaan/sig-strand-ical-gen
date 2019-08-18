"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cal_1 = __importDefault(require("./cal"));
const app = express_1.default();
app.use(cal_1.default);
const port = process.env.PORT || "3000";
app.set("port", port);
const server = http_1.default.createServer(app);
server.listen(port, () => console.log(`Running on localhost:${port}`));
