import express from "express";
import http from "http";
import strandHandler from "./cal";

const app = express();

app.use(strandHandler);

const port = process.env.PORT || "3000";

app.set("port", port);

const server = http.createServer(app);
server.listen(port, () => console.log(`Running on http://localhost:${port}`));
