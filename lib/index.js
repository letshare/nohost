const { createServer } = require('http');
const { passThrough, destroy } = require('./uiServer/util');
const handleRequest = require('./uiServer');
const { isUIRequest, resetAdmin } = require('./uiServer/storage');

const preventThrowOut = (req, res) => {
  const destroyAll = () => {
    if (req._hasError) {
      return;
    }
    req._hasError = true;
    destroy(req);
    destroy(res);
  };
  req.on('error', destroyAll);
  res.on('error', destroyAll);
};

module.exports = (options, cb) => {
  const { reset } = options;
  if (reset && reset !== 'none') {
    resetAdmin();
  }
  const server = createServer((req, res) => {
    preventThrowOut(req, res);
    if (isUIRequest(req)) {
      const { headers } = req;
      delete headers.referer;
      headers.host = 'local.whistlejs.com';
      handleRequest(req, res);
    } else {
      passThrough(req, res);
    }
  });
  const passDirect = (req, socket) => {
    preventThrowOut(req, socket);
    passThrough(req, socket);
  };
  server.on('upgrade', passDirect);
  server.on('connect', passDirect);
  server.listen(options.port, cb);
  return server;
};
