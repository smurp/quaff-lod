"use strict";

const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;
/*
  It should be strai
// https://github.com/rdfjs/rdfxml-streaming-parser.js
const RdfXmlParser = require("rdfxml-streaming-parser").RdfXmlParser;
*/

let repost = function(type, dataFromParser) {
  //console.log(type, dataFromParser);
  self.postMessage({type: type, data: dataFromParser});
}

self.onmessage = function(event) {
  let url = event.data.url;
  var parser;
  if (url.endsWith('jsonld')) {
    parser = new JsonLdParser();
  } else {
    throw new Error(`Not yet handling ${url} just .jsonld`);
  }
   parser
    .on('context', (data) => {repost('context', data)})
    .on('data',    (data) => {self.postMessage(data)})
    .on('error',   (data) => {repost('error', data)})
    .on('end',     (data) => {repost('end', data)});
  fetch(url)
    // Until streaming is solved, do the whole response at one go.
    .then(response => response.text())
    .then(text => {
      parser.write(text);
      parser.end();
    })
    .catch(console.log);
  /*
    // TODO figure out how to feed a stream to the parser
    //   https://developer.mozilla.org/en-US/docs/Web/API/Body/body
    // Is the problem that parser.import expects a NodeJS EventEmitter?
    .then(response => response.body)
    .then(body => body.getReader())
    .then(stream => parser.import(stream))
  */
}

