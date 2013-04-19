
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("RedVentures-reduce/index.js", function(exports, require, module){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
});
require.register("visionmedia-superagent/lib/client.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pairs.push(encodeURIComponent(key)
      + '=' + encodeURIComponent(obj[key]));
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(xhr, options) {
  options = options || {};
  this.xhr = xhr;
  this.text = xhr.responseText;
  this.setStatusProperties(xhr.status);
  this.header = this.headers = parseHeader(xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.parseBody(this.text);
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var msg = 'got ' + this.status + ' response';
  var err = new Error(msg);
  err.status = this.status;
  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.set('X-Requested-With', 'XMLHttpRequest');
  this.on('end', function(){
    var res = new Response(self.xhr);
    if ('HEAD' == method) res.text = null;
    self.callback(null, res);
  });
}

/**
 * Inherit from `Emitter.prototype`.
 */

Request.prototype = new Emitter;
Request.prototype.constructor = Request;

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  this._query.push(val);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._data;

  // store callback
  this._callback = fn || noop;

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture || false);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-matches-selector/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var query = require('query');

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

});
require.register("component-delegate/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var matches = require('matches-selector')
  , event = require('event');

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    if (matches(e.target, selector)) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

});
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');
  
  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) throw new Error('No elements were generated.');
  var tag = m[1];
  
  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return [el.removeChild(el.lastChild)];
  }
  
  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  return orphan(el.children);
}

/**
 * Orphan `els` and return an array.
 *
 * @param {NodeList} els
 * @return {Array}
 * @api private
 */

