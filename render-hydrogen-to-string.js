'use strict';

const assert = require('assert');
// const vm = require('vm');
const path = require('path');
const { readFile } = require('fs').promises;
const crypto = require('crypto');
const { parseHTML } = require('linkedom');

async function renderToString({ fromTimestamp, roomData, events, stateEventMap }) {
  const dom = parseHTML(`
    <!doctype html>
    <html>
      <head></head>
      <body>
        <div id="app" class="hydrogen"></div>
      </body>
    </html>
  `);

  if (!dom.requestAnimationFrame) {
    dom.requestAnimationFrame = function (cb) {
      setTimeout(cb, 0);
    };
  }

  // Define this for the SSR context
  dom.window.matrixPublicArchiveContext = {
    fromTimestamp,
    roomData,
    events,
    stateEventMap,
  };
  // Serialize it for when we run this again client-side
  dom.document.body.insertAdjacentHTML(
    'beforeend',
    `
    <script type="text/javascript">
      window.matrixPublicArchiveContext = ${JSON.stringify(dom.window.matrixPublicArchiveContext)}
    </script>
    `
  );

  global.requestAnimationFrame = function (cb) {
    setTimeout(cb, 0);
  };
  //const global = vm.createContext(dom);
  // Make the dom properties available in sub-`require(...)` calls
  global.window = dom.window;
  global.document = dom.document;
  global.Node = dom.Node;
  global.navigator = dom.navigator;
  global.DOMParser = dom.DOMParser;
  // // Make sure `webcrypto` exists since it was only introduced in Node.js v17
  // assert(crypto.webcrypto);
  // global.global.crypto = crypto.webcrypto;

  // // So require(...) works in the vm
  // global.global.require = require;
  // // So we can see logs from the underlying vm
  // global.global.console = console;

  const mount = require('./hydrogen-vm-render-script.js');
  await mount();

  // const hydrogenRenderScriptCode = await readFile(
  //   path.resolve(__dirname, './hydrogen-vm-render-script.js'),
  //   'utf8'
  // );
  // const hydrogenRenderScript = new vm.Script(hydrogenRenderScriptCode, {
  //   filename: 'hydrogen-vm-render-script.js',
  // });
  // const vmResult = hydrogenRenderScript.runInContext(global);
  // // Wait for everything to render
  // // (waiting on the promise returned from `hydrogen-render-script.js`)
  // await vmResult;

  const documentString = dom.document.body.toString();
  return documentString;
}

module.exports = renderToString;
