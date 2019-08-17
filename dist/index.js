"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var strand_fesztival_2019_hu_json_1 = __importDefault(require("./strand-fesztival-2019-hu.json"));
var ical_generator_1 = __importDefault(require("ical-generator"));
var moment_1 = __importDefault(require("moment"));
var fs_1 = require("fs");
var http_1 = __importDefault(require("http"));
var request_1 = __importDefault(require("request"));
var cMap = {
    zene: "368",
    nappal: "369",
    civil: "370",
    csata: "372",
    kaland: "373"
};
http_1["default"]
    .createServer(function (req, res) {
    var category = req.url.replace("/", "");
    if (!(category in cMap)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(fs_1.readFileSync("./index.html"));
        res.end();
        return;
    }
    request_1["default"]("https://widget.szigetfestival.com/data/strand-fesztival-2019-hu.json?d=" + moment_1["default"]().format("YYYY-MM-DD"), undefined, function (e, resp, body) {
        var parsedBody = JSON.parse(body.toString());
        try {
            var cal_1 = ical_generator_1["default"]({
                domain: "strand.perpixel.io" + req.url,
                name: "Strand Fesztiv\u00E1l 2019 - " + parsedBody.categories[cMap[category]].title,
                method: "REFRESH"
            });
            var programs = Object.values(strand_fesztival_2019_hu_json_1["default"].programs);
            var fullPrograms = programs
                .map(function (program) { return (__assign({}, program, { performer: __assign({}, strand_fesztival_2019_hu_json_1["default"].performers[program.performer], { desc: strand_fesztival_2019_hu_json_1["default"].performers[program.performer]
                        .desc }), place: program.place == "0"
                    ? { title: "Ismeretlen" }
                    : strand_fesztival_2019_hu_json_1["default"].places[program.place] })); })
                .filter(function (ep) { return ep.performer.category === cMap[category]; });
            fullPrograms.forEach(function (p) {
                return cal_1.createEvent({
                    start: moment_1["default"](p.startDate),
                    end: moment_1["default"](p.endDate),
                    summary: p.performer.name,
                    description: p.performer.desc
                        .replace(/<br\s*\/?>/gm, "\n")
                        .replace(/<p\s*\/?>/gm, "")
                        .replace(/<\/p\s*\/?>/gm, ""),
                    htmlDescription: p.performer.desc,
                    location: p.place.title
                });
            });
            console.log(req.url);
            cal_1.serve(res);
        }
        catch (e) {
            console.error(e);
            res.write(JSON.stringify(e));
            res.end();
        }
    });
})
    .listen(3000, "127.0.0.1", function () {
    console.log("Server running at http://127.0.0.1:3000/");
});
//# sourceMappingURL=index.js.map