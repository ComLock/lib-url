//import {toStr} from '/lib/util';


const BEAN = __.newBean('com.enonic.lib.MYURL');

const PROTOCOL_TO_PORT = {
  http: 80,
  https: 443,
  ftp: 21
};


export class URL {
  //────────────────────────────────────────────────────────────────────────────
  // Static class functions
  //────────────────────────────────────────────────────────────────────────────
  static parse(url) {
    log.info('before parse');
    const javaObj = BEAN.parse(url);
    log.info('after parse');

    const urlObj = {};

    urlObj.fragment = javaObj.getRef() || undefined; // getRef() can return null
    log.info(`fragment:${urlObj.fragment}`);

    urlObj.host = javaObj.getHost() || undefined;
    log.info(`host:${urlObj.host}`);

    urlObj.params = URL.parseQueryString(javaObj.getQuery()); // getQuery() can return null
    log.info(`params:${urlObj.params}`);

    const userInfo = javaObj.getUserInfo() || ''; // getUserInfo() can return null
    log.info(`userInfo:${userInfo}`);

    const userInfoArr = userInfo.split(':'); //log.info(`userInfo:${toStr(userInfo)}`);
    log.info(`userInfoArr:${userInfoArr}`);

    urlObj.password = userInfoArr[1] || undefined;
    log.info(`password:${urlObj.password}`);

    urlObj.path = javaObj.getPath() || undefined; // getPath() can return ''
    log.info(`path:${urlObj.path}`);

    const maybePort = javaObj.getPort(); // getPort() can return -1
    log.info(`maybePort:${maybePort}`);

    //urlObj.port = maybePort >= 0 ? maybePort : URL.portFromProtocol(urlObj.protocol);
    urlObj.port = maybePort === -1 ? undefined : maybePort; // // getPort() can return -1
    log.info(`port:${urlObj.port}`);

    urlObj.protocol = javaObj.getProtocol();
    log.info(`protocol:${urlObj.protocol}`);

    urlObj.user = userInfoArr[0] || undefined;
    log.info(`user:${urlObj.user}`);

    return urlObj;
  } // static parse


