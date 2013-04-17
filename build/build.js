
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
}

/**
 * Mixin emitter.
 */

Emitter(Dropload.prototype);

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
  if (items) this.drop(items);
  this.upload(e.dataTransfer.files);
};

/**
 * Handle the given `items`.
 *
 * @param {DataTransferItemList}
 * @api private
 */

Dropload.prototype.drop = function(items){
  for (var i = 0; i < items.length; i++) {
    this.dropItem(items[i]);
  }
};

/**
 * Handle `item`.
 *
 * @param {Object} item
 * @api private
 */

Dropload.prototype.dropItem = function(item){
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
    this.emit('upload', new Upload(files[i]));
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
var $body = $('body')
var $menu = $('#menu')
var $object = $('.object')
var activeObject;

$object.draggable().resizable()
$menu.menu();

$body.on('contextmenu .object', function(ev) {
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return true;
  activeObject = $(ev.target);
  if (!activeObject.is('.object'))
    activeObject = $(ev.target).parent('.object')
  $menu.show()
  $menu.css({
    top: ev.clientY + 'px',
    left: ev.clientX + 'px',
  });
  return false;
});

$body.click(function() {
  $menu.hide()
});

var ZMIN = 1;
var ZMAX = 100;
$('a').on('click', function(ev) {
  var tar = $(ev.target);
  var action = tar.data('action');
  var z = activeObject.css('z-index');
  activeObject.removeClass('atFront atBack');
  if (action === 'bringForward') {
    activeObject.css('z-index', z + 1);
  }
  if (action === 'bringToFront') {
    $('.atFront').css('z-index', ZMAX).removeClass('atFront');
    activeObject.css('z-index', ZMAX + 1).addClass('atFront');
  }
  if (action === 'sendBackward') {
    activeObject.css('z-index', Math.max(z - 1, ZMIN));
  }
  if (action === 'sendToBack') {
    $('.atBack').css('z-index', ZMIN).removeClass('atBack');
    activeObject.css('z-index', ZMIN - 1).addClass('atBack');
  }
  if (action === 'delete') {
    activeObject.remove();
  }
});

$body.dblclick(function(ev) {
  var $obj = $("<div class='object'></div>");
  $obj.css({
    width: '100px',
    height: '100px',
    background: 'green',
    left: ev.clientX,
    top: ev.clientY,
  });
  $obj.draggable().resizable()
  $body.append($obj);
});


/// drop

var dropAnywhere = require('drop-anywhere')
  , file = require('file')

var drop = dropAnywhere(function(err, drop){
  var img = file(drop.item.file);
  var isImg = img.is('image/*');
  var reader = img.toDataURL(function(err, str){
    if (err) throw err;
    var img = document.createElement('img');
    img.src = str;
    img.height = 300;
    var $obj = $("<div class='object'></div>");
    $obj.css({
      width: '100px',
      height: '100px',
    });
    $obj.append(img);
    $obj.draggable().resizable()
    $body.append($obj);
  });
});

});
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

