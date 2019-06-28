"use strict";

const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;
const N3 = require("n3");
const RdfXmlParser = require("rdfxml-streaming-parser").RdfXmlParser;

let repost = function(type, dataFromParser) {
  self.postMessage({type: type, data: dataFromParser});
}

let ext2args = {
  'trig':   'TriG',      // 'application/trig',
  'ttl':    'Turtle',    // 'application/ttl'
  'n3':     'Notation3', // 'text/n3', 'N3'
  'nt':     'N-Triples',
  'nq':     'N-Quads',
  'nquads': 'N-Quads'
};

self.onmessage = function(event) {
  let url = event.data.url;
  let aUrl = new URL(url);
  let ext = aUrl.pathname.split('.').pop();
  let parserArgs = {};
  var parser;

  if (['jsonld', 'rdf', 'xml'].includes(ext)) {
    if (['jsonld'].includes(ext)) {
      parser = new JsonLdParser(parserArgs);
    } else if (['rdf', 'xml'].includes(ext)) {
      parser = new RdfXmlParser();
    }
    parser
      .on('context', (data) => {repost('context', data)})
      .on('data',    (data) => {self.postMessage(data)})
      .on('error',   (data) => {repost('error', data)})
      .on('end',     (data) => {repost('end', data)});
    /*
      // TODO figure out how to feed a stream to the parser
      //   https://developer.mozilla.org/en-US/docs/Web/API/Body/body
      // Is the problem that parser.import expects a NodeJS EventEmitter?
      .then(response => response.body)
      .then(body => body.getReader())
      .then(stream => parser.import(stream))
    */
    fetch(url)
      // Until streaming is solved, do the whole response at one go.
      .then(response => response.text())
      .then(text => {
        parser.write(text);
        parser.end();
      })
      .catch(console.error);
  } else if (['nq', 'nquads', 'nt', 'n3','trig', 'ttl'].includes(ext)) {
    parserArgs = ext2args[ext];
    parser = new N3.Parser(parserArgs);

    fetch(url)
    // Until streaming is solved, do the whole response at one go.
      .then(response => response.text())
      .then(text => {
        parser.parse(text, (error, quad, prefixes) => {
          if (error) {
            repost('error', error);
          }
          if (quad) {
            self.postMessage(quad);
          } else {
            repost('end',{})
          }
        })
      })
      .catch(console.error);

  } else {
    throw new Error(`Not yet handling ${url} just .jsonld`);
  }
}

