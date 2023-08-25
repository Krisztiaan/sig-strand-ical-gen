import strandData from "./strand-festival-2023-hu.json";
import ical, { ICalCalendarMethod } from "ical-generator";
import moment from "moment-timezone";
import fetch from "node-fetch";
import { IncomingMessage, ServerResponse } from "http";
import { RequestHandler } from "express";
import { getEnabledCategories } from "trace_events";

let hits = 0;
let reqs = [];

const cMap = Object.entries(strandData.categories).reduce((acc, [k, v]) => {
  acc[parseInt(k, 10)] = v.title;
  return acc;
}, {} as { [k: number]: string });

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

const mc = { "2023": strandData } as const;

const handleStrandJson = (
  parsedBody: typeof strandData,
  category: keyof typeof cMap,
  url: string
) => {
  const cal = ical({
    url: `strand.perpixel.io${url}`,
    name: `Strand Fesztivál 2023 - ${cMap[category]}`,
    method: ICalCalendarMethod.REFRESH,
  });

  const programs = Object.values(parsedBody.programs);

  const fullPrograms = programs.map((program) => ({
    ...program,
    performer: {
      ...(parsedBody.performers[
        program.performer as any
      ] as (typeof parsedBody.performers)[keyof typeof parsedBody.performers]),
      desc: (
        parsedBody.performers[
          program.performer as any
        ] as (typeof parsedBody.performers)[keyof typeof parsedBody.performers]
      ).desc,
    },
    place:
      program.place == 0
        ? { title: "Ismeretlen" }
        : (parsedBody.places[
            program.place as any
          ] as (typeof parsedBody.places)[keyof typeof parsedBody.places]),
  }));

  console.log("typeof category", typeof category);
  const fullProgramsFiltered = fullPrograms.filter(
    (ep) =>
      ep.performer.category === category ||
      ep.performer.categories.includes(category)
  );

  console.log(
    "fullProgramsFiltered.length, fullPrograms.length",
    fullProgramsFiltered.length,
    fullPrograms.length
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

const isValidCategory = (
  category: string | number
): category is keyof typeof cMap => !!cMap[category];

const handler: RequestHandler = async (req, res) => {
  reqs.push({ url: req.url, meta: req.headers });
  const urlParts = req.url.split("/");
  let category: string | keyof typeof cMap = urlParts[urlParts.length - 1];
  try {
    category = parseInt(category, 10);
  } catch {}

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
  const currYear = currDate.split("-")[0];

  try {
    mc[currYear] =
      mc[currYear] ||
      ((await fetch(
        `https://widget.sziget.hu/appmiral-data/strand-2022-hu.json?d=${currDate}` // 2023 had data in 2022json
      ).then((r) => r.json())) as typeof strandData);

    const cal = handleStrandJson(mc[currYear], category, req.url);
    cal.serve(res);
  } catch (e) {
    console.error(
      `URL: https://widget.sziget.hu/appmiral-data/strand-2022-hu.json?d=${currDate}`, // 2023 had data in 2022json
      e
    );
    res.write(JSON.stringify(e));
    res.end();
  }
};

export default handler;
