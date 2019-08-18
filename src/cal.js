"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strand_fesztival_2019_hu_json_1 = __importDefault(require("../strand-fesztival-2019-hu.json"));
const ical_generator_1 = __importDefault(require("ical-generator"));
const moment_1 = __importDefault(require("moment"));
const node_fetch_1 = __importDefault(require("node-fetch"));
let hits = 0;
let reqs = [];
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
<h2>Strand 2019 iCal v1 (${hits++})</h2>
<br/>
<a href="./zene" class="myButton">zene</a>
<br/>
<a href="./nappal" class="myButton">nappal</a>
<br/>
<a href="./civil" class="myButton">civil * **</a>
<br/>
<a href="./csata" class="myButton">csata</a>
<br/>
<a href="./kaland" class="myButton">kaland</a>
<br/>
<br/>
<i>* A Strand által szolgáltatott file miatt
a 'civil' naptár más eseményeket is tartalmazhat 😅
<br/>
** Ezekhez a programokhoz nem adtak meg időpontokat,
így egész naposként kerülnek a fesztivál teljes idejére a naptárba</i>
<br/>
<br/>
<b>Tipp:</b> új naptárként add hozzá, ne már létezőhöz, hogy ne keveredjen minden össze
<br/>
<b>Tipp:</b> a Google Calendar, és az Apple Calendar is el tudja rejteni az egyes naptárakat
`.trim();
const cMap = {
    zene: 368,
    nappal: 369,
    civil: 370,
    csata: 372,
    kaland: 373
};
const mc = { "2019-08-15": strand_fesztival_2019_hu_json_1.default };
const handleStrandJson = (parsedBody, category, req, res) => {
    const cal = ical_generator_1.default({
        domain: `strand.perpixel.io${req.url}`,
        name: `Strand Fesztivál 2019 - ${parsedBody.categories[cMap[category]].title}`,
        method: "REFRESH"
    });
    const programs = Object.values(strand_fesztival_2019_hu_json_1.default.programs);
    const fullPrograms = programs.map(program => (Object.assign({}, program, { performer: Object.assign({}, strand_fesztival_2019_hu_json_1.default.performers[program.performer], { desc: strand_fesztival_2019_hu_json_1.default.performers[program.performer]
                .desc }), place: program.place == "0"
            ? { title: "Ismeretlen" }
            : strand_fesztival_2019_hu_json_1.default.places[program.place] })));
    const fullProgramsFiltered = fullPrograms.filter(ep => ep.performer.category == cMap[category]);
    fullProgramsFiltered.forEach(p => cal.createEvent({
        start: moment_1.default(p.startDate).toDate(),
        end: moment_1.default(p.endDate).toDate(),
        summary: p.performer.name,
        description: p.performer.desc
            .replace(/<br\s*\/?>/gm, "\n")
            .replace(/<p\s*\/?>/gm, "")
            .replace(/<\/p\s*\/?>/gm, ""),
        htmlDescription: p.performer.desc,
        location: p.place.title
    }));
    if (category === "civil") {
        const performers = Object.entries(strand_fesztival_2019_hu_json_1.default.performers);
        const linkedPerformers = {};
        programs.forEach(p => {
            linkedPerformers[p.performer] = true;
        });
        performers.forEach(([k, p]) => {
            if (!linkedPerformers[k]) {
                cal.createEvent({
                    start: moment_1.default("2019-08-20").toDate(),
                    end: moment_1.default("2019-08-24").toDate(),
                    allDay: true,
                    summary: p.name,
                    description: p.desc
                        .replace(/<br\s*\/?>/gm, "\n")
                        .replace(/<p\s*\/?>/gm, "")
                        .replace(/<\/p\s*\/?>/gm, ""),
                    htmlDescription: p.desc,
                    location: "Civil / egyéb"
                });
            }
        });
    }
    console.log(req.url);
    cal.serve(res);
};
const isValidCategory = (category) => category in cMap;
const handler = (req, res) => __awaiter(this, void 0, void 0, function* () {
    reqs.push({ url: req.url, meta: req.headers });
    const urlParts = req.url.split("/");
    const category = urlParts[urlParts.length - 1];
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
    const currDate = moment_1.default().format("YYYY-MM-DD");
    try {
        mc[currDate] =
            mc[currDate] ||
                (yield (yield node_fetch_1.default(`https://widget.szigetfestival.com/data/strand-fesztival-2019-hu.json?d=${currDate}`)).json());
        handleStrandJson(mc[currDate], category, req, res);
    }
    catch (e) {
        console.error(e);
        res.write(JSON.stringify(e));
        res.end();
    }
});
exports.default = handler;