function orphan(els) {
  var ret = [];

  while (els.length) {
    ret.push(els[0].parentNode.removeChild(els[0]));
  }

  return ret;
}

});
require.register("component-classes/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var arr = this.el.className.split(re);
  if ('' === arr[0]) arr.pop();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("component-css/index.js", function(exports, require, module){

/**
 * Properties to ignore appending "px".
 */

var ignore = {
  columnCount: true,
  fillOpacity: true,
  fontWeight: true,
  lineHeight: true,
  opacity: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true
};

/**
 * Set `el` css values.
 *
 * @param {Element} el
 * @param {Object} obj
 * @return {Element}
 * @api public
 */

module.exports = function(el, obj){
  for (var key in obj) {
    var val = obj[key];
    if ('number' == typeof val && !ignore[key]) val += 'px';
    el.style[key] = val;
  }
  return el;
};

});
require.register("component-sort/index.js", function(exports, require, module){

/**
 * Expose `sort`.
 */

exports = module.exports = sort;

/**
 * Sort `el`'s children with the given `fn(a, b)`.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api public
 */

function sort(el, fn) {
  var arr = [].slice.call(el.children).sort(fn);
  var frag = document.createDocumentFragment();
  for (var i = 0; i < arr.length; i++) {
    frag.appendChild(arr[i]);
  }
  el.appendChild(frag);
};

/**
 * Sort descending.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api public
 */

exports.desc = function(el, fn){
  sort(el, function(a, b){
    return ~fn(a, b) + 1;
  });
};

/**
 * Sort ascending.
 */

exports.asc = sort;

});
require.register("component-value/index.js", function(exports, require, module){

/**
 * Set or get `el`'s' value.
 *
 * @param {Element} el
 * @param {Mixed} val
 * @return {Mixed}
 * @api public
 */

module.exports = function(el, val){
  if (2 == arguments.length) return set(el, val);
  return get(el);
};

/**
 * Get `el`'s value.
 */

function get(el) {
  switch (type(el)) {
    case 'checkbox':
      return el.getAttribute('checked') == 'checked'
        ? null == el.getAttribute('value')
          ? true
          : el.getAttribute('value')
        : false;
    default:
      return el.value;
  }
}

/**
 * Set `el`'s value.
 */

function set(el, val) {
  switch (type(el)) {
    case 'checkbox':
      if (val) {
        el.setAttribute('checked', 'checked');
      } else {
        el.removeAttribute('checked');
      }
      break;
    case 'input':
      el.setAttribute('value', val);
      break;
    default:
      el.value = val;
  }
}

/**
 * Element type.
 */

function type(el) {
  var name = el.nodeName.toLowerCase();
  if ('input' == name && 'checkbox' == el.getAttribute('type')) return 'checkbox';
  return name.toLowerCase();
}

});
require.register("component-query/index.js", function(exports, require, module){

function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
};

});
require.register("component-dom/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var delegate = require('delegate');
var classes = require('classes');
var indexof = require('indexof');
var domify = require('domify');
var events = require('event');
var value = require('value');
var query = require('query');
var type = require('type');
var css = require('css');

/**
 * Attributes supported.
 */

var attrs = [
  'id',
  'src',
  'rel',
  'cols',
  'rows',
  'name',
  'href',
  'title',
  'style',
  'width',
  'height',
  'tabindex',
  'placeholder'
];

/**
 * Expose `dom()`.
 */

exports = module.exports = dom;

/**
 * Expose supported attrs.
 */

exports.attrs = attrs;

/**
 * Return a dom `List` for the given
 * `html`, selector, or element.
 *
 * @param {String|Element|List}
 * @return {List}
 * @api public
 */

function dom(selector, context) {
  // array
  if (Array.isArray(selector)) {
    return new List(selector);
  }

  // List
  if (selector instanceof List) {
    return selector;
  }

  // node
  if (selector.nodeName) {
    return new List([selector]);
  }

  if ('string' != typeof selector) {
    throw new TypeError('invalid selector');
  }

  // html
  if ('<' == selector.charAt(0)) {
    return new List([domify(selector)[0]], selector);
  }

  // selector
  var ctx = context
    ? (context.els ? context.els[0] : context)
    : document;

  return new List(query.all(selector, ctx), selector);
}

/**
 * Expose `List` constructor.
 */

exports.List = List;

/**
 * Initialize a new `List` with the
 * given array-ish of `els` and `selector`
 * string.
 *
 * @param {Mixed} els
 * @param {String} selector
 * @api private
 */

function List(els, selector) {
  this.els = els || [];
  this.selector = selector;
}

/**
 * Remove elements from the DOM.
 *
 * @api public
 */

List.prototype.remove = function(){
  for (var i = 0; i < this.els.length; i++) {
    var el = this.els[i];
    var parent = el.parentNode;
    if (parent) parent.removeChild(el);
  }
};

/**
 * Set attribute `name` to `val`, or get attr `name`.
 *
 * @param {String} name
 * @param {String} [val]
 * @return {String|List} self
 * @api public
 */

List.prototype.attr = function(name, val){
  if (1 == arguments.length) {
    return this.els[0] && this.els[0].getAttribute(name);
  }

  return this.forEach(function(el){
    el.setAttribute(name, val);
  });
};

/**
 * Set property `name` to `val`, or get property `name`.
 *
 * @param {String} name
 * @param {String} [val]
 * @return {Object|List} self
 * @api public
 */

List.prototype.prop = function(name, val){
  if (1 == arguments.length) {
    return this.els[0] && this.els[0][name];
  }

  return this.forEach(function(el){
    el[name] = val;
  });
};

/**
 * Get the first element's value or set selected
 * element values to `val`.
 *
 * @param {Mixed} [val]
 * @return {Mixed}
 * @api public
 */

List.prototype.val =
List.prototype.value = function(val){
  if (0 == arguments.length) {
    return this.els[0]
      ? value(this.els[0])
      : undefined;
  }

  return this.forEach(function(el){
    value(el, val);
  });
};

/**
 * Return a cloned `List` with all elements cloned.
 *
 * @return {List}
 * @api public
 */

List.prototype.clone = function(){
  var arr = [];
  for (var i = 0, len = this.els.length; i < len; ++i) {
    arr.push(this.els[i].cloneNode(true));
  }
  return new List(arr);
};

/**
 * Prepend `val`.
 *
 * @param {String|Element|List} val
 * @return {List} new list
 * @api public
 */

List.prototype.prepend = function(val){
  var el = this.els[0];
  if (!el) return this;
  val = dom(val);
  for (var i = 0; i < val.els.length; ++i) {
    if (el.children.length) {
      el.insertBefore(val.els[i], el.firstChild);
    } else {
      el.appendChild(val.els[i]);
    }
  }
  return val;
};

/**
 * Append `val`.
 *
 * @param {String|Element|List} val
 * @return {List} new list
 * @api public
 */

List.prototype.append = function(val){
  var el = this.els[0];
  if (!el) return this;
  val = dom(val);
  for (var i = 0; i < val.els.length; ++i) {
    el.appendChild(val.els[i]);
  }
  return val;
};

/**
 * Append self's `el` to `val`
 *
 * @param {String|Element|List} val
 * @return {List} self
 * @api public
 */

List.prototype.appendTo = function(val){
  dom(val).append(this);
  return this;
};

/**
 * Return a `List` containing the element at `i`.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

List.prototype.at = function(i){
  return new List([this.els[i]], this.selector);
};

/**
 * Return a `List` containing the first element.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

List.prototype.first = function(){
  return new List([this.els[0]], this.selector);
};

/**
 * Return a `List` containing the last element.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

List.prototype.last = function(){
  return new List([this.els[this.els.length - 1]], this.selector);
};

/**
 * Return an `Element` at `i`.
 *
 * @param {Number} i
 * @return {Element}
 * @api public
 */

List.prototype.get = function(i){
  return this.els[i || 0];
};

/**
 * Return list length.
 *
 * @return {Number}
 * @api public
 */

List.prototype.length = function(){
  return this.els.length;
};

/**
 * Return element text.
 *
 * @param {String} str
 * @return {String|List}
 * @api public
 */

List.prototype.text = function(str){
  // TODO: real impl
  if (1 == arguments.length) {
    this.forEach(function(el){
      el.textContent = str;
    });
    return this;
  }

  var str = '';
  for (var i = 0; i < this.els.length; ++i) {
    str += this.els[i].textContent;
  }
  return str;
};

/**
 * Return element html.
 *
 * @return {String} html
 * @api public
 */

List.prototype.html = function(html){
  if (1 == arguments.length) {
    this.forEach(function(el){
      el.innerHTML = html;
    });
  }
  // TODO: real impl
  return this.els[0] && this.els[0].innerHTML;
};

/**
 * Bind to `event` and invoke `fn(e)`. When
 * a `selector` is given then events are delegated.
 *
 * @param {String} event
 * @param {String} [selector]
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {List}
 * @api public
 */

List.prototype.on = function(event, selector, fn, capture){
  if ('string' == typeof selector) {
    for (var i = 0; i < this.els.length; ++i) {
      fn._delegate = delegate.bind(this.els[i], selector, event, fn, capture);
    }
    return this;
  }

  capture = fn;
  fn = selector;

  for (var i = 0; i < this.els.length; ++i) {
    events.bind(this.els[i], event, fn, capture);
  }

  return this;
};

/**
 * Unbind to `event` and invoke `fn(e)`. When
 * a `selector` is given then delegated event
 * handlers are unbound.
 *
 * @param {String} event
 * @param {String} [selector]
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {List}
 * @api public
 */

List.prototype.off = function(event, selector, fn, capture){
  if ('string' == typeof selector) {
    for (var i = 0; i < this.els.length; ++i) {
      // TODO: add selector support back
      delegate.unbind(this.els[i], event, fn._delegate, capture);
    }
    return this;
  }

  capture = fn;
  fn = selector;

  for (var i = 0; i < this.els.length; ++i) {
    events.unbind(this.els[i], event, fn, capture);
  }
  return this;
};

/**
 * Iterate elements and invoke `fn(list, i)`.
 *
 * @param {Function} fn
 * @return {List} self
 * @api public
 */

List.prototype.each = function(fn){
  for (var i = 0; i < this.els.length; ++i) {
    fn(new List([this.els[i]], this.selector), i);
  }
  return this;
};

/**
 * Iterate elements and invoke `fn(el, i)`.
 *
 * @param {Function} fn
 * @return {List} self
 * @api public
 */

List.prototype.forEach = function(fn){
  for (var i = 0; i < this.els.length; ++i) {
    fn(this.els[i], i);
  }
  return this;
};

/**
 * Map elements invoking `fn(list, i)`.
 *
 * @param {Function} fn
 * @return {Array}
 * @api public
 */

List.prototype.map = function(fn){
  var arr = [];
  for (var i = 0; i < this.els.length; ++i) {
    arr.push(fn(new List([this.els[i]], this.selector), i));
  }
  return arr;
};

/**
 * Filter elements invoking `fn(list, i)`, returning
 * a new `List` of elements when a truthy value is returned.
 *
 * @param {Function} fn
 * @return {List}
 * @api public
 */

List.prototype.select =
List.prototype.filter = function(fn){
  var el;
  var list = new List([], this.selector);
  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    if (fn(new List([el], this.selector), i)) list.els.push(el);
  }
  return list;
};

