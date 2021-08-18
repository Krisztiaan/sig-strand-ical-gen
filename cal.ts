import strandData from "./strand-festival-2020-hu.json";
import ical, { ICalCalendarMethod } from "ical-generator";
import moment from "moment-timezone";
import fetch from "node-fetch";
import { IncomingMessage, ServerResponse } from "http";
import { RequestHandler } from "express";

let hits = 0;
let reqs = [];

const indexHtml = () =>
  `
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
<h2>Strand 2021 iCal v1 (${hits++})</h2>
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
  zene: 511,
  nappal: 512,
  csata: 515,
  kaland: 516,
};

const mc: { [key: string]: typeof strandData } = { "2021-08-18": strandData };

const handleStrandJson = (
  parsedBody: typeof strandData,
  category: keyof typeof cMap,
  url: string
) => {
  const cal = ical({
    url: `strand.perpixel.io${url}`,
    name: `Strand Fesztivál 2021 - ${
      parsedBody.categories[cMap[category]].title
    }`,
    method: ICalCalendarMethod.REFRESH,
  });

  const programs = Object.values(strandData.programs);

  const fullPrograms = programs.map((program) => ({
    ...program,
    performer: {
      ...(strandData.performers[
        program.performer as any
      ] as typeof strandData.performers[keyof typeof strandData.performers]),
      desc: (
        strandData.performers[
          program.performer as any
        ] as typeof strandData.performers[keyof typeof strandData.performers]
      ).desc,
    },
    place:
      program.place == "0"
        ? { title: "Ismeretlen" }
        : (strandData.places[
            program.place as any
          ] as typeof strandData.places[keyof typeof strandData.places]),
  }));
  const fullProgramsFiltered = fullPrograms.filter(
    (ep) => ep.performer.category == cMap[category]
  );

  fullProgramsFiltered.forEach((p) =>
    cal.createEvent({
      start: moment.tz(p.startDate, "Europe/Budapest").utc(),
      end: moment.tz(p.endDate, "Europe/Budapest").utc(),
      summary: p.performer.name,
      description: p.performer.desc
        .replace(/<br\s*\/?>/gm, "\n")
        .replace(/<p\s*\/?>/gm, "")
        .replace(/<\/p\s*\/?>/gm, ""),
      location: p.place.title,
    })
  );

  return cal;
};

const isValidCategory = (category: string): category is keyof typeof cMap =>
  category in cMap;

const handler: RequestHandler = async (req, res) => {
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
  const currDate = moment().format("YYYY-MM-DD");

  try {
    mc[currDate] =
      mc[currDate] ||
      ((await (
        await fetch(
          `https://widget.szigetfestival.com/data/strand-fesztival-2021-hu.json?d=${currDate}`
        )
      ).json()) as typeof strandData);
    const cal = handleStrandJson(mc[currDate], category, req.url);
    cal.serve(res);
  } catch (e) {
    console.error(e);
    res.write(JSON.stringify(e));
    res.end();
  }
};

export default handler;
