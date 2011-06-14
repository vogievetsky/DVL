var http = require('http');
http.createServer(function (req, res) {
  console.log(req.url);
  var get = req.url.split('?')[1] || '';
  var getParts = get.split('&');
  var got = {};
  for (var i=0; i < getParts.length; i++) {
    var s = getParts[i].split('=', 2);
    got[s[0]] = s[1];
  }
  console.log(got);
  setTimeout(function() {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    if (got.error) {
      res.end("POOOP");
    } else if (got.null) {
      res.end(got.callback + "(null);");
    } else {
      res.end(got.callback + "('" + got.value + "');");
    }
  }, parseInt(got.sleep) || 1);
}).listen(8900, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8900/');