  static serialize(obj) {
    //log.info(`user:${obj.user}`);
    //log.info(`password:${obj.password}`);
    const userInfo = (obj.user || obj.password)
      ? `${obj.user||''}${obj.password ? `:${obj.password}`: ''}`
      : undefined;
    //log.info(`userInfo:${userInfo}`);
    //log.info(`params:${obj.params}`);
    const query = URL.paramsToQueryString(obj.params);
    //log.info(`query:${query}`);
    //log.info(`protocol:${obj.protocol}`);
    //log.info(`host:${obj.host}`);
    //log.info(`port:${obj.port}`);
    //log.info(`path:${obj.path}`);
    //log.info(`fragment:${obj.fragment}`);
    return `${obj.protocol}://${userInfo
      ? `${userInfo}@`
      : ''}${obj.host||''}${obj.port
        ? `:${obj.port}`
        : ''}${obj.path && typeof obj.path.startsWith === 'function' && !obj.path.startsWith('/')
          ? `/${obj.path}`
          : obj.path||''}${query
            ? `?${query}`
            : ''}${obj.fragment
              ? `#${obj.fragment}`
              : ''}`
  } // static serialize


  static addParam(
    params = {}, // Gets modified
    k,
    a = null
  ) {
    function __addSingle(v) {
      const decodedValue = v ? decodeURIComponent(v) : null;
      if (params.hasOwnProperty(k) && params[k] !== null) {
        if (!Array.isArray(params[k])) {
          params[k] = [params[k]];
        }
        params[k].push(decodedValue);
      } else {
        params[k] = decodedValue;
      }
    } // function __addSingle

    if (Array.isArray(a)) {
      a.forEach(v => __addSingle(v));
    } else {
      __addSingle(a);
    }
    //return params; // No need to return anythingm since params is modified.
  } // static addParam


  static parseQueryString(string = '') {
    if (!string) { return undefined; }
    const params = {};
    //log.info(`string:${toStr(string)}`);
    string.split('&').forEach(p => {
      const [k,v] = p.split('=');
      URL.addParam(params, k, v);
    });
    return params;
  }


  // k: null -> ?k
  // k: 0 -> ?k=0
  // k:[] -> ?
  // k:{} -> JSON.stringify({})
  // NOTE encodeURIComponent
  static paramsToQueryString(params) {
    if (!params) { return ''; }
    //return Object.entries(params).map(([k, a]) => {
    return Object.keys(params).sort().map(k => {
      const a = params[k];
      if (Array.isArray(a)) {
        return a.sort().map(v => `${k}${v ? `=${v}`: ''}`).join('&');
      } else {
        return `${k}${a ? `=${a}`: ''}`;
      }
    }).join('&');
  }


  static removeParam(
    params, // Gets modified
    key,
    value
  ) {
    if (value) {
      if (Array.isArray(params[key])) {
        let index = params[key].indexOf(value);
        if (index !== -1) { // Could also use >
          params[key].splice(index, 1); // splice changes the array
        }
      } else if (params[key] === value) {
        delete params[key];
      } else {
        log.warning(`Did not remove parameter ${key}, because it didn't match value:${value}!`);
      }
    } else {
      delete params[key];
    }
    //return params; // No need to return anythingm since params is modified.
  }

  static resolve = (baseUrl, path) => new URL(BEAN.resolve(baseUrl, path))

  static canStripPort(protocol, port) {
    return (
      (protocol === 'http' && port === 80)
      || (protocol === 'https' && port === 443)
      || (protocol === 'ftp' && port === 21)
    );
  }

  static portFromProtocol(protocol) {
    switch (protocol) {
      case 'http': return 80;
      case 'https': return 443;
      case 'ftp': return 21;
      default: return 80;
    }
  }

  // https://en.wikipedia.org/wiki/URL_normalization
  // Inspired by https://github.com/sindresorhus/normalize-url/blob/master/license
  // But limited by what java.net.URL can parse
  static normalize(urlString, {
		//defaultProtocol = 'http:',
		//normalizeProtocol = true,
		forceHttp = false,
		forceHttps = false,
		stripAuthentication = true,
		stripFragment = false,
    stripParams = false,
    stripProtocol = false,
		stripWWW = false,
		//removeQueryParameters: [/^utm_\w+/i],
		removeTrailingSlash = true,
		removeDirectoryIndex = false//,
		//sortQueryParameters: true,
	} = {}) {
    log.info(`urlString:${urlString}`);
    //if (!urlString) { return ''; }

    const urlObj = new URL(urlString);
    log.info(`urlObj:${toStr(urlObj)}`);

    function testParameter(name, filters) {
      return filters.some(filter => filter instanceof RegExp ? filter.test(name) : filter === name);
    }

    /*urlString = urlString.trim();
    log.info(`trimmed:${urlString}`);*/

  	/*const hasRelativeProtocol = urlString.startsWith('//');
    log.info(`hasRelativeProtocol:${hasRelativeProtocol}`);*/

  	/*const isRelativeUrl = !hasRelativeProtocol && /^\.*\//.test(urlString);
    log.info(`isRelativeUrl:${isRelativeUrl}`);

  	// Prepend protocol
  	if (!isRelativeUrl) {
  		urlString = urlString.replace(/^(?!(?:\w+:)?\/\/)|^\/\//, defaultProtocol);
      log.info(`protocolPrepended:${urlString}`);
  	}*/


  	if (forceHttp && forceHttps) {
  		throw new Error('The `forceHttp` and `forceHttps` cannot be used together');
  	}

  	if (forceHttp && urlObj.protocol === 'https:') {
  		urlObj.protocol = 'http:';
      log.info(`forceHttp:${urlObj}`);
  	}

  	if (forceHttps && urlObj.protocol === 'http:') {
  		urlObj.protocol = 'https:';
      log.info(`forceHttps:${urlObj}`);
  	}

  	// Remove auth
  	if (stripAuthentication) {
  		urlObj.user = '';
  		urlObj.password = '';
      log.info(`stripAuthentication:${urlObj}`);
  	}

  	// Remove fragment
  	if (stripFragment) {
      urlObj.fragment = '';
      log.info(`stripFragment:${urlObj}`);
  	}

  	// Remove duplicate slashes if not preceded by a protocol
  	if (urlObj.path) {
  		urlObj.path = urlObj.path.replace(/((?!:).|^)\/{2,}/g, (_, p1) => {
  			if (/^(?!\/)/g.test(p1)) {
  				return `${p1}/`;
  			}
  			return '/';
  		});
      log.info(`duplicatedSlashedRemoved:${urlObj}`);
  	}

  	// Decode URI octets
  	if (urlObj.path) {
  		urlObj.path = decodeURI(urlObj.path);
      log.info(`decoded:${urlObj}`);
  	}

  	// Remove directory index
  	if (removeDirectoryIndex === true) {
  		removeDirectoryIndex = [/^index\.[a-z]+$/];
  	}

  	if (Array.isArray(removeDirectoryIndex) && removeDirectoryIndex.length > 0) {
  		let pathComponents = urlObj.path.split('/');
  		const lastComponent = pathComponents[pathComponents.length - 1];

  		if (testParameter(lastComponent, removeDirectoryIndex)) {
  			pathComponents = pathComponents.slice(0, pathComponents.length - 1);
  			urlObj.path = pathComponents.slice(1).join('/') + '/';
  		}
  	}

  	if (urlObj.host) {
  		// Remove trailing dot
  		urlObj.host = urlObj.host.replace(/\.$/, '');

  		// Remove `www.`
  		if (stripWWW && /^www\.([a-z\-\d]{2,63})\.([a-z.]{2,5})$/.test(urlObj.host)) {
  			// Each label should be max 63 at length (min: 2).
  			// The extension should be max 5 at length (min: 2).
  			// Source: https://en.wikipedia.org/wiki/Hostname#Restrictions_on_valid_host_names
  			urlObj.host = urlObj.host.replace(/^www\./, '');
  		}
  	}

    if (stripParams) {
      urlObj.params = {};
    }

  	// Remove query unwanted parameters
  	/*if (Array.isArray(removeQueryParameters)) {
  		for (const key of [...urlObj.searchParams.keys()]) {
  			if (testParameter(key, removeQueryParameters)) {
  				urlObj.searchParams.delete(key);
  			}
  		}
  	}*/

  	// Sort query parameters
  	/*if (sortQueryParameters) {
  		urlObj.searchParams.sort();
  	}*/

  	if (removeTrailingSlash) {
  		urlObj.path = urlObj.path.replace(/\/$/, '');
  	}

  	urlString = urlObj.toString();

  	// Remove ending `/`
  	if ((removeTrailingSlash || urlObj.path === '/') && urlObj.fragment === '') {
  		urlString = urlString.replace(/\/$/, '');
  	}

  	// Restore relative protocol, if applicable
  	/*if (hasRelativeProtocol && !normalizeProtocol) {
  		urlString = urlString.replace(/^http:\/\//, '//');
  	}*/

  	// Remove http/https
  	if (stripProtocol) {
  		urlString = urlString.replace(/^(?:https?:)?\/\//, '');
  	}

  	return urlString;
  } // normalize


  //────────────────────────────────────────────────────────────────────────────
  // Public methods
  //────────────────────────────────────────────────────────────────────────────
  constructor(url) {
    log.info('constructor start');
    this.parse(url);
    log.info('constructor end');
  }

  parse(url) {
    Object.entries(URL.parse(url)).forEach(([k,v]) => {
      this[k] = v;
    });
    return this; // Chainable
  }

  hashCode = () => BEAN.parse(this.toString()).hashCode()

  normalize = (options) => URL.normalize(this.toString(), options)

  resolve = (path) => URL.resolve(this.toString(), path)

  //canStripPort = () => URL.canStripPort(this.protocol, this.port)

  serialize() {
    return URL.serialize(this);
  }

  toString() {
    return URL.serialize(this);
  }

  addParam(key, value) {
    URL.addParam(this.params, key, value);
    return this; // Chainable
  }

  removeParam(key, value) {
    URL.removeParam(this.params, key, value);
    return this; // Chainable
  }

} // class URL
