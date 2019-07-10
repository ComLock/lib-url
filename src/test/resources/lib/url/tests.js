var libTesting = require('/lib/xp/testing');
var assertEquals = libTesting.assertEquals;


var libURl = require('/lib/url');
var URL = libURl.URL;


exports.testParse = function() {
  assertEquals(
    'https://user:pasw@www.example.com:8080/path/file.extention?param1=value1&param2=value2#fragment',
    new URL('https://user:pasw@www.example.com:8080/path/file.extention?param1=value1&param2=value2#fragment').toString()
  );
};


exports.testResolve = function() {
  var urlObj = new URL('https://www.example.com');
  assertEquals(
    'https://www.example.com/path',
    urlObj.resolve('/path').toString()
  );
};


exports.testNormalize = function() {
  var urlObj = new URL('https://www.example.com./?k=v#f');
  assertEquals(
    'https://example.com',
    urlObj.normalize()
  );
};
