const http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(`Hey Yo from iojs ${process.version}!\n`);
}).listen(process.env.port);
