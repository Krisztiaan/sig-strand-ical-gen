import strandData from "./strand-fesztival-2019-hu.json";
import ical from "ical-generator";
import moment from "moment";
import { writeFileSync } from "fs";

const cal = ical({ domain: "perpixel.io", name: "Strand Fesztivál 2019" });

const programs = Object.values(strandData.programs);

const fullPrograms = programs.map(program => ({
  ...program,
  performer: {
    ...(strandData.performers[
      program.performer as any
    ] as typeof strandData.performers[keyof typeof strandData.performers]),
    desc:
      strandData.categories[
        (strandData.performers[
          program.performer as any
        ] as typeof strandData.performers[keyof typeof strandData.performers])
          .category
      ].title +
      " - " +
      (strandData.performers[
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
}));

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

console.log(cal.toString());

writeFileSync("./strand-2019-v1.ical", cal.toString());
