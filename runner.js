const renderToString = require('./render-hydrogen-to-string');

(async () => {
  console.log(await renderToString({}));
})()
