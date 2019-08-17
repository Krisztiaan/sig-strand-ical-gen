import strandData from "./strand-fesztival-2019-hu.json";
import ical from "ical-generator";
import moment from "moment";
import { writeFileSync, readFileSync } from "fs";
import http from "http";
import request from "request";

// const cal = ical({
//   domain: "strand.perpixel.io",
//   name: "Strand Fesztivál 2019",
//   method: "REFRESH"
// });

// const programs = Object.values(strandData.programs);

// const fullPrograms = programs.map(program => ({
//   ...program,
//   performer: {
//     ...(strandData.performers[
//       program.performer as any
//     ] as typeof strandData.performers[keyof typeof strandData.performers]),
//     desc:
//       strandData.categories[
//         (strandData.performers[
//           program.performer as any
//         ] as typeof strandData.performers[keyof typeof strandData.performers])
//           .category
//       ].title +
//       " - " +
//       (strandData.performers[
//         program.performer as any
//       ] as typeof strandData.performers[keyof typeof strandData.performers])
//         .desc
//   },
//   place:
//     program.place == "0"
//       ? { title: "Ismeretlen" }
//       : (strandData.places[
//           program.place as any
//         ] as typeof strandData.places[keyof typeof strandData.places])
// }));

// fullPrograms.forEach(p =>
//   cal.createEvent({
//     start: moment(p.startDate),
//     end: moment(p.endDate),
//     summary: p.performer.name,
//     description: p.performer.desc
//       .replace(/<br\s*\/?>/gm, "\n")
//       .replace(/<p\s*\/?>/gm, "")
//       .replace(/<\/p\s*\/?>/gm, ""),
//     htmlDescription: p.performer.desc,
//     location: p.place.title
//   })
// );

// writeFileSync("./strand-2019-v1.ical", cal.toString());

const cMap = {
  zene: "368",
  nappal: "369",
  civil: "370",
  csata: "372",
  kaland: "373"
};

http
  .createServer(function(req, res) {
    const category = req.url.replace("/", "");

    if (!(category in cMap)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(readFileSync("./index.html"));
      res.end();
      return;
    }
    request(
      `https://widget.szigetfestival.com/data/strand-fesztival-2019-hu.json?d=${moment().format(
        "YYYY-MM-DD"
      )}`,
      undefined,
      (e, resp, body) => {
        const parsedBody = JSON.parse(body.toString());
        try {
          const cal = ical({
            domain: `strand.perpixel.io${req.url}`,
            name: `Strand Fesztivál 2019 - ${
              parsedBody.categories[cMap[category]].title
            }`,
            method: "REFRESH"
          });

          const programs = Object.values(strandData.programs);

          const fullPrograms = programs
            .map(program => ({
              ...program,
              performer: {
                ...(strandData.performers[
                  program.performer as any
                ] as typeof strandData.performers[keyof typeof strandData.performers]),
                desc: (strandData.performers[
                  program.performer as any
                ] as typeof strandData.performers[keyof typeof strandData.performers])
                  .desc
              },
              place:
                program.place == "0"
                  ? { title: "Ismeretlen" }
                  : (strandData.places[
                      program.place as any
                    ] as typeof strandData.places[keyof typeof strandData.places])
            }))
            .filter(ep => ep.performer.category === cMap[category]);

          fullPrograms.forEach(p =>
            cal.createEvent({
              start: moment(p.startDate),
              end: moment(p.endDate),
              summary: p.performer.name,
              description: p.performer.desc
                .replace(/<br\s*\/?>/gm, "\n")
                .replace(/<p\s*\/?>/gm, "")
                .replace(/<\/p\s*\/?>/gm, ""),
              htmlDescription: p.performer.desc,
              location: p.place.title
            })
          );
          console.log(req.url);
          cal.serve(res);
        } catch (e) {
          console.error(e);
          res.write(JSON.stringify(e));
          res.end();
        }
      }
    );
  })
  .listen(3000, "127.0.0.1", function() {
    console.log("Server running at http://127.0.0.1:3000/");
  });