/**
 * Add the given class `name`.
 *
 * @param {String} name
 * @return {List} self
 * @api public
 */

List.prototype.addClass = function(name){
  var el;
  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    el._classes.add(name);
  }
  return this;
};

/**
 * Remove the given class `name`.
 *
 * @param {String|RegExp} name
 * @return {List} self
 * @api public
 */

List.prototype.removeClass = function(name){
  var el;

  if ('regexp' == type(name)) {
    for (var i = 0; i < this.els.length; ++i) {
      el = this.els[i];
      el._classes = el._classes || classes(el);
      var arr = el._classes.array();
      for (var j = 0; j < arr.length; j++) {
        if (name.test(arr[j])) {
          el._classes.remove(arr[j]);
        }
      }
    }
    return this;
  }

  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    el._classes.remove(name);
  }

  return this;
};

/**
 * Toggle the given class `name`,
 * optionally a `bool` may be given
 * to indicate that the class should
 * be added when truthy.
 *
 * @param {String} name
 * @param {Boolean} bool
 * @return {List} self
 * @api public
 */

List.prototype.toggleClass = function(name, bool){
  var el;
  var fn = 'toggle';

  // toggle with boolean
  if (2 == arguments.length) {
    fn = bool ? 'add' : 'remove';
  }

  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    el._classes[fn](name);
  }

  return this;
};

