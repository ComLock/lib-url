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
    if (!string) { return {}; }
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
  static normalize(urlString, {
		defaultProtocol = 'http:',
		normalizeProtocol = true,
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
    function testParameter(name, filters) {
      return filters.some(filter => filter instanceof RegExp ? filter.test(name) : filter === name);
    }

    urlString = urlString.trim();

  	const hasRelativeProtocol = urlString.startsWith('//');
  	const isRelativeUrl = !hasRelativeProtocol && /^\.*\//.test(urlString);

  	// Prepend protocol
  	if (!isRelativeUrl) {
  		urlString = urlString.replace(/^(?!(?:\w+:)?\/\/)|^\/\//, defaultProtocol);
  	}

  	const urlObj = new URL(urlString);

  	if (forceHttp && forceHttps) {
  		throw new Error('The `forceHttp` and `forceHttps` cannot be used together');
  	}

  	if (forceHttp && urlObj.protocol === 'https:') {
  		urlObj.protocol = 'http:';
  	}

  	if (forceHttps && urlObj.protocol === 'http:') {
  		urlObj.protocol = 'https:';
  	}

  	// Remove auth
  	if (stripAuthentication) {
  		urlObj.user = '';
  		urlObj.password = '';
  	}

  	// Remove fragment
  	if (stripFragment) {
      urlObj.fragment = '';
  	}

  	// Remove duplicate slashes if not preceded by a protocol
  	if (urlObj.path) {
  		urlObj.path = urlObj.path.replace(/((?!:).|^)\/{2,}/g, (_, p1) => {
  			if (/^(?!\/)/g.test(p1)) {
  				return `${p1}/`;
  			}
  			return '/';
  		});
  	}

  	// Decode URI octets
  	if (urlObj.path) {
  		urlObj.path = decodeURI(urlObj.path);
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
  	if (hasRelativeProtocol && !normalizeProtocol) {
  		urlString = urlString.replace(/^http:\/\//, '//');
  	}

  	// Remove http/https
  	if (stripProtocol) {
  		urlString = urlString.replace(/^(?:https?:)?\/\//, '');
  	}

  	return urlString;
  } // normalize

  //────────────────────────────────────────────────────────────────────────────
  // Instance properties
  //────────────────────────────────────────────────────────────────────────────
  fragment = '';
  host = '';
  password = '';
  params = {};
  path = '';
  port = 80;
  protocol = '';
  user = '';

  //────────────────────────────────────────────────────────────────────────────
  // Public methods
  //────────────────────────────────────────────────────────────────────────────
  constructor(url) {
    this.parse(url);
  }

  parse(url) {
    const javaObj = BEAN.parse(url);
    this.fragment = javaObj.getRef() || ''; // getRef() can return null
    this.host = javaObj.getHost();
    this.path = javaObj.getPath() || '/'; // getPath() can return ''
    this.protocol = javaObj.getProtocol();
    const maybePort = javaObj.getPort(); // getPort() can return -1
    this.port = maybePort >= 0 ? maybePort : URL.portFromProtocol(this.protocol);
    this.params = URL.parseQueryString(javaObj.getQuery() || ''); // getQuery() can return null
    const userInfo = javaObj.getUserInfo() || ''; // getUserInfo() can return null
    //log.info(`userInfo:${toStr(userInfo)}`);
    const userInfoArr = userInfo.split(':');
    this.user = userInfoArr[0];
    this.password = userInfoArr[1];
    return this; // Chainable
  }

  hashCode = () => BEAN.parse(this.toString()).hashCode()

  normalize = (options) => URL.normalize(this.toString(), options)

  resolve = (path) => URL.resolve(this.toString(), path)

  //canStripPort = () => URL.canStripPort(this.protocol, this.port)

  toString() {
    const userInfo = `${this.user}${this.password ? `:${this.password}`: ''}`
    const query = URL.paramsToQueryString(this.params);
    return `${this.protocol}://${userInfo
      ? `${userInfo}@`
      : ''}${this.host}${URL.canStripPort(this.protocol, this.port)
        ? ''
        : `:${this.port}`}${this.path.startsWith('/')
          ? this.path
          : `/${this.path}`}${query
            ? `?${query}`
            : ''}${this.fragment
              ? `#${this.fragment}`
              : ''}`
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
