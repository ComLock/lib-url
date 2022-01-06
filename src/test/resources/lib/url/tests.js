var libTesting = require('/lib/xp/testing');
var assertEquals = libTesting.assertEquals;
var assertJson = libTesting.assertJson;

var libURl = require('/lib/url');
var URL = libURl.URL;

// https://github.com/garycourt/uri-js/blob/master/tests/tests.js

var MALFORMED = [{
  in: '//',
  error: {
      message: 'no protocol: //',
      class: {
        name: 'java.net.MalformedURLException'
      }
  }
},{
  in: 'https',
  error: {
      message: 'no protocol: https',
      class: {
        name: 'java.net.MalformedURLException'
      }
  }
},{
  in: 'https://:pasw',
  error: {
      message: 'Error at index 0 in: "pasw"',
      class: {
        name: 'java.net.MalformedURLException'
      }
  }
},{
  in: 'https://user:pasw',
  error: {
      message: 'Error at index 0 in: "pasw"',
      class: {
        name: 'java.net.MalformedURLException'
      }
  }
}]; // MALFORMED


var TESTS = [{
  in: 'ftp:',
  obj: {
    protocol: 'ftp'
  },
  serialized: 'ftp://',
  normalized: 'ftp://'
},{
  in: 'http:',
  obj: {
    protocol: 'http'
  },
  serialized: 'http://',
  normalized: 'http://'
},{
  in: 'https:',
  obj: {
    protocol: 'https'
  },
  serialized: 'https://',
  normalized: 'https://'
},{
  in: 'https:/',
  obj: {
    path: '/', // Unexpected
    protocol: 'https'
  },
  serialized: 'https:///',
  normalized: 'https:///'
},{
  in: 'https://',
  obj: {
    protocol: 'https'
  },
  serialized: 'https://'
},{
  in: 'https://:',
  obj: {
    protocol: 'https'
  },
  serialized: 'https://'
},{
  in: 'https://:@',
  obj: {
    protocol: 'https'
  },
  serialized: 'https://'
},{
  in: 'https://@',
  obj: {
    protocol: 'https'
  },
  serialized: 'https://'
},{
  in: 'https://user@',
  obj: {
    protocol: 'https',
    user: 'user'
  },
  serialized: 'https://user@'
},{
  in: 'https://user:@',
  obj: {
    protocol: 'https',
    user: 'user'
  },
  serialized: 'https://user@'
},{
  in: 'https://:pasw@',
  obj: {
    password: 'pasw',
    protocol: 'https'
  },
  serialized: 'https://:pasw@'
},{
  in: 'https://user:pasw@',
  obj: {
    password: 'pasw',
    protocol: 'https',
    user: 'user'
  },
  serialized: 'https://user:pasw@'
}/*,{
  in: 'https://www.example.com',
  obj: {
    host: 'www.example.com',
    protocol: 'https'
  },
  serialized: 'https://www.example.com'
},{
  in: 'https://www.example.com:80',
  obj: {
    host: 'www.example.com',
    port: 80,
    protocol: 'https'
  },
  serialized: 'https://www.example.com:80'
}*/]; // TESTS

// 'https://user:pasw@www.example.com:8080/path/file.extention?param1=value1&param2=value2#fragment'

var RESOLVE_TESTS = [{
  base: 'https://www.example.com',
  path: '/path',
  resolved: 'https://www.example.com/path'
}]; // RESOLVE_TESTS


function isNotSet(value) {
  return value === null || typeof value === 'undefined';
}


function assertThrows(fn, expected) {
  try {
    fn();
  } catch (actual) {
    if (isNotSet(expected)) { return true; }
    if (typeof actual !== typeof expected) { return false; }
    if (typeof actual === 'object') {
      if (actual.message !== expected.message) { return false; }
      // Enonic XP Java Errors:
      if (expected.class && expected.class.name) {
        if (actual.class
          && actual.class.name
          && actual.class.name === expected.class.name
        ) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    }
    if (actual === expected) { // type !Object
      return true;
    }
  }
  return false; // Doesn't throw
} // assertThrows


MALFORMED.forEach(function(m, i) {
  exports['testURIStaticParseMalformed' + i] = function() {
    assertThrows(function () {
      URL.parse(m.in)
    }, m.error);
  };
});

MALFORMED.forEach(function(m, i) {
  exports['testURIMethodParseMalformed' + i] = function() {
    assertThrows(function () {
      new URL(m.in)
    }, m.error);
  };
});

TESTS.forEach(function(t,i) {
  exports['testURIStaticParseValid' + i] = function() {
    assertJson(
      JSON.stringify(t.obj),
      JSON.stringify(URL.parse(t.in))
    );
  };
});

TESTS.forEach(function(t,i) {
  exports['testURIMethodParseValid' + i] = function() {
    assertJson(
      JSON.stringify(t.obj),
      JSON.stringify(new URL(t.in))
    );
  };
});

TESTS.forEach(function(t, i) {
  exports['testURIStaticSerialize' + i] = function() {
    assertEquals(
      t.serialized,
      URL.serialize(t.obj)
    );
  };
});

TESTS.forEach(function(t, i) {
  exports['testURIMethodSerialize' + i] = function() {
    assertEquals(
      t.serialized,
      new URL(t.in).serialize()
    );
  };
});

TESTS.forEach(function(t, i) {
  exports['testURIMethodToString' + i] = function() {
    assertEquals(
      t.serialized,
      new URL(t.in).toString()
    );
  };
});

RESOLVE_TESTS.forEach(function(t, i) {
  exports['testURIStaticResolve' + i] = function() {
    assertEquals(
      t.resolved,
      URL.resolve(t.base, t.path).toString()
    );
  }
});

RESOLVE_TESTS.forEach(function(t, i) {
  exports['testURIMethodResolve' + i] = function() {
    assertEquals(
      t.resolved,
      new URL(t.base).resolve(t.path).toString()
    );
  }
});

/*exports.testNormalize = function() {
  TESTS.forEach(function(t) {
    assertEquals(
      t.normalized,
      URL.normalize(t.in)
    );
    assertEquals(
      t.normalized,
      new URL(t.in).normalize()
    );
  });
};*/
