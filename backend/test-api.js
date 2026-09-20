const http = require('http');
http.get('http://localhost:5000/api/health', function(r) {
  var d = '';
  r.on('data', function(c) { d += c; });
  r.on('end', function() { console.log(d); process.exit(0); });
}).on('error', function(e) {
  console.error('ERROR: ' + e.message);
  process.exit(1);
});
