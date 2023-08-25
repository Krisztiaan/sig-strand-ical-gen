"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strand_festival_2023_hu_json_1 = __importDefault(require("./strand-festival-2023-hu.json"));
const ical_generator_1 = __importStar(require("ical-generator"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const node_fetch_1 = __importDefault(require("node-fetch"));
let hits = 0;
let reqs = [];
const cMap = Object.entries(strand_festival_2023_hu_json_1.default.categories).reduce((acc, [k, v]) => {
    acc[parseInt(k, 10)] = v.title;
    return acc;
}, {});
const indexHtml = () => `
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
      "Segoe UI Symbol";
  }
  .myButton {
    -moz-box-shadow: 0px 3px 6px 0px;
    -webkit-box-shadow: 0px 3px 6px 0px;
    box-shadow: 0px 3px 6px 0px;
    background-color: #007dc1;
    -moz-border-radius: 28px;
    -webkit-border-radius: 28px;
    border-radius: 28px;
    margin: 6px;
    display: inline-block;
    cursor: pointer;
    color: #ffffff;
    font-size: 20px;
    font-weight: bold;
    padding: 16px 31px;
    text-decoration: none;
  }
  .myButton:hover {
    background-color: #0061a7;
  }
  .myButton:active {
    position: relative;
    top: 1px;
  }
</style>
<h2>Strand 2023 iCal v1.5 (${hits++})</h2>
<br/>
${Object.entries(cMap)
    .map(([k, v]) => `<a href="${k}" class="myButton">${v}</a>`)
    .join("<br/>")}
<br/>
<br/>
<b>Tipp:</b> új naptárként add hozzá, ne már létezőhöz, hogy ne keveredjen minden össze
<br/>
<b>Tipp:</b> a Google Calendar, és az Apple Calendar is el tudja rejteni az egyes naptárakat
`.trim();
const mc = { "2023": strand_festival_2023_hu_json_1.default };
const handleStrandJson = (parsedBody, category, url) => {
    const cal = (0, ical_generator_1.default)({
        url: `strand.perpixel.io${url}`,
        name: `Strand Fesztivál 2023 - ${cMap[category]}`,
        method: ical_generator_1.ICalCalendarMethod.REFRESH,
    });
    const programs = Object.values(parsedBody.programs);
    const fullPrograms = programs.map((program) => ({
        ...program,
        performer: {
            ...parsedBody.performers[program.performer],
            desc: parsedBody.performers[program.performer].desc,
        },
        place: program.place == 0
            ? { title: "Ismeretlen" }
            : parsedBody.places[program.place],
    }));
    console.log("typeof category", typeof category);
    const fullProgramsFiltered = fullPrograms.filter((ep) => ep.performer.category === category ||
        ep.performer.categories.includes(category));
    console.log("fullProgramsFiltered.length, fullPrograms.length", fullProgramsFiltered.length, fullPrograms.length);
    fullProgramsFiltered.forEach((p) => cal.createEvent({
        start: moment_timezone_1.default.tz(p.startDate, "Europe/Budapest").utc(),
        end: moment_timezone_1.default.tz(p.endDate, "Europe/Budapest").utc(),
        summary: p.performer.name,
        description: p.performer.desc
            .replace(/<br\s*\/?>/gm, "\n")
            .replace(/<p\s*\/?>/gm, "")
            .replace(/<\/p\s*\/?>/gm, ""),
        location: p.place.title,
    }));
    return cal;
};
const isValidCategory = (category) => !!cMap[category];
const handler = async (req, res) => {
    reqs.push({ url: req.url, meta: req.headers });
    const urlParts = req.url.split("/");
    let category = urlParts[urlParts.length - 1];
    try {
        category = parseInt(category, 10);
    }
    catch { }
    if (!isValidCategory(category)) {
        if (category === "logs") {
            res.writeHead(200, { "Content-Type": "text/json" });
            res.write(JSON.stringify(reqs));
            res.end();
            return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write(indexHtml());
        res.end();
        return;
    }
    const currDate = (0, moment_timezone_1.default)().format("YYYY-MM-DD");
    const currYear = currDate.split("-")[0];
    try {
        mc[currYear] =
            mc[currYear] ||
                (await (0, node_fetch_1.default)(`https://widget.sziget.hu/appmiral-data/strand-2022-hu.json?d=${currDate}`).then((r) => r.json()));
        const cal = handleStrandJson(mc[currYear], category, req.url);
        cal.serve(res);
    }
    catch (e) {
        console.error(`URL: https://widget.sziget.hu/appmiral-data/strand-2022-hu.json?d=${currDate}`, e);
        res.write(JSON.stringify(e));
        res.end();
    }
};
exports.default = handler;
