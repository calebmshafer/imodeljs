/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
"use strict";

// The script parses api.md files, generated by the extract-api.js script (and subsequently the api-extractor.com tool), and extracts the high level API items
// into a csv format for easier review.

const path = require('path');
const argv = require("yargs").argv;
const fs = require("fs-extra");

if (undefined === argv.apiSignature) {
  console.log("Missing apiSignature argument.");
  return;
}

if (!fs.existsSync(argv.apiSignature)) {
  console.log("The api signature file does not exist.")
  return;
}

if (undefined === argv.outDir) {
  console.log("Missing outDir argument.");
  return;
}

fs.ensureDir(path.normalize(argv.outDir));

// create output file
const trimmedApiSignature = (argv.apiSignature.split('.'))[0];
const sigFileName = path.basename(path.normalize(trimmedApiSignature));
const sigFilePath = path.join(argv.outDir, sigFileName + ".exports.csv");
fs.createFileSync(sigFilePath);

const outputLines = [];
outputLines.push("sep=;");
outputLines.push("Release Tag;API Item");

// Open up the signature file

fs.readFile(argv.apiSignature, function (error, data) {
  if (error) { throw error; }

  let previousLines = [];
  data.toString().split("\n").forEach(function (line, index, arr) {
    if (index === arr.length - 1 && line === "") { return; }

    if (previousLines.length !== 0) {
      const matches = line.match(/export \S*\s(.*)(\s{|;)/);
      if (null !== matches) {
        const split = matches[1].split(/(<|extends|implements)/);
        for (const previousLine of previousLines)
          outputLines.push(`${previousLine};${split[0]}`);
      }

      previousLines = [];
      return;
    }

    let match = line.match(/\s@(beta|alpha|public|internal)/);
    if (null === match) {
      previousLines = [];
      return;
    }

    previousLines.push(match[1]);

    // handle deprecated separate since it can be used together with the other release tags
    match = line.match(/\s@(deprecated)/);
    if (null !== match) {
      previousLines.push(match[1]);
      return;
    }
  });

  fs.writeFileSync(sigFilePath, outputLines.join("\n"));
});
