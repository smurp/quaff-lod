# quaff-lod

This is streaming Linked Open Data parser made available as a Web Worker.

It is just a very thin wrapper around these streaming LOD parsers

* https://github.com/rubensworks/jsonld-streaming-parser.js
* https://github.com/rdfjs/rdfxml-streaming-parser.js
* https://github.com/rdfjs/N3.js

This was motivated by the needs of https://github.com/smurp/huviz and https://github.com/smurp/nooron

## Usage:

```js
worker = new Worker('/node_modules/quaff-lod/quaff_lod_worker_bundle.js')
worker.addEventListener('message', trigger_callback); // a second listener for error and end
// then trigger execution with either
worker.postMessage({action: 'fetchUrl', url: 'http://example.com/truth.ttl'}); // ext, if not passed, is taken from url
// or something like
worker.postMessage({action: 'readData', ext: 'ttl', theDataToRead: ':s :p "helo wrld" .'});
// ext should be one of the supported: jsonld|n3|nt|nq|nquads|rdf|trig|ttl|xml
```

## Development

`npm run dev`

## Caveat

Although the parsers are streaming, a current issue is that this implementation is not :-/.

## All Hail

Thanks to Ruben and Ruben for their great parsers!

* https://www.rubensworks.net/blog/2019/03/13/streaming-rdf-parsers/
* https://ruben.verborgh.org/blog/2013/04/30/lightning-fast-rdf-in-javascript/

Thank you to CWRC and Pelagios for funding.
