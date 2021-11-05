"use strict";


const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;
const N3 = require("n3");
const RdfXmlParser = require("rdfxml-streaming-parser").RdfXmlParser;
const RDF_object = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";

let ext2args = { // mapping from extension to N3Parser format
  'trig':   'TriG',      // 'application/trig',
  'ttl':    'Turtle',    // 'application/ttl'
  'n3':     'Notation3', // 'text/n3', 'N3'
  'nt':     'N-Triples',
  'nq':     'N-Quads',
  'nquads': 'N-Quads',
  // not needed, but for completeness
  'jsonld': 'JSON-LD',
  'rdf':    'RDF',
  'xml':    'XML'
};
let extensions = '.' + Object.keys(ext2args).join('|.')

let repost = function(type, dataFromParser) {
  self.postMessage({type: type, data: dataFromParser});
}

// convert an N3 term to the same format as the jsonld and rdf terms
let convertN3Term = (term) => {
  var retval;
  if (!term) {
    return;
  }
  if (term.termType == 'NamedNode') {
    retval = {
      value: term.value
      //,datatype: RDF_object
    };
  } else if (term.termType == 'BlankNode') {
    retval = {
      value: term.value
    };
  } else if (term.termType == 'DefaultGraph') {
    //console.log("DefaultGraph term", term);
    retval = {
      value: term.value
    };
  } else if (term.termType == 'Literal') {
    retval = {
      value: term.value
    };
    retval.datatype = term.datatypeString;
    retval.language = term.language || '';
  } else {
    console.warn("term:", term);
    throw new Error(`unhandled termType: ${term.termType}`);
  }
  return retval;
};

let convertN3Quad = (quad) => {
  //console.table([quad]);
  return {
    subject: convertN3Term(quad.subject),
    predicate: convertN3Term(quad.predicate),
    object: convertN3Term(quad.object),
    graph: convertN3Term(quad.graph)
  };
};

let extractText = (response) => {
  if (response.status !== 200) {
    throw new Error(`${response.status} ${response.statusText}: ${response.url}`)
  }
  return response.text();
};

let repostError = (err) => {
  repost('error', err.toString());
};

self.onmessage = function(event) {
  /*
    Usage:
      worker.postMessage({url: aUri.toString()}); // load from a remote URL, ext selects parser
      OR
      worker.postMessage({ext: 'jsonld', data: data}); // load data, ext selects parser
   */
  let {
    action,
    url,
    ext, theDataToRead
  } = event.data;
  if (url && !ext) {
    let aUrl = new URL(url);
    ext = aUrl.pathname.split('.').pop();
  }

  if (['jsonld', 'rdf', 'xml'].includes(ext)) {
    // These parsers share architecture
    let parser;
    if (['jsonld'].includes(ext)) {
      parser = new JsonLdParser({});
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
    switch (action) {
    case 'fetchUrl':
      fetch(url)
      // Until streaming is solved, do the whole response at one go.
        .then(extractText)
        .then(text => {
          parser.write(text);
          parser.end();
        })
        .catch(repostError);
      break;
    case 'readData':
      parser.write(theDataToRead);
      parser.end();
      break;
    default:
      throw new Error(`action should be readData or fetchUrl`);
    }

  } else if (['nq', 'nquads', 'nt', 'n3','trig', 'ttl'].includes(ext)) {

    const n3Parser = new N3.Parser({
      format: ext2args[ext],
      baseIRI: url,
      documentIRI: url
    });

    let handleParse = (error, quad, prefixes) => {
      if (error) {
        throw new Error(error.toString());
        repost('error', error);
      }
      let q;
      if (quad) {
        //var o = quad.object;
        q = convertN3Quad(quad);
        self.postMessage(q);
      } else {
        repost('end',{})
      }
    }

    switch (action) {
    case 'fetchUrl':
      fetch(url)
      // Until streaming is solved, do the whole response at one go.
        .then(extractText)
        .then(text => {n3Parser.parse(text, handleParse)})
        .catch(repostError);
      break;
    case 'readData':
      n3Parser.parse(theDataToRead, handleParse);
      break;
    default:
      throw new Error(`action should be readData or fetchUrl`);
    }

  } else {
    throw new Error(`Not yet handling ${url} just ${extensions}`);
  }
}