/**
 * Check if the given class `name` is present.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

List.prototype.hasClass = function(name){
  var el;
  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    if (el._classes.has(name)) return true;
  }
  return false;
};

/**
 * Set CSS `prop` to `val` or get `prop` value.
 * Also accepts an object (`prop`: `val`)
 *
 * @param {String} prop
 * @param {Mixed} val
 * @return {List|String}
 * @api public
 */

List.prototype.css = function(prop, val){
  if (2 == arguments.length) {
    var obj = {};
    obj[prop] = val;
    return this.setStyle(obj);
  }

  if ('object' == type(prop)) {
    return this.setStyle(prop);
  }

  return this.getStyle(prop);
};

/**
 * Set CSS `props`.
 *
 * @param {Object} props
 * @return {List} self
 * @api private
 */

List.prototype.setStyle = function(props){
  for (var i = 0; i < this.els.length; ++i) {
    css(this.els[i], props);
  }
  return this;
};

/**
 * Get CSS `prop` value.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

List.prototype.getStyle = function(prop){
  var el = this.els[0];
  if (el) return el.style[prop];
};

/**
 * Find children matching the given `selector`.
 *
 * @param {String} selector
 * @return {List}
 * @api public
 */

List.prototype.find = function(selector){
  return dom(selector, this);
};

/**
 * Empty the dom list
 *
 * @return self
 * @api public
 */

List.prototype.empty = function(){
  var elem, el;

  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  return this;
}

/**
 * Attribute accessors.
 */

