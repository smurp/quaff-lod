"use strict";

const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;


let repost = function(type, dataFromParser) {
  //console.log(type, dataFromParser);
  self.postMessage({type: type, data: dataFromParser});
}
let parser = new JsonLdParser();
let consumeStream = function({done, value}){
};
let fetchSuccess = function(response) {
  console.log(response);

  let drink = ({done, value}) => {
    console.info("whatWhat.keys()",Object.keys(whatWhat));
    if (done) {
      
    }
    console.log("value:", value);
                
    parser.import(value).
      on('context', (data) => {repost('context', data)}).
      on('data',    (data) => {repost('data', data)}).
      on('error',   (data) => {repost('error', data)}).
      on('end',     (data) => {repost('end', data)});
  };

  let guzzle = function(reader) {
    let parser = new JsonLdParser();
    //    reader.on = console.log;
    console.log('reader keys():', Object.keys(reader))
    parser.import(reader.data).
      on('context', (data) => {repost('context', data)}).
      on('data',    (data) => {repost('data', data)}).
      on('error',   (data) => {repost('error', data)}).
      on('end',     (data) => {repost('end', data)});
  }
  /*
  response.text().then(function(text) {
    console.log("response.text",text);
  });
  */
  //response.body.text.then((data) => console.log(data)).catch(console.log);
  //console.log("body.text()",
  // https://developer.mozilla.org/en-US/docs/Web/API/Body/body
  let reader = response.body.getReader();
  reader.read().then(guzzle).catch(console.warn);
}

self.onmessage = function(event) {
  console.log("Worker",event);
  let url = event.data.url;
  fetch(url).then(fetchSuccess).catch(console.log);
  //self.postMessage('sweet jaysus: '+Object.keys(parser).join(', '));
  //self.postMessage(event.data)
}

