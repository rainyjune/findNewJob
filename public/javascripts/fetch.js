var http = require('http'),
    https = require('https');
    
exports.getHTML = function(options, onResult) {
  console.log("fetch::getHTML");
  var protocol = options.port == 443 ? https: http;
  var req = protocol.request(options, function(res) {
    var output = '';
    console.log(options.host + ':' + res.statusCode);
    res.setEncoding('utf8');
    
    res.on('data', function(chunk) {
      output += chunk;
    });
    
    res.on('end', function(){
      onResult(res.statusCode, output);
    });
  });
  
  req.on('error', function(err){
    console.log("error:", err.messaeg);
  });
  
  req.end();
};