attrs.forEach(function(name){
  List.prototype[name] = function(val){
    if (0 == arguments.length) return this.attr(name);
    return this.attr(name, val);
  };
});


});
require.register("component-throttle/index.js", function(exports, require, module){

/**
 * Module exports.
 */

module.exports = throttle;

/**
 * Returns a new function that, when invoked, invokes `func` at most one time per
 * `wait` milliseconds.
 *
 * @param {Function} func The `Function` instance to wrap.
 * @param {Number} wait The minimum number of milliseconds that must elapse in between `func` invokations.
 * @return {Function} A new function that wraps the `func` function passed in.
 * @api public
 */

function throttle (func, wait) {
  var rtn; // return value
  var last = 0; // last invokation timestamp
  return function throttled () {
    var now = new Date().getTime();
    var delta = now - last;
    if (delta >= wait) {
      rtn = func.apply(this, arguments);
      last = now;
    }
    return rtn;
  };
}

});
require.register("component-file/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var file = require('./file')
  , reader = require('./reader');

/**
 * Expose `file()`.
 */

exports = module.exports = file;

/**
 * Expose `reader()`.
 */

exports.reader = reader;
});
require.register("component-file/file.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , Reader = require('./reader');

/**
 * Expose `file()`.
 */

module.exports = file;

/**
 * Initialize a new `File` wrapping `file`.
 *
 * @param {File} file
 * @return {File}
 * @api public
 */

function file(file) {
  return new File(file);
}

/**
 * Initialize a new `File` wrapper.
 *
 * @param {File} file
 * @api private
 */

function File(file) {
  Emitter.call(this);
  this.file = file;
  for (var key in file) this[key] = file[key];
}

/**
 * Inherits from `Emitter.prototype`.
 */

File.prototype.__proto__ = Emitter.prototype;

/**
 * Check if the mime type matches `type`.
 *
 * Examples:
 *
 *    file.is('image/jpeg')
 *    file.is('image/*')
 *
 * @param {String} type
 * @return {Boolean}
 * @api public
 */

File.prototype.is = function(type){
  var real = this.file.type;

  // identical
  if (type == real) return true;

  real = real.split('/');
  type = type.split('/');

  // type/*
  if (type[0] == real[0] && type[1] == '*') return true;

  // */subtype
  if (type[1] == real[1] && type[0] == '*') return true;

  return false;
};

/**
 * Convert to `type` and invoke `fn(err, result)`.
 *
 * @param {String} type
 * @param {Function} fn
 * @return {Reader}
 * @api private
 */

File.prototype.to = function(type, fn){
  if (!window.FileReader) return fn();
  var reader = Reader();
  reader.on('error', fn);
  reader.on('end', function(res){ fn(null, res) });
  reader.read(this.file, type);
  return reader;
};

/**
 * Convert to an `ArrayBuffer`.
 *
 * @param {Function} fn
 * @return {Reader}
 * @api public
 */

File.prototype.toArrayBuffer = function(fn){
  return this.to('ArrayBuffer', fn);
};

/**
 * Convert to text.
 *
 * @param {Function} fn
 * @return {Reader}
 * @api public
 */

File.prototype.toText = function(fn){
  // TODO: encoding
  return this.to('Text', fn);
};

/**
 * Convert to a data uri.
 *
 * @param {Function} fn
 * @return {Reader}
 * @api public
 */

File.prototype.toDataURL = function(fn){
  return this.to('DataURL', fn);
};

});
require.register("component-file/reader.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter');

/**
 * Expose `reader()`.
 */

module.exports = reader;

/**
 * Initialize a new `Reader` from optional `reader`
 * or a new `FileReader` is created.
 *
 * @param {FileReader} reader
 * @return {Reader}
 * @api public
 */

function reader(reader) {
  return reader
    ? new Reader(reader)
    : new Reader(new FileReader);
}

/**
 * Initialize a new `Reader`, a wrapper
 * around a `FileReader`.
 *
 * Emits:
 *
 *   - `error` an error occurred
 *   - `progress` in progress (`e.percent` etc)
 *   - `end` read is complete
 *
 * @param {FileReader} reader
 * @api private
 */

function Reader(reader) {
  Emitter.call(this);
  this.reader = reader;
  reader.onerror = this.emit.bind(this, 'error');
  reader.onabort = this.emit.bind(this, 'error', new Error('abort'));
  reader.onprogress = this.onprogress.bind(this);
  reader.onload = this.onload.bind(this);
}

/**
 * Inherits from `Emitter.prototype`.
 */

Reader.prototype.__proto__ = Emitter.prototype;

/**
 * Onload handler.
 * 
 * @api private
 */

Reader.prototype.onload = function(e){
  this.emit('end', this.reader.result);
};

/**
 * Progress handler.
 * 
 * @api private
 */

Reader.prototype.onprogress = function(e){
  e.percent = e.loaded / e.total * 100 | 0;
  this.emit('progress', e);
};

/**
 * Abort.
 *
 * @api public
 */

Reader.prototype.abort = function(){
  this.reader.abort();
};

/**
 * Read `file` as `type`.
 *
 * @param {File} file
 * @param {String} type
 * @api private
 */

Reader.prototype.read = function(file, type){
  var method = 'readAs' + type;
  this.reader[method](file);
};


});
require.register("component-event-manager/index.js", function(exports, require, module){


/**
 * Expose `EventManager`.
 */

module.exports = EventManager;

/**
 * Initialize an `EventManager` with the given
 * `target` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} target
 * @param {Object} obj
 * @api public
 */

function EventManager(target, obj) {
  this.target = target;
  this.obj = obj;
  this._bindings = {};
}

/**
 * Register bind function.
 *
 * @param {Function} fn
 * @return {EventManager} self
 * @api public
 */

EventManager.prototype.onbind = function(fn){
  this._bind = fn;
  return this;
};

/**
 * Register unbind function.
 *
 * @param {Function} fn
 * @return {EventManager} self
 * @api public
 */

EventManager.prototype.onunbind = function(fn){
  this._unbind = fn;
  return this;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 *    events.bind('login') // implies "onlogin"
 *    events.bind('login', 'onLogin')
 *
 * @param {String} event
 * @param {String} [method]
 * @return {Function} callback
 * @api public
 */

EventManager.prototype.bind = function(event, method){
  var fn = this.addBinding.apply(this, arguments);
  if (this._onbind) this._onbind(event, method, fn);
  this._bind(event, fn);
  return fn;
};

/**
 * Add event binding.
 *
 * @param {String} event
 * @param {String} method
 * @return {Function} callback
 * @api private
 */

EventManager.prototype.addBinding = function(event, method){
  var obj = this.obj;
  var method = method || 'on' + event;
  var args = [].slice.call(arguments, 2);

  // callback
  function callback() {
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // subscription
  this._bindings[event] = this._bindings[event] || {};
  this._bindings[event][method] = callback;

  return callback;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 *     evennts.unbind('login', 'onLogin')
 *     evennts.unbind('login')
 *     evennts.unbind()
 *
 * @param {String} [event]
 * @param {String} [method]
 * @return {Function} callback
 * @api public
 */

EventManager.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);
  var fn = this._bindings[event][method];
  if (this._onunbind) this._onunbind(event, method, fn);
  this._unbind(event, fn);
  return fn;
};

/**
 * Unbind all events.
 *
 * @api private
 */

EventManager.prototype.unbindAll = function(){
  for (var event in this._bindings) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

EventManager.prototype.unbindAllOf = function(event){
  var bindings = this._bindings[event];
  if (!bindings) return;
  for (var method in bindings) {
    this.unbind(event, method);
  }
};

});
require.register("component-events/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Manager = require('event-manager')
  , event = require('event');

/**
 * Return a new event manager.
 */

module.exports = function(target, obj){
  var manager = new Manager(target, obj);

  manager.onbind(function(name, fn){
    event.bind(target, name, fn);
  });

  manager.onunbind(function(name, fn){
    event.unbind(target, name, fn);
  });

  return manager;
};

});
require.register("component-upload/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter');

/**
 * Expose `Upload`.
 */

module.exports = Upload;

/**
 * Initialize a new `Upload` file`.
 * This represents a single file upload.
 *
 * Events:
 *
 *   - `error` an error occurred
 *   - `abort` upload was aborted
 *   - `progress` upload in progress (`e.percent` etc)
 *   - `end` upload is complete
 *
 * @param {File} file
 * @api private
 */

function Upload(file) {
  if (!(this instanceof Upload)) return new Upload(file);
  Emitter.call(this);
  this.file = file;
  file.slice = file.slice || file.webkitSlice;
}

/**
 * Mixin emitter.
 */

Emitter(Upload.prototype);

/**
 * Upload to the given `path`.
 *
 * @param {String} path
 * @param {Function} [fn]
 * @api public
 */

Upload.prototype.to = function(path, fn){
  // TODO: x-browser
  var self = this;
  fn = fn || function(){};
  var req = this.req = new XMLHttpRequest;
  req.open('POST', path);
  req.onload = this.onload.bind(this);
  req.onerror = this.onerror.bind(this);
  req.upload.onprogress = this.onprogress.bind(this);
  req.onreadystatechange = function(){
    if (4 == req.readyState) {
      var type = req.status / 100 | 0;
      if (2 == type) return fn(null, req);
      var err = new Error(req.statusText + ': ' + req.response);
      err.status = req.status;
      fn(err);
    }
  };
  var body = new FormData;
  body.append('file', this.file);
  req.send(body);
};

/**
 * Abort the XHR.
 *
 * @api public
 */

Upload.prototype.abort = function(){
  this.emit('abort');
  this.req.abort();
};

/**
 * Error handler.
 *
 * @api private
 */

Upload.prototype.onerror = function(e){
  this.emit('error', e);
};

/**
 * Onload handler.
 *
 * @api private
 */

Upload.prototype.onload = function(e){
  this.emit('end', this.req);
};

/**
 * Progress handler.
 *
 * @api private
 */

Upload.prototype.onprogress = function(e){
  e.percent = e.loaded / e.total * 100;
  this.emit('progress', e);
};

});
require.register("component-dropload/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , classes = require('classes')
  , Upload = require('upload')
  , events = require('events')

/**
 * Expose `Dropload`.
 */

module.exports = Dropload;

/**
 * Types.
 */

var typeMap = {
  'text/plain': 'text',
  'text/uri-list': 'url',
  'text/html': 'html'
};

/**
 * Initialize a drop point
 * on the given `el`.
 *
 * Emits:
 *
 *   - `error` on validation error
 *   - `upload` passing an `Upload`
 *
 * @param {Element} el
 * @api public
 */

function Dropload(el) {
  if (!(this instanceof Dropload)) return new Dropload(el);
  Emitter.call(this);
  this.el = el;
  this.classes = classes(el);
  this.events = events(el, this);
  this.events.bind('drop');
  this.events.bind('dragenter');
  this.events.bind('dragleave');
  this.events.bind('dragover');
  this.ignored = {};
}

/**
 * Mixin emitter.
 */

Emitter(Dropload.prototype);

/**
 * Ignore `name`.
 *
 * @param {String} name
 * @api private
 */

Dropload.prototype.ignore = function(name){
  this.ignored[name] = true;
};

/**
 * Check if `name` is ignored.
 *
 * @param {String} name
 * @return {Boolean}
 * @api private
 */

Dropload.prototype.ignoring = function(name){
  return !! this.ignored[name];
};

/**
 * Unbind event handlers.
 *
 * @api public
 */

Dropload.prototype.unbind = function(){
  this.events.unbind();
};

/**
 * Dragenter handler.
 */

Dropload.prototype.ondragenter = function(e){
  this.classes.add('over');
};

/**
 * Dragover handler.
 */

Dropload.prototype.ondragover = function(e){
  e.preventDefault();
};

/**
 * Dragleave handler.
 */

Dropload.prototype.ondragleave = function(e){
  this.classes.remove('over');
};

/**
 * Drop handler.
 */

Dropload.prototype.ondrop = function(e){
  e.stopPropagation();
  e.preventDefault();
  this.classes.remove('over');
  var items = e.dataTransfer.items;
  var files = e.dataTransfer.files;
  if (items) this.directories(items);
  if (items) this.items(items);
  if (files) this.upload(files);
  this.ignored = {};
};

/**
 * Walk directories and upload files.
 *
 * Directories are considered "files",
 * non-files return null for .webkitGetAsEntry()
 * for example when dragging urls.
 *
 * @param {DataTransferItemList} items
 * @api private
 */

Dropload.prototype.directories = function(items){
  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    if ('file' != item.kind) continue;

    if (!item.webkitGetAsEntry) continue;
    var entry = item.webkitGetAsEntry();

    if (entry.isDirectory) {
      this.ignore(entry.name);
      this.walkEntry(entry);
    }
  }
};

