
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
require.register("component-type/index.js", Function("exports, require, module",
"\n/**\n * toString ref.\n */\n\nvar toString = Object.prototype.toString;\n\n/**\n * Return the type of `val`.\n *\n * @param {Mixed} val\n * @return {String}\n * @api public\n */\n\nmodule.exports = function(val){\n  switch (toString.call(val)) {\n    case '[object Function]': return 'function';\n    case '[object Date]': return 'date';\n    case '[object RegExp]': return 'regexp';\n    case '[object Arguments]': return 'arguments';\n    case '[object Array]': return 'array';\n    case '[object String]': return 'string';\n  }\n\n  if (val === null) return 'null';\n  if (val === undefined) return 'undefined';\n  if (val && val.nodeType === 1) return 'element';\n  if (val === Object(val)) return 'object';\n\n  return typeof val;\n};\n//@ sourceURL=component-type/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"\n/**\n * Bind `el` event `type` to `fn`.\n *\n * @param {Element} el\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {Function}\n * @api public\n */\n\nexports.bind = function(el, type, fn, capture){\n  if (el.addEventListener) {\n    el.addEventListener(type, fn, capture || false);\n  } else {\n    el.attachEvent('on' + type, fn);\n  }\n  return fn;\n};\n\n/**\n * Unbind `el` event `type`'s callback `fn`.\n *\n * @param {Element} el\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {Function}\n * @api public\n */\n\nexports.unbind = function(el, type, fn, capture){\n  if (el.removeEventListener) {\n    el.removeEventListener(type, fn, capture || false);\n  } else {\n    el.detachEvent('on' + type, fn);\n  }\n  return fn;\n};\n//@ sourceURL=component-event/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n * Module dependencies.\n */\n\nvar query = require('query');\n\n/**\n * Element prototype.\n */\n\nvar proto = Element.prototype;\n\n/**\n * Vendor function.\n */\n\nvar vendor = proto.matchesSelector\n  || proto.webkitMatchesSelector\n  || proto.mozMatchesSelector\n  || proto.msMatchesSelector\n  || proto.oMatchesSelector;\n\n/**\n * Expose `match()`.\n */\n\nmodule.exports = match;\n\n/**\n * Match `el` to `selector`.\n *\n * @param {Element} el\n * @param {String} selector\n * @return {Boolean}\n * @api public\n */\n\nfunction match(el, selector) {\n  if (vendor) return vendor.call(el, selector);\n  var nodes = query.all(selector, el.parentNode);\n  for (var i = 0; i < nodes.length; ++i) {\n    if (nodes[i] == el) return true;\n  }\n  return false;\n}\n//@ sourceURL=component-matches-selector/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar matches = require('matches-selector')\n  , event = require('event');\n\n/**\n * Delegate event `type` to `selector`\n * and invoke `fn(e)`. A callback function\n * is returned which may be passed to `.unbind()`.\n *\n * @param {Element} el\n * @param {String} selector\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {Function}\n * @api public\n */\n\nexports.bind = function(el, selector, type, fn, capture){\n  return event.bind(el, type, function(e){\n    if (matches(e.target, selector)) fn.call(el, e);\n  }, capture);\n};\n\n/**\n * Unbind event `type`'s callback `fn`.\n *\n * @param {Element} el\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @api public\n */\n\nexports.unbind = function(el, type, fn, capture){\n  event.unbind(el, type, fn, capture);\n};\n//@ sourceURL=component-delegate/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"\nvar indexOf = [].indexOf;\n\nmodule.exports = function(arr, obj){\n  if (indexOf) return arr.indexOf(obj);\n  for (var i = 0; i < arr.length; ++i) {\n    if (arr[i] === obj) return i;\n  }\n  return -1;\n};//@ sourceURL=component-indexof/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n/**\n * Expose `parse`.\n */\n\nmodule.exports = parse;\n\n/**\n * Wrap map from jquery.\n */\n\nvar map = {\n  option: [1, '<select multiple=\"multiple\">', '</select>'],\n  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n  legend: [1, '<fieldset>', '</fieldset>'],\n  thead: [1, '<table>', '</table>'],\n  tbody: [1, '<table>', '</table>'],\n  tfoot: [1, '<table>', '</table>'],\n  colgroup: [1, '<table>', '</table>'],\n  caption: [1, '<table>', '</table>'],\n  tr: [2, '<table><tbody>', '</tbody></table>'],\n  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n  _default: [0, '', '']\n};\n\n/**\n * Parse `html` and return the children.\n *\n * @param {String} html\n * @return {Array}\n * @api private\n */\n\nfunction parse(html) {\n  if ('string' != typeof html) throw new TypeError('String expected');\n  \n  // tag name\n  var m = /<([\\w:]+)/.exec(html);\n  if (!m) throw new Error('No elements were generated.');\n  var tag = m[1];\n  \n  // body support\n  if (tag == 'body') {\n    var el = document.createElement('html');\n    el.innerHTML = html;\n    return [el.removeChild(el.lastChild)];\n  }\n  \n  // wrap map\n  var wrap = map[tag] || map._default;\n  var depth = wrap[0];\n  var prefix = wrap[1];\n  var suffix = wrap[2];\n  var el = document.createElement('div');\n  el.innerHTML = prefix + html + suffix;\n  while (depth--) el = el.lastChild;\n\n  return orphan(el.children);\n}\n\n/**\n * Orphan `els` and return an array.\n *\n * @param {NodeList} els\n * @return {Array}\n * @api private\n */\n\nfunction orphan(els) {\n  var ret = [];\n\n  while (els.length) {\n    ret.push(els[0].parentNode.removeChild(els[0]));\n  }\n\n  return ret;\n}\n//@ sourceURL=component-domify/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar index = require('indexof');\n\n/**\n * Whitespace regexp.\n */\n\nvar re = /\\s+/;\n\n/**\n * toString reference.\n */\n\nvar toString = Object.prototype.toString;\n\n/**\n * Wrap `el` in a `ClassList`.\n *\n * @param {Element} el\n * @return {ClassList}\n * @api public\n */\n\nmodule.exports = function(el){\n  return new ClassList(el);\n};\n\n/**\n * Initialize a new ClassList for `el`.\n *\n * @param {Element} el\n * @api private\n */\n\nfunction ClassList(el) {\n  this.el = el;\n  this.list = el.classList;\n}\n\n/**\n * Add class `name` if not already present.\n *\n * @param {String} name\n * @return {ClassList}\n * @api public\n */\n\nClassList.prototype.add = function(name){\n  // classList\n  if (this.list) {\n    this.list.add(name);\n    return this;\n  }\n\n  // fallback\n  var arr = this.array();\n  var i = index(arr, name);\n  if (!~i) arr.push(name);\n  this.el.className = arr.join(' ');\n  return this;\n};\n\n/**\n * Remove class `name` when present, or\n * pass a regular expression to remove\n * any which match.\n *\n * @param {String|RegExp} name\n * @return {ClassList}\n * @api public\n */\n\nClassList.prototype.remove = function(name){\n  if ('[object RegExp]' == toString.call(name)) {\n    return this.removeMatching(name);\n  }\n\n  // classList\n  if (this.list) {\n    this.list.remove(name);\n    return this;\n  }\n\n  // fallback\n  var arr = this.array();\n  var i = index(arr, name);\n  if (~i) arr.splice(i, 1);\n  this.el.className = arr.join(' ');\n  return this;\n};\n\n/**\n * Remove all classes matching `re`.\n *\n * @param {RegExp} re\n * @return {ClassList}\n * @api private\n */\n\nClassList.prototype.removeMatching = function(re){\n  var arr = this.array();\n  for (var i = 0; i < arr.length; i++) {\n    if (re.test(arr[i])) {\n      this.remove(arr[i]);\n    }\n  }\n  return this;\n};\n\n/**\n * Toggle class `name`.\n *\n * @param {String} name\n * @return {ClassList}\n * @api public\n */\n\nClassList.prototype.toggle = function(name){\n  // classList\n  if (this.list) {\n    this.list.toggle(name);\n    return this;\n  }\n\n  // fallback\n  if (this.has(name)) {\n    this.remove(name);\n  } else {\n    this.add(name);\n  }\n  return this;\n};\n\n/**\n * Return an array of classes.\n *\n * @return {Array}\n * @api public\n */\n\nClassList.prototype.array = function(){\n  var arr = this.el.className.split(re);\n  if ('' === arr[0]) arr.pop();\n  return arr;\n};\n\n/**\n * Check if class `name` is present.\n *\n * @param {String} name\n * @return {ClassList}\n * @api public\n */\n\nClassList.prototype.has =\nClassList.prototype.contains = function(name){\n  return this.list\n    ? this.list.contains(name)\n    : !! ~index(this.array(), name);\n};\n//@ sourceURL=component-classes/index.js"
));
require.register("component-css/index.js", Function("exports, require, module",
"\n/**\n * Properties to ignore appending \"px\".\n */\n\nvar ignore = {\n  columnCount: true,\n  fillOpacity: true,\n  fontWeight: true,\n  lineHeight: true,\n  opacity: true,\n  orphans: true,\n  widows: true,\n  zIndex: true,\n  zoom: true\n};\n\n/**\n * Set `el` css values.\n *\n * @param {Element} el\n * @param {Object} obj\n * @return {Element}\n * @api public\n */\n\nmodule.exports = function(el, obj){\n  for (var key in obj) {\n    var val = obj[key];\n    if ('number' == typeof val && !ignore[key]) val += 'px';\n    el.style[key] = val;\n  }\n  return el;\n};\n//@ sourceURL=component-css/index.js"
));
require.register("component-sort/index.js", Function("exports, require, module",
"\n/**\n * Expose `sort`.\n */\n\nexports = module.exports = sort;\n\n/**\n * Sort `el`'s children with the given `fn(a, b)`.\n *\n * @param {Element} el\n * @param {Function} fn\n * @api public\n */\n\nfunction sort(el, fn) {\n  var arr = [].slice.call(el.children).sort(fn);\n  var frag = document.createDocumentFragment();\n  for (var i = 0; i < arr.length; i++) {\n    frag.appendChild(arr[i]);\n  }\n  el.appendChild(frag);\n};\n\n/**\n * Sort descending.\n *\n * @param {Element} el\n * @param {Function} fn\n * @api public\n */\n\nexports.desc = function(el, fn){\n  sort(el, function(a, b){\n    return ~fn(a, b) + 1;\n  });\n};\n\n/**\n * Sort ascending.\n */\n\nexports.asc = sort;\n//@ sourceURL=component-sort/index.js"
));
require.register("component-value/index.js", Function("exports, require, module",
"\n/**\n * Set or get `el`'s' value.\n *\n * @param {Element} el\n * @param {Mixed} val\n * @return {Mixed}\n * @api public\n */\n\nmodule.exports = function(el, val){\n  if (2 == arguments.length) return set(el, val);\n  return get(el);\n};\n\n/**\n * Get `el`'s value.\n */\n\nfunction get(el) {\n  switch (type(el)) {\n    case 'checkbox':\n      return el.getAttribute('checked') == 'checked'\n        ? null == el.getAttribute('value')\n          ? true\n          : el.getAttribute('value')\n        : false;\n    default:\n      return el.value;\n  }\n}\n\n/**\n * Set `el`'s value.\n */\n\nfunction set(el, val) {\n  switch (type(el)) {\n    case 'checkbox':\n      if (val) {\n        el.setAttribute('checked', 'checked');\n      } else {\n        el.removeAttribute('checked');\n      }\n      break;\n    case 'input':\n      el.setAttribute('value', val);\n      break;\n    default:\n      el.value = val;\n  }\n}\n\n/**\n * Element type.\n */\n\nfunction type(el) {\n  var name = el.nodeName.toLowerCase();\n  if ('input' == name && 'checkbox' == el.getAttribute('type')) return 'checkbox';\n  return name.toLowerCase();\n}\n//@ sourceURL=component-value/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"\nfunction one(selector, el) {\n  return el.querySelector(selector);\n}\n\nexports = module.exports = function(selector, el){\n  el = el || document;\n  return one(selector, el);\n};\n\nexports.all = function(selector, el){\n  el = el || document;\n  return el.querySelectorAll(selector);\n};\n\nexports.engine = function(obj){\n  if (!obj.one) throw new Error('.one callback required');\n  if (!obj.all) throw new Error('.all callback required');\n  one = obj.one;\n  exports.all = obj.all;\n};\n//@ sourceURL=component-query/index.js"
));
require.register("component-dom/index.js", Function("exports, require, module",
"/**\n * Module dependencies.\n */\n\nvar delegate = require('delegate');\nvar classes = require('classes');\nvar indexof = require('indexof');\nvar domify = require('domify');\nvar events = require('event');\nvar value = require('value');\nvar query = require('query');\nvar type = require('type');\nvar css = require('css');\n\n/**\n * Attributes supported.\n */\n\nvar attrs = [\n  'id',\n  'src',\n  'rel',\n  'cols',\n  'rows',\n  'name',\n  'href',\n  'title',\n  'style',\n  'width',\n  'height',\n  'tabindex',\n  'placeholder'\n];\n\n/**\n * Expose `dom()`.\n */\n\nexports = module.exports = dom;\n\n/**\n * Expose supported attrs.\n */\n\nexports.attrs = attrs;\n\n/**\n * Return a dom `List` for the given\n * `html`, selector, or element.\n *\n * @param {String|Element|List}\n * @return {List}\n * @api public\n */\n\nfunction dom(selector, context) {\n  // array\n  if (Array.isArray(selector)) {\n    return new List(selector);\n  }\n\n  // List\n  if (selector instanceof List) {\n    return selector;\n  }\n\n  // node\n  if (selector.nodeName) {\n    return new List([selector]);\n  }\n\n  if ('string' != typeof selector) {\n    throw new TypeError('invalid selector');\n  }\n\n  // html\n  if ('<' == selector.charAt(0)) {\n    return new List([domify(selector)[0]], selector);\n  }\n\n  // selector\n  var ctx = context\n    ? (context.els ? context.els[0] : context)\n    : document;\n\n  return new List(query.all(selector, ctx), selector);\n}\n\n/**\n * Expose `List` constructor.\n */\n\nexports.List = List;\n\n/**\n * Initialize a new `List` with the\n * given array-ish of `els` and `selector`\n * string.\n *\n * @param {Mixed} els\n * @param {String} selector\n * @api private\n */\n\nfunction List(els, selector) {\n  this.els = els || [];\n  this.selector = selector;\n}\n\n/**\n * Remove elements from the DOM.\n *\n * @api public\n */\n\nList.prototype.remove = function(){\n  for (var i = 0; i < this.els.length; i++) {\n    var el = this.els[i];\n    var parent = el.parentNode;\n    if (parent) parent.removeChild(el);\n  }\n};\n\n/**\n * Set attribute `name` to `val`, or get attr `name`.\n *\n * @param {String} name\n * @param {String} [val]\n * @return {String|List} self\n * @api public\n */\n\nList.prototype.attr = function(name, val){\n  if (1 == arguments.length) {\n    return this.els[0] && this.els[0].getAttribute(name);\n  }\n\n  return this.forEach(function(el){\n    el.setAttribute(name, val);\n  });\n};\n\n/**\n * Set property `name` to `val`, or get property `name`.\n *\n * @param {String} name\n * @param {String} [val]\n * @return {Object|List} self\n * @api public\n */\n\nList.prototype.prop = function(name, val){\n  if (1 == arguments.length) {\n    return this.els[0] && this.els[0][name];\n  }\n\n  return this.forEach(function(el){\n    el[name] = val;\n  });\n};\n\n/**\n * Get the first element's value or set selected\n * element values to `val`.\n *\n * @param {Mixed} [val]\n * @return {Mixed}\n * @api public\n */\n\nList.prototype.val =\nList.prototype.value = function(val){\n  if (0 == arguments.length) {\n    return this.els[0]\n      ? value(this.els[0])\n      : undefined;\n  }\n\n  return this.forEach(function(el){\n    value(el, val);\n  });\n};\n\n/**\n * Return a cloned `List` with all elements cloned.\n *\n * @return {List}\n * @api public\n */\n\nList.prototype.clone = function(){\n  var arr = [];\n  for (var i = 0, len = this.els.length; i < len; ++i) {\n    arr.push(this.els[i].cloneNode(true));\n  }\n  return new List(arr);\n};\n\n/**\n * Prepend `val`.\n *\n * @param {String|Element|List} val\n * @return {List} new list\n * @api public\n */\n\nList.prototype.prepend = function(val){\n  var el = this.els[0];\n  if (!el) return this;\n  val = dom(val);\n  for (var i = 0; i < val.els.length; ++i) {\n    if (el.children.length) {\n      el.insertBefore(val.els[i], el.firstChild);\n    } else {\n      el.appendChild(val.els[i]);\n    }\n  }\n  return val;\n};\n\n/**\n * Append `val`.\n *\n * @param {String|Element|List} val\n * @return {List} new list\n * @api public\n */\n\nList.prototype.append = function(val){\n  var el = this.els[0];\n  if (!el) return this;\n  val = dom(val);\n  for (var i = 0; i < val.els.length; ++i) {\n    el.appendChild(val.els[i]);\n  }\n  return val;\n};\n\n/**\n * Append self's `el` to `val`\n *\n * @param {String|Element|List} val\n * @return {List} self\n * @api public\n */\n\nList.prototype.appendTo = function(val){\n  dom(val).append(this);\n  return this;\n};\n\n/**\n * Return a `List` containing the element at `i`.\n *\n * @param {Number} i\n * @return {List}\n * @api public\n */\n\nList.prototype.at = function(i){\n  return new List([this.els[i]], this.selector);\n};\n\n/**\n * Return a `List` containing the first element.\n *\n * @param {Number} i\n * @return {List}\n * @api public\n */\n\nList.prototype.first = function(){\n  return new List([this.els[0]], this.selector);\n};\n\n/**\n * Return a `List` containing the last element.\n *\n * @param {Number} i\n * @return {List}\n * @api public\n */\n\nList.prototype.last = function(){\n  return new List([this.els[this.els.length - 1]], this.selector);\n};\n\n/**\n * Return an `Element` at `i`.\n *\n * @param {Number} i\n * @return {Element}\n * @api public\n */\n\nList.prototype.get = function(i){\n  return this.els[i || 0];\n};\n\n/**\n * Return list length.\n *\n * @return {Number}\n * @api public\n */\n\nList.prototype.length = function(){\n  return this.els.length;\n};\n\n/**\n * Return element text.\n *\n * @param {String} str\n * @return {String|List}\n * @api public\n */\n\nList.prototype.text = function(str){\n  // TODO: real impl\n  if (1 == arguments.length) {\n    this.forEach(function(el){\n      el.textContent = str;\n    });\n    return this;\n  }\n\n  var str = '';\n  for (var i = 0; i < this.els.length; ++i) {\n    str += this.els[i].textContent;\n  }\n  return str;\n};\n\n/**\n * Return element html.\n *\n * @return {String} html\n * @api public\n */\n\nList.prototype.html = function(html){\n  if (1 == arguments.length) {\n    this.forEach(function(el){\n      el.innerHTML = html;\n    });\n  }\n  // TODO: real impl\n  return this.els[0] && this.els[0].innerHTML;\n};\n\n/**\n * Bind to `event` and invoke `fn(e)`. When\n * a `selector` is given then events are delegated.\n *\n * @param {String} event\n * @param {String} [selector]\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {List}\n * @api public\n */\n\nList.prototype.on = function(event, selector, fn, capture){\n  if ('string' == typeof selector) {\n    for (var i = 0; i < this.els.length; ++i) {\n      fn._delegate = delegate.bind(this.els[i], selector, event, fn, capture);\n    }\n    return this;\n  }\n\n  capture = fn;\n  fn = selector;\n\n  for (var i = 0; i < this.els.length; ++i) {\n    events.bind(this.els[i], event, fn, capture);\n  }\n\n  return this;\n};\n\n/**\n * Unbind to `event` and invoke `fn(e)`. When\n * a `selector` is given then delegated event\n * handlers are unbound.\n *\n * @param {String} event\n * @param {String} [selector]\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {List}\n * @api public\n */\n\nList.prototype.off = function(event, selector, fn, capture){\n  if ('string' == typeof selector) {\n    for (var i = 0; i < this.els.length; ++i) {\n      // TODO: add selector support back\n      delegate.unbind(this.els[i], event, fn._delegate, capture);\n    }\n    return this;\n  }\n\n  capture = fn;\n  fn = selector;\n\n  for (var i = 0; i < this.els.length; ++i) {\n    events.unbind(this.els[i], event, fn, capture);\n  }\n  return this;\n};\n\n/**\n * Iterate elements and invoke `fn(list, i)`.\n *\n * @param {Function} fn\n * @return {List} self\n * @api public\n */\n\nList.prototype.each = function(fn){\n  for (var i = 0; i < this.els.length; ++i) {\n    fn(new List([this.els[i]], this.selector), i);\n  }\n  return this;\n};\n\n/**\n * Iterate elements and invoke `fn(el, i)`.\n *\n * @param {Function} fn\n * @return {List} self\n * @api public\n */\n\nList.prototype.forEach = function(fn){\n  for (var i = 0; i < this.els.length; ++i) {\n    fn(this.els[i], i);\n  }\n  return this;\n};\n\n/**\n * Map elements invoking `fn(list, i)`.\n *\n * @param {Function} fn\n * @return {Array}\n * @api public\n */\n\nList.prototype.map = function(fn){\n  var arr = [];\n  for (var i = 0; i < this.els.length; ++i) {\n    arr.push(fn(new List([this.els[i]], this.selector), i));\n  }\n  return arr;\n};\n\n/**\n * Filter elements invoking `fn(list, i)`, returning\n * a new `List` of elements when a truthy value is returned.\n *\n * @param {Function} fn\n * @return {List}\n * @api public\n */\n\nList.prototype.select =\nList.prototype.filter = function(fn){\n  var el;\n  var list = new List([], this.selector);\n  for (var i = 0; i < this.els.length; ++i) {\n    el = this.els[i];\n    if (fn(new List([el], this.selector), i)) list.els.push(el);\n  }\n  return list;\n};\n\n/**\n * Add the given class `name`.\n *\n * @param {String} name\n * @return {List} self\n * @api public\n */\n\nList.prototype.addClass = function(name){\n  var el;\n  for (var i = 0; i < this.els.length; ++i) {\n    el = this.els[i];\n    el._classes = el._classes || classes(el);\n    el._classes.add(name);\n  }\n  return this;\n};\n\n/**\n * Remove the given class `name`.\n *\n * @param {String|RegExp} name\n * @return {List} self\n * @api public\n */\n\nList.prototype.removeClass = function(name){\n  var el;\n\n  if ('regexp' == type(name)) {\n    for (var i = 0; i < this.els.length; ++i) {\n      el = this.els[i];\n      el._classes = el._classes || classes(el);\n      var arr = el._classes.array();\n      for (var j = 0; j < arr.length; j++) {\n        if (name.test(arr[j])) {\n          el._classes.remove(arr[j]);\n        }\n      }\n    }\n    return this;\n  }\n\n  for (var i = 0; i < this.els.length; ++i) {\n    el = this.els[i];\n    el._classes = el._classes || classes(el);\n    el._classes.remove(name);\n  }\n\n  return this;\n};\n\n/**\n * Toggle the given class `name`,\n * optionally a `bool` may be given\n * to indicate that the class should\n * be added when truthy.\n *\n * @param {String} name\n * @param {Boolean} bool\n * @return {List} self\n * @api public\n */\n\nList.prototype.toggleClass = function(name, bool){\n  var el;\n  var fn = 'toggle';\n\n  // toggle with boolean\n  if (2 == arguments.length) {\n    fn = bool ? 'add' : 'remove';\n  }\n\n  for (var i = 0; i < this.els.length; ++i) {\n    el = this.els[i];\n    el._classes = el._classes || classes(el);\n    el._classes[fn](name);\n  }\n\n  return this;\n};\n\n/**\n * Check if the given class `name` is present.\n *\n * @param {String} name\n * @return {Boolean}\n * @api public\n */\n\nList.prototype.hasClass = function(name){\n  var el;\n  for (var i = 0; i < this.els.length; ++i) {\n    el = this.els[i];\n    el._classes = el._classes || classes(el);\n    if (el._classes.has(name)) return true;\n  }\n  return false;\n};\n\n/**\n * Set CSS `prop` to `val` or get `prop` value.\n * Also accepts an object (`prop`: `val`)\n *\n * @param {String} prop\n * @param {Mixed} val\n * @return {List|String}\n * @api public\n */\n\nList.prototype.css = function(prop, val){\n  if (2 == arguments.length) {\n    var obj = {};\n    obj[prop] = val;\n    return this.setStyle(obj);\n  }\n\n  if ('object' == type(prop)) {\n    return this.setStyle(prop);\n  }\n\n  return this.getStyle(prop);\n};\n\n/**\n * Set CSS `props`.\n *\n * @param {Object} props\n * @return {List} self\n * @api private\n */\n\nList.prototype.setStyle = function(props){\n  for (var i = 0; i < this.els.length; ++i) {\n    css(this.els[i], props);\n  }\n  return this;\n};\n\n/**\n * Get CSS `prop` value.\n *\n * @param {String} prop\n * @return {String}\n * @api private\n */\n\nList.prototype.getStyle = function(prop){\n  var el = this.els[0];\n  if (el) return el.style[prop];\n};\n\n/**\n * Find children matching the given `selector`.\n *\n * @param {String} selector\n * @return {List}\n * @api public\n */\n\nList.prototype.find = function(selector){\n  return dom(selector, this);\n};\n\n/**\n * Empty the dom list\n *\n * @return self\n * @api public\n */\n\nList.prototype.empty = function(){\n  var elem, el;\n\n  for (var i = 0; i < this.els.length; ++i) {\n    el = this.els[i];\n    while (el.firstChild) {\n      el.removeChild(el.firstChild);\n    }\n  }\n\n  return this;\n}\n\n/**\n * Attribute accessors.\n */\n\nattrs.forEach(function(name){\n  List.prototype[name] = function(val){\n    if (0 == arguments.length) return this.attr(name);\n    return this.attr(name, val);\n  };\n});\n\n//@ sourceURL=component-dom/index.js"
));
require.register("component-throttle/index.js", Function("exports, require, module",
"\n/**\n * Module exports.\n */\n\nmodule.exports = throttle;\n\n/**\n * Returns a new function that, when invoked, invokes `func` at most one time per\n * `wait` milliseconds.\n *\n * @param {Function} func The `Function` instance to wrap.\n * @param {Number} wait The minimum number of milliseconds that must elapse in between `func` invokations.\n * @return {Function} A new function that wraps the `func` function passed in.\n * @api public\n */\n\nfunction throttle (func, wait) {\n  var rtn; // return value\n  var last = 0; // last invokation timestamp\n  return function throttled () {\n    var now = new Date().getTime();\n    var delta = now - last;\n    if (delta >= wait) {\n      rtn = func.apply(this, arguments);\n      last = now;\n    }\n    return rtn;\n  };\n}\n//@ sourceURL=component-throttle/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar index = require('indexof');\n\n/**\n * Expose `Emitter`.\n */\n\nmodule.exports = Emitter;\n\n/**\n * Initialize a new `Emitter`.\n *\n * @api public\n */\n\nfunction Emitter(obj) {\n  if (obj) return mixin(obj);\n};\n\n/**\n * Mixin the emitter properties.\n *\n * @param {Object} obj\n * @return {Object}\n * @api private\n */\n\nfunction mixin(obj) {\n  for (var key in Emitter.prototype) {\n    obj[key] = Emitter.prototype[key];\n  }\n  return obj;\n}\n\n/**\n * Listen on the given `event` with `fn`.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.on = function(event, fn){\n  this._callbacks = this._callbacks || {};\n  (this._callbacks[event] = this._callbacks[event] || [])\n    .push(fn);\n  return this;\n};\n\n/**\n * Adds an `event` listener that will be invoked a single\n * time then automatically removed.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.once = function(event, fn){\n  var self = this;\n  this._callbacks = this._callbacks || {};\n\n  function on() {\n    self.off(event, on);\n    fn.apply(this, arguments);\n  }\n\n  fn._off = on;\n  this.on(event, on);\n  return this;\n};\n\n/**\n * Remove the given callback for `event` or all\n * registered callbacks.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.off =\nEmitter.prototype.removeListener =\nEmitter.prototype.removeAllListeners = function(event, fn){\n  this._callbacks = this._callbacks || {};\n\n  // all\n  if (0 == arguments.length) {\n    this._callbacks = {};\n    return this;\n  }\n\n  // specific event\n  var callbacks = this._callbacks[event];\n  if (!callbacks) return this;\n\n  // remove all handlers\n  if (1 == arguments.length) {\n    delete this._callbacks[event];\n    return this;\n  }\n\n  // remove specific handler\n  var i = index(callbacks, fn._off || fn);\n  if (~i) callbacks.splice(i, 1);\n  return this;\n};\n\n/**\n * Emit `event` with the given args.\n *\n * @param {String} event\n * @param {Mixed} ...\n * @return {Emitter}\n */\n\nEmitter.prototype.emit = function(event){\n  this._callbacks = this._callbacks || {};\n  var args = [].slice.call(arguments, 1)\n    , callbacks = this._callbacks[event];\n\n  if (callbacks) {\n    callbacks = callbacks.slice(0);\n    for (var i = 0, len = callbacks.length; i < len; ++i) {\n      callbacks[i].apply(this, args);\n    }\n  }\n\n  return this;\n};\n\n/**\n * Return array of callbacks for `event`.\n *\n * @param {String} event\n * @return {Array}\n * @api public\n */\n\nEmitter.prototype.listeners = function(event){\n  this._callbacks = this._callbacks || {};\n  return this._callbacks[event] || [];\n};\n\n/**\n * Check if this emitter has `event` handlers.\n *\n * @param {String} event\n * @return {Boolean}\n * @api public\n */\n\nEmitter.prototype.hasListeners = function(event){\n  return !! this.listeners(event).length;\n};\n//@ sourceURL=component-emitter/index.js"
));
require.register("component-file/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar file = require('./file')\n  , reader = require('./reader');\n\n/**\n * Expose `file()`.\n */\n\nexports = module.exports = file;\n\n/**\n * Expose `reader()`.\n */\n\nexports.reader = reader;//@ sourceURL=component-file/index.js"
));
require.register("component-file/file.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Emitter = require('emitter')\n  , Reader = require('./reader');\n\n/**\n * Expose `file()`.\n */\n\nmodule.exports = file;\n\n/**\n * Initialize a new `File` wrapping `file`.\n *\n * @param {File} file\n * @return {File}\n * @api public\n */\n\nfunction file(file) {\n  return new File(file);\n}\n\n/**\n * Initialize a new `File` wrapper.\n *\n * @param {File} file\n * @api private\n */\n\nfunction File(file) {\n  Emitter.call(this);\n  this.file = file;\n  for (var key in file) this[key] = file[key];\n}\n\n/**\n * Inherits from `Emitter.prototype`.\n */\n\nFile.prototype.__proto__ = Emitter.prototype;\n\n/**\n * Check if the mime type matches `type`.\n *\n * Examples:\n *\n *    file.is('image/jpeg')\n *    file.is('image/*')\n *\n * @param {String} type\n * @return {Boolean}\n * @api public\n */\n\nFile.prototype.is = function(type){\n  var real = this.file.type;\n\n  // identical\n  if (type == real) return true;\n\n  real = real.split('/');\n  type = type.split('/');\n\n  // type/*\n  if (type[0] == real[0] && type[1] == '*') return true;\n\n  // */subtype\n  if (type[1] == real[1] && type[0] == '*') return true;\n\n  return false;\n};\n\n/**\n * Convert to `type` and invoke `fn(err, result)`.\n *\n * @param {String} type\n * @param {Function} fn\n * @return {Reader}\n * @api private\n */\n\nFile.prototype.to = function(type, fn){\n  if (!window.FileReader) return fn();\n  var reader = Reader();\n  reader.on('error', fn);\n  reader.on('end', function(res){ fn(null, res) });\n  reader.read(this.file, type);\n  return reader;\n};\n\n/**\n * Convert to an `ArrayBuffer`.\n *\n * @param {Function} fn\n * @return {Reader}\n * @api public\n */\n\nFile.prototype.toArrayBuffer = function(fn){\n  return this.to('ArrayBuffer', fn);\n};\n\n/**\n * Convert to text.\n *\n * @param {Function} fn\n * @return {Reader}\n * @api public\n */\n\nFile.prototype.toText = function(fn){\n  // TODO: encoding\n  return this.to('Text', fn);\n};\n\n/**\n * Convert to a data uri.\n *\n * @param {Function} fn\n * @return {Reader}\n * @api public\n */\n\nFile.prototype.toDataURL = function(fn){\n  return this.to('DataURL', fn);\n};\n//@ sourceURL=component-file/file.js"
));
require.register("component-file/reader.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Emitter = require('emitter');\n\n/**\n * Expose `reader()`.\n */\n\nmodule.exports = reader;\n\n/**\n * Initialize a new `Reader` from optional `reader`\n * or a new `FileReader` is created.\n *\n * @param {FileReader} reader\n * @return {Reader}\n * @api public\n */\n\nfunction reader(reader) {\n  return reader\n    ? new Reader(reader)\n    : new Reader(new FileReader);\n}\n\n/**\n * Initialize a new `Reader`, a wrapper\n * around a `FileReader`.\n *\n * Emits:\n *\n *   - `error` an error occurred\n *   - `progress` in progress (`e.percent` etc)\n *   - `end` read is complete\n *\n * @param {FileReader} reader\n * @api private\n */\n\nfunction Reader(reader) {\n  Emitter.call(this);\n  this.reader = reader;\n  reader.onerror = this.emit.bind(this, 'error');\n  reader.onabort = this.emit.bind(this, 'error', new Error('abort'));\n  reader.onprogress = this.onprogress.bind(this);\n  reader.onload = this.onload.bind(this);\n}\n\n/**\n * Inherits from `Emitter.prototype`.\n */\n\nReader.prototype.__proto__ = Emitter.prototype;\n\n/**\n * Onload handler.\n * \n * @api private\n */\n\nReader.prototype.onload = function(e){\n  this.emit('end', this.reader.result);\n};\n\n/**\n * Progress handler.\n * \n * @api private\n */\n\nReader.prototype.onprogress = function(e){\n  e.percent = e.loaded / e.total * 100 | 0;\n  this.emit('progress', e);\n};\n\n/**\n * Abort.\n *\n * @api public\n */\n\nReader.prototype.abort = function(){\n  this.reader.abort();\n};\n\n/**\n * Read `file` as `type`.\n *\n * @param {File} file\n * @param {String} type\n * @api private\n */\n\nReader.prototype.read = function(file, type){\n  var method = 'readAs' + type;\n  this.reader[method](file);\n};\n\n//@ sourceURL=component-file/reader.js"
));
require.register("component-event-manager/index.js", Function("exports, require, module",
"\n\n/**\n * Expose `EventManager`.\n */\n\nmodule.exports = EventManager;\n\n/**\n * Initialize an `EventManager` with the given\n * `target` object which events will be bound to,\n * and the `obj` which will receive method calls.\n *\n * @param {Object} target\n * @param {Object} obj\n * @api public\n */\n\nfunction EventManager(target, obj) {\n  this.target = target;\n  this.obj = obj;\n  this._bindings = {};\n}\n\n/**\n * Register bind function.\n *\n * @param {Function} fn\n * @return {EventManager} self\n * @api public\n */\n\nEventManager.prototype.onbind = function(fn){\n  this._bind = fn;\n  return this;\n};\n\n/**\n * Register unbind function.\n *\n * @param {Function} fn\n * @return {EventManager} self\n * @api public\n */\n\nEventManager.prototype.onunbind = function(fn){\n  this._unbind = fn;\n  return this;\n};\n\n/**\n * Bind to `event` with optional `method` name.\n * When `method` is undefined it becomes `event`\n * with the \"on\" prefix.\n *\n *    events.bind('login') // implies \"onlogin\"\n *    events.bind('login', 'onLogin')\n *\n * @param {String} event\n * @param {String} [method]\n * @return {Function} callback\n * @api public\n */\n\nEventManager.prototype.bind = function(event, method){\n  var fn = this.addBinding.apply(this, arguments);\n  if (this._onbind) this._onbind(event, method, fn);\n  this._bind(event, fn);\n  return fn;\n};\n\n/**\n * Add event binding.\n *\n * @param {String} event\n * @param {String} method\n * @return {Function} callback\n * @api private\n */\n\nEventManager.prototype.addBinding = function(event, method){\n  var obj = this.obj;\n  var method = method || 'on' + event;\n  var args = [].slice.call(arguments, 2);\n\n  // callback\n  function callback() {\n    var a = [].slice.call(arguments).concat(args);\n    obj[method].apply(obj, a);\n  }\n\n  // subscription\n  this._bindings[event] = this._bindings[event] || {};\n  this._bindings[event][method] = callback;\n\n  return callback;\n};\n\n/**\n * Unbind a single binding, all bindings for `event`,\n * or all bindings within the manager.\n *\n *     evennts.unbind('login', 'onLogin')\n *     evennts.unbind('login')\n *     evennts.unbind()\n *\n * @param {String} [event]\n * @param {String} [method]\n * @return {Function} callback\n * @api public\n */\n\nEventManager.prototype.unbind = function(event, method){\n  if (0 == arguments.length) return this.unbindAll();\n  if (1 == arguments.length) return this.unbindAllOf(event);\n  var fn = this._bindings[event][method];\n  if (this._onunbind) this._onunbind(event, method, fn);\n  this._unbind(event, fn);\n  return fn;\n};\n\n/**\n * Unbind all events.\n *\n * @api private\n */\n\nEventManager.prototype.unbindAll = function(){\n  for (var event in this._bindings) {\n    this.unbindAllOf(event);\n  }\n};\n\n/**\n * Unbind all events for `event`.\n *\n * @param {String} event\n * @api private\n */\n\nEventManager.prototype.unbindAllOf = function(event){\n  var bindings = this._bindings[event];\n  if (!bindings) return;\n  for (var method in bindings) {\n    this.unbind(event, method);\n  }\n};\n//@ sourceURL=component-event-manager/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Manager = require('event-manager')\n  , event = require('event');\n\n/**\n * Return a new event manager.\n */\n\nmodule.exports = function(target, obj){\n  var manager = new Manager(target, obj);\n\n  manager.onbind(function(name, fn){\n    event.bind(target, name, fn);\n  });\n\n  manager.onunbind(function(name, fn){\n    event.unbind(target, name, fn);\n  });\n\n  return manager;\n};\n//@ sourceURL=component-events/index.js"
));
require.register("component-upload/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Emitter = require('emitter');\n\n/**\n * Expose `Upload`.\n */\n\nmodule.exports = Upload;\n\n/**\n * Initialize a new `Upload` file`.\n * This represents a single file upload.\n *\n * Events:\n *\n *   - `error` an error occurred\n *   - `abort` upload was aborted\n *   - `progress` upload in progress (`e.percent` etc)\n *   - `end` upload is complete\n *\n * @param {File} file\n * @api private\n */\n\nfunction Upload(file) {\n  if (!(this instanceof Upload)) return new Upload(file);\n  Emitter.call(this);\n  this.file = file;\n  file.slice = file.slice || file.webkitSlice;\n}\n\n/**\n * Mixin emitter.\n */\n\nEmitter(Upload.prototype);\n\n/**\n * Upload to the given `path`.\n *\n * @param {String} path\n * @param {Function} [fn]\n * @api public\n */\n\nUpload.prototype.to = function(path, fn){\n  // TODO: x-browser\n  var self = this;\n  fn = fn || function(){};\n  var req = this.req = new XMLHttpRequest;\n  req.open('POST', path);\n  req.onload = this.onload.bind(this);\n  req.onerror = this.onerror.bind(this);\n  req.upload.onprogress = this.onprogress.bind(this);\n  req.onreadystatechange = function(){\n    if (4 == req.readyState) {\n      var type = req.status / 100 | 0;\n      if (2 == type) return fn(null, req);\n      var err = new Error(req.statusText + ': ' + req.response);\n      err.status = req.status;\n      fn(err);\n    }\n  };\n  var body = new FormData;\n  body.append('file', this.file);\n  req.send(body);\n};\n\n/**\n * Abort the XHR.\n *\n * @api public\n */\n\nUpload.prototype.abort = function(){\n  this.emit('abort');\n  this.req.abort();\n};\n\n/**\n * Error handler.\n *\n * @api private\n */\n\nUpload.prototype.onerror = function(e){\n  this.emit('error', e);\n};\n\n/**\n * Onload handler.\n *\n * @api private\n */\n\nUpload.prototype.onload = function(e){\n  this.emit('end', this.req);\n};\n\n/**\n * Progress handler.\n *\n * @api private\n */\n\nUpload.prototype.onprogress = function(e){\n  e.percent = e.loaded / e.total * 100;\n  this.emit('progress', e);\n};\n//@ sourceURL=component-upload/index.js"
));
require.register("component-dropload/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Emitter = require('emitter')\n  , classes = require('classes')\n  , Upload = require('upload')\n  , events = require('events')\n\n/**\n * Expose `Dropload`.\n */\n\nmodule.exports = Dropload;\n\n/**\n * Types.\n */\n\nvar typeMap = {\n  'text/plain': 'text',\n  'text/uri-list': 'url',\n  'text/html': 'html'\n};\n\n/**\n * Initialize a drop point\n * on the given `el`.\n *\n * Emits:\n *\n *   - `error` on validation error\n *   - `upload` passing an `Upload`\n *\n * @param {Element} el\n * @api public\n */\n\nfunction Dropload(el) {\n  if (!(this instanceof Dropload)) return new Dropload(el);\n  Emitter.call(this);\n  this.el = el;\n  this.classes = classes(el);\n  this.events = events(el, this);\n  this.events.bind('drop');\n  this.events.bind('dragenter');\n  this.events.bind('dragleave');\n  this.events.bind('dragover');\n  this.ignored = {};\n}\n\n/**\n * Mixin emitter.\n */\n\nEmitter(Dropload.prototype);\n\n/**\n * Ignore `name`.\n *\n * @param {String} name\n * @api private\n */\n\nDropload.prototype.ignore = function(name){\n  this.ignored[name] = true;\n};\n\n/**\n * Check if `name` is ignored.\n *\n * @param {String} name\n * @return {Boolean}\n * @api private\n */\n\nDropload.prototype.ignoring = function(name){\n  return !! this.ignored[name];\n};\n\n/**\n * Unbind event handlers.\n *\n * @api public\n */\n\nDropload.prototype.unbind = function(){\n  this.events.unbind();\n};\n\n/**\n * Dragenter handler.\n */\n\nDropload.prototype.ondragenter = function(e){\n  this.classes.add('over');\n};\n\n/**\n * Dragover handler.\n */\n\nDropload.prototype.ondragover = function(e){\n  e.preventDefault();\n};\n\n/**\n * Dragleave handler.\n */\n\nDropload.prototype.ondragleave = function(e){\n  this.classes.remove('over');\n};\n\n/**\n * Drop handler.\n */\n\nDropload.prototype.ondrop = function(e){\n  e.stopPropagation();\n  e.preventDefault();\n  this.classes.remove('over');\n  var items = e.dataTransfer.items;\n  var files = e.dataTransfer.files;\n  if (items) this.directories(items);\n  if (items) this.items(items);\n  if (files) this.upload(files);\n  this.ignored = {};\n};\n\n/**\n * Walk directories and upload files.\n *\n * Directories are considered \"files\",\n * non-files return null for .webkitGetAsEntry()\n * for example when dragging urls.\n *\n * @param {DataTransferItemList} items\n * @api private\n */\n\nDropload.prototype.directories = function(items){\n  for (var i = 0; i < items.length; i++) {\n    var item = items[i];\n\n    if ('file' != item.kind) continue;\n\n    if (!item.webkitGetAsEntry) continue;\n    var entry = item.webkitGetAsEntry();\n\n    if (entry.isDirectory) {\n      this.ignore(entry.name);\n      this.walkEntry(entry);\n    }\n  }\n};\n\n/**\n * Handle the given `items`.\n *\n * @param {DataTransferItemList}\n * @api private\n */\n\nDropload.prototype.items = function(items){\n  for (var i = 0; i < items.length; i++) {\n    var item = items[i];\n    this.item(item);\n  }\n};\n\n/**\n * Walk file entry recursively.\n *\n * @param {FileEntry} item\n * @api private\n */\n\nDropload.prototype.walkEntry = function(item){\n  var self = this;\n\n  if (item.isFile) {\n    return item.file(function(file){\n      file.entry = item;\n      self.upload([file]);\n    });\n  }\n\n  if (item.isDirectory) {\n    var dir = item.createReader();\n    dir.readEntries(function(entries){\n      for (var i = 0; i < entries.length; i++) {\n        var name = entries[i].name;\n        if ('.' == name[0]) continue;\n        self.walkEntry(entries[i]);\n      }\n    })\n  }\n};\n\n/**\n * Handle `item`.\n *\n * @param {Object} item\n * @api private\n */\n\nDropload.prototype.item = function(item){\n  var self = this;\n  var type = typeMap[item.type];\n  item.getAsString(function(str){\n    self.emit(type, str, item);\n  });\n};\n\n/**\n * Upload the given `files`.\n *\n * Presents each `file` in the FileList\n * as an `Upload` via the \"upload\" event\n * after it has been validated.\n *\n * @param {FileList} files\n * @api public\n */\n\nDropload.prototype.upload = function(files){\n  for (var i = 0; i < files.length; i++) {\n    var file = files[i];\n    if (this.ignoring(file.name)) continue;\n    this.emit('upload', new Upload(file));\n  }\n};\n//@ sourceURL=component-dropload/index.js"
));
require.register("component-drop-anywhere/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Dropload = require('dropload')\n  , events = require('events');\n\n/**\n * Expose `DropAnywhere`.\n */\n\nmodule.exports = DropAnywhere;\n\n/**\n * Make the document droppable and invoke `fn(err, upload)`.\n *\n * @param {Function} fn\n * @api public\n */\n\nfunction DropAnywhere(fn) {\n  if (!(this instanceof DropAnywhere)) return new DropAnywhere(fn);\n  this.callback = fn;\n  this.el = document.createElement('div');\n  this.el.id = 'drop-anywhere';\n  this.events = events(this.el, this);\n  this.docEvents = events(document.body, this);\n  this.events.bind('click', 'hide');\n  this.events.bind('drop', 'hide');\n  this.events.bind('dragleave', 'hide');\n  this.docEvents.bind('dragenter', 'show');\n  this.drop = Dropload(this.el);\n  this.drop.on('error', fn);\n  this.handle('upload');\n  this.handle('text');\n  this.handle('html');\n  this.handle('url');\n  this.add();\n}\n\n/**\n * Handle the given item `type`.\n *\n * @param {String} type\n * @api private\n */\n\nDropAnywhere.prototype.handle = function(type){\n  var self = this;\n  this.drop.on(type, function(item){\n    self.callback(null, {\n      type: type,\n      item: item\n    });\n  });\n};\n\n/**\n * Add the element.\n */\n\nDropAnywhere.prototype.add = function(){\n  document.body.appendChild(this.el);\n};\n\n/**\n * Remove the element.\n */\n\nDropAnywhere.prototype.remove = function(){\n  document.body.removeChild(this.el);\n};\n\n/**\n * Show the dropzone.\n */\n\nDropAnywhere.prototype.show = function(){\n  this.el.className = 'show';\n};\n\n/**\n * Hide the dropzone.\n */\n\nDropAnywhere.prototype.hide = function(){\n  this.el.className = '';\n};\n\n/**\n * Unbind.\n *\n * @api public\n */\n\nDropAnywhere.prototype.unbind = function(){\n  this.remove();\n  this.docEvents.unbind();\n  this.events.unbind();\n  this.drop.unbind();\n};\n//@ sourceURL=component-drop-anywhere/index.js"
));
require.register("mousehouse/app.js", Function("exports, require, module",
"/// drop\n\nvar dropAnywhere = require('drop-anywhere')\n  , file = require('file')\n  , throttle = require('throttle')\n  , dom = require('dom')\n\n\nvar drop = dropAnywhere(function(err, drop){\n  var img = file(drop.item.file);\n  if (!img.is('image/*')) {\n    console.error(\"Images Only, dogg\");\n    return\n  }\n  var reader = img.toDataURL(function(err, str){\n    if (err) throw err;\n    console.log(str);\n    document.body.style.backgroundImage = 'url(' + str + ')';\n    var img = new Image()\n    img.src = str;\n    img.onload = function() {\n      console.log(img.height);\n      console.log(img.width);\n    }\n  });\n});\n\n\nwindow.awesome = function() {\n  dom('img').addClass('awesome')\n}\n//@ sourceURL=mousehouse/app.js"
));
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

