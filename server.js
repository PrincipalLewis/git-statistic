var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');


/**
 * @namespace
 */
mysr = {};


/**
 * точка входа
 */
mysr.init = function() {
  mysr.startServer(mysr.router );
};


mysr.router = function(path, paylopad, response) {
  console.log(path);

  if (path === '/getHui') {
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain' });
    response.end("Sam Hui");
  }
};

/**
 * Server
 */
mysr.startServer = function(requestHandler) {
  var server = new http.Server();
  server.addListener('request', function(req, res) {
    var data = '';
    req.on('data', function(chunk) {
      data += chunk;
    });

    req.on('end', function() {
      var path = url.parse(req.url);
      requestHandler(path.pathname, data, res);
    });
  });

  server.listen(1337, '127.0.0.1');
};
mysr.init();