/**
 * Handle the given `items`.
 *
 * @param {DataTransferItemList}
 * @api private
 */

Dropload.prototype.items = function(items){
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    this.item(item);
  }
};

/**
 * Walk file entry recursively.
 *
 * @param {FileEntry} item
 * @api private
 */

Dropload.prototype.walkEntry = function(item){
  var self = this;

  if (item.isFile) {
    return item.file(function(file){
      file.entry = item;
      self.upload([file]);
    });
  }

  if (item.isDirectory) {
    var dir = item.createReader();
    dir.readEntries(function(entries){
      for (var i = 0; i < entries.length; i++) {
        var name = entries[i].name;
        if ('.' == name[0]) continue;
        self.walkEntry(entries[i]);
      }
    })
  }
};

/**
 * Handle `item`.
 *
 * @param {Object} item
 * @api private
 */

Dropload.prototype.item = function(item){
  var self = this;
  var type = typeMap[item.type];
  item.getAsString(function(str){
    self.emit(type, str, item);
  });
};

/**
 * Upload the given `files`.
 *
 * Presents each `file` in the FileList
 * as an `Upload` via the "upload" event
 * after it has been validated.
 *
 * @param {FileList} files
 * @api public
 */

Dropload.prototype.upload = function(files){
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (this.ignoring(file.name)) continue;
    this.emit('upload', new Upload(file));
  }
};

});
require.register("component-drop-anywhere/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Dropload = require('dropload')
  , events = require('events');

/**
 * Expose `DropAnywhere`.
 */

module.exports = DropAnywhere;

/**
 * Make the document droppable and invoke `fn(err, upload)`.
 *
 * @param {Function} fn
 * @api public
 */

function DropAnywhere(fn) {
  if (!(this instanceof DropAnywhere)) return new DropAnywhere(fn);
  this.callback = fn;
  this.el = document.createElement('div');
  this.el.id = 'drop-anywhere';
  this.events = events(this.el, this);
  this.docEvents = events(document.body, this);
  this.events.bind('click', 'hide');
  this.events.bind('drop', 'hide');
  this.events.bind('dragleave', 'hide');
  this.docEvents.bind('dragenter', 'show');
  this.drop = Dropload(this.el);
  this.drop.on('error', fn);
  this.handle('upload');
  this.handle('text');
  this.handle('html');
  this.handle('url');
  this.add();
}

/**
 * Handle the given item `type`.
 *
 * @param {String} type
 * @api private
 */

DropAnywhere.prototype.handle = function(type){
  var self = this;
  this.drop.on(type, function(item){
    self.callback(null, {
      type: type,
      item: item
    });
  });
};

/**
 * Add the element.
 */

DropAnywhere.prototype.add = function(){
  document.body.appendChild(this.el);
};

/**
 * Remove the element.
 */

DropAnywhere.prototype.remove = function(){
  document.body.removeChild(this.el);
};

/**
 * Show the dropzone.
 */

DropAnywhere.prototype.show = function(){
  this.el.className = 'show';
};

/**
 * Hide the dropzone.
 */

DropAnywhere.prototype.hide = function(){
  this.el.className = '';
};

/**
 * Unbind.
 *
 * @api public
 */

DropAnywhere.prototype.unbind = function(){
  this.remove();
  this.docEvents.unbind();
  this.events.unbind();
  this.drop.unbind();
};

});
require.register("mousehouse/app.js", function(exports, require, module){
var dropAnywhere = require('drop-anywhere')
  , file = require('file')
  , throttle = require('throttle')
  , dom = require('dom')
  , request = require('superagent')


var drop = dropAnywhere(function(err, drop){
  var img = file(drop.item.file);
  if (!img.is('image/*')) {
    console.error("Images Only, dogg");
    return
  }
  var reader = img.toDataURL(function(err, str){
    if (err) throw err;
    showImg(str);
  });
});



function showImg(str) {
  document.body.style.backgroundImage = 'url(' + str + ')';
  images.push(str);

  // get dimensions
  var img = new Image()
  img.src = str;
  img.onload = function() {
    console.log(img.height);
    console.log(img.width);
  }
}


// DEMO
var images = [];
var index = 0;
request.get('demo.json', function(resp) {
  images = resp.body;
  showNext();
});
function showNext() {
  var img = images[index];
  showImg(img)
  index += 1;
  if (index === images.length) index = 0;
}
document.body.onclick = showNext;

});
require.alias("visionmedia-superagent/lib/client.js", "mousehouse/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "mousehouse/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("RedVentures-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");

require.alias("component-dom/index.js", "mousehouse/deps/dom/index.js");
require.alias("component-type/index.js", "component-dom/deps/type/index.js");

require.alias("component-event/index.js", "component-dom/deps/event/index.js");

require.alias("component-delegate/index.js", "component-dom/deps/delegate/index.js");
require.alias("component-matches-selector/index.js", "component-delegate/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-indexof/index.js", "component-dom/deps/indexof/index.js");

require.alias("component-domify/index.js", "component-dom/deps/domify/index.js");

require.alias("component-classes/index.js", "component-dom/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-css/index.js", "component-dom/deps/css/index.js");

require.alias("component-sort/index.js", "component-dom/deps/sort/index.js");

require.alias("component-value/index.js", "component-dom/deps/value/index.js");
require.alias("component-value/index.js", "component-dom/deps/value/index.js");
require.alias("component-value/index.js", "component-value/index.js");

require.alias("component-query/index.js", "component-dom/deps/query/index.js");

require.alias("component-throttle/index.js", "mousehouse/deps/throttle/index.js");

require.alias("component-file/index.js", "mousehouse/deps/file/index.js");
require.alias("component-file/file.js", "mousehouse/deps/file/file.js");
require.alias("component-file/reader.js", "mousehouse/deps/file/reader.js");
require.alias("component-emitter/index.js", "component-file/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-drop-anywhere/index.js", "mousehouse/deps/drop-anywhere/index.js");
require.alias("component-events/index.js", "component-drop-anywhere/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-event-manager/index.js", "component-events/deps/event-manager/index.js");

require.alias("component-dropload/index.js", "component-drop-anywhere/deps/dropload/index.js");
require.alias("component-emitter/index.js", "component-dropload/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-classes/index.js", "component-dropload/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-upload/index.js", "component-dropload/deps/upload/index.js");
require.alias("component-emitter/index.js", "component-upload/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-events/index.js", "component-dropload/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-event-manager/index.js", "component-events/deps/event-manager/index.js");

require.alias("mousehouse/app.js", "mousehouse/index.js");

