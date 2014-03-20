var http = require('http'), https = require('https'), url = require('url');

/**
 * Parse options 
 * @param <object||string> options
 * @return object
 */
function parseOptions(options) {
  var result = {protocol: 'http:', options: {}, encoding: 'utf8'};
  if (typeof options == "string") {
    result.options = options;
    var urlComponent = url.parse(options);
    result.protocol = urlComponent.protocol; 
  } else if (typeof options == "object") {
    result.options = options;
    if (options.encoding && typeof options.encoding == "string") {
      result.encoding = options.encoding;  
    }
    if (options.url && typeof options.url == "string") {
      result.options = url.parse(options.url);
    }
    if (result.options.protocol) {
      result.protocol = result.options.protocol;
    }
  }
  return result;
}

exports.getHTML = function(options, callback, errCallback) {
  var options = parseOptions(options);
  var protocol = options.protocol == 'http:' ? http : https;
  protocol.get(options.options, function(res) {
    console.log("Got response: " + res.statusCode);
    res.setEncoding(options.encoding);
    var chunks = '';
    res.on('data', function (chunk) {
      chunks += chunk.toString();
    });
    res.on('end', function() {
      //console.log("Contents:", chunks);
      callback && callback(res.statusCode, chunks);
    });
  }).on('error', function(e) {
    console.log("Got error:" + e.message); 
    errCallback && errCallback(e);
  });

};
