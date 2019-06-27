(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var DataFactory = require('./lib/data-factory')

module.exports = DataFactory

},{"./lib/data-factory":3}],2:[function(require,module,exports){
function BlankNode (id) {
  this.value = id || ('b' + (++BlankNode.nextId))
}

BlankNode.prototype.equals = function (other) {
  return !!other && other.termType === this.termType && other.value === this.value
}

BlankNode.prototype.termType = 'BlankNode'

BlankNode.nextId = 0

module.exports = BlankNode

},{}],3:[function(require,module,exports){
var BlankNode = require('./blank-node')
var DefaultGraph = require('./default-graph')
var Literal = require('./literal')
var NamedNode = require('./named-node')
var Quad = require('./quad')
var Variable = require('./variable')

function DataFactory () {}

DataFactory.namedNode = function (value) {
  return new NamedNode(value)
}

DataFactory.blankNode = function (value) {
  return new BlankNode(value)
}

DataFactory.literal = function (value, languageOrDatatype) {
  if (typeof languageOrDatatype === 'string') {
    if (languageOrDatatype.indexOf(':') === -1) {
      return new Literal(value, languageOrDatatype)
    }

    return new Literal(value, null, DataFactory.namedNode(languageOrDatatype))
  }

  return new Literal(value, null, languageOrDatatype)
}

DataFactory.defaultGraph = function () {
  return DataFactory.defaultGraphInstance
}

DataFactory.variable = function (value) {
  return new Variable(value)
}

DataFactory.triple = function (subject, predicate, object) {
  return DataFactory.quad(subject, predicate, object)
}

DataFactory.quad = function (subject, predicate, object, graph) {
  return new Quad(subject, predicate, object, graph || DataFactory.defaultGraphInstance)
}

DataFactory.defaultGraphInstance = new DefaultGraph()

module.exports = DataFactory

},{"./blank-node":2,"./default-graph":4,"./literal":5,"./named-node":6,"./quad":7,"./variable":8}],4:[function(require,module,exports){
function DefaultGraph () {
  this.value = ''
}

DefaultGraph.prototype.equals = function (other) {
  return !!other && other.termType === this.termType
}

DefaultGraph.prototype.termType = 'DefaultGraph'

module.exports = DefaultGraph

},{}],5:[function(require,module,exports){
var NamedNode = require('./named-node')

function Literal (value, language, datatype) {
  this.value = value
  this.datatype = Literal.stringDatatype
  this.language = ''

  if (language) {
    this.language = language
    this.datatype = Literal.langStringDatatype
  } else if (datatype) {
    this.datatype = datatype
  }
}

Literal.prototype.equals = function (other) {
  return !!other && other.termType === this.termType && other.value === this.value &&
    other.language === this.language && other.datatype.equals(this.datatype)
}

Literal.prototype.termType = 'Literal'
Literal.langStringDatatype = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString')
Literal.stringDatatype = new NamedNode('http://www.w3.org/2001/XMLSchema#string')

module.exports = Literal

},{"./named-node":6}],6:[function(require,module,exports){
function NamedNode (iri) {
  this.value = iri
}

NamedNode.prototype.equals = function (other) {
  return !!other && other.termType === this.termType && other.value === this.value
}

NamedNode.prototype.termType = 'NamedNode'

module.exports = NamedNode

},{}],7:[function(require,module,exports){
var DefaultGraph = require('./default-graph')

function Quad (subject, predicate, object, graph) {
  this.subject = subject
  this.predicate = predicate
  this.object = object

  if (graph) {
    this.graph = graph
  } else {
    this.graph = new DefaultGraph()
  }
}

Quad.prototype.equals = function (other) {
  return !!other && other.subject.equals(this.subject) && other.predicate.equals(this.predicate) &&
    other.object.equals(this.object) && other.graph.equals(this.graph)
}

module.exports = Quad

},{"./default-graph":4}],8:[function(require,module,exports){
function Variable (name) {
  this.value = name
}

Variable.prototype.equals = function (other) {
  return !!other && other.termType === this.termType && other.value === this.value
}

Variable.prototype.termType = 'Variable'

module.exports = Variable

},{}],9:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],10:[function(require,module,exports){

},{}],11:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":9,"buffer":11,"ieee754":14}],12:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":16}],13:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],14:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],15:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],16:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],17:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],18:[function(require,module,exports){
// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.
require('whatwg-fetch');
module.exports = self.fetch.bind(self);

},{"whatwg-fetch":63}],19:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./lib/ContextParser"));
__export(require("./lib/FetchDocumentLoader"));

},{"./lib/ContextParser":20,"./lib/FetchDocumentLoader":21}],20:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("isomorphic-fetch");
const relative_to_absolute_iri_1 = require("relative-to-absolute-iri");
const FetchDocumentLoader_1 = require("./FetchDocumentLoader");
/**
 * Parses JSON-LD contexts.
 */
class ContextParser {
    constructor(options) {
        options = options || {};
        this.documentLoader = options.documentLoader || new FetchDocumentLoader_1.FetchDocumentLoader();
        this.documentCache = {};
        this.validate = !options.skipValidation;
        this.expandContentTypeToBase = options.expandContentTypeToBase;
    }
    /**
     * Get the prefix from the given term.
     * @see https://json-ld.org/spec/latest/json-ld/#compact-iris
     * @param {string} term A term that is an URL or a prefixed URL.
     * @param {IJsonLdContextNormalized} context A context.
     * @return {string} The prefix or null.
     */
    static getPrefix(term, context) {
        const separatorPos = term.indexOf(':');
        if (separatorPos >= 0) {
            // Suffix can not begin with two slashes
            if (term.length > separatorPos + 1
                && term.charAt(separatorPos + 1) === '/'
                && term.charAt(separatorPos + 2) === '/') {
                return null;
            }
            const prefix = term.substr(0, separatorPos);
            // Prefix can not be an underscore (this is a blank node)
            if (prefix === '_') {
                return null;
            }
            // Prefix must match a term in the active context
            if (context[prefix]) {
                return prefix;
            }
        }
        return null;
    }
    /**
     * From a given context entry value, get the string value, or the @id field.
     * @param contextValue A value for a term in a context.
     * @return {string} The id value, or null.
     */
    static getContextValueId(contextValue) {
        if (contextValue === null || typeof contextValue === 'string') {
            return contextValue;
        }
        const id = contextValue['@id'];
        return id ? id : null;
    }
    /**
     * Expand the term or prefix of the given term if it has one,
     * otherwise return the term as-is.
     *
     * Iff in vocab-mode, then other references to other terms in the context can be used,
     * such as to `myTerm`:
     * ```
     * {
     *   "myTerm": "http://example.org/myLongTerm"
     * }
     * ```
     *
     * @param {string} term A term that is an URL or a prefixed URL.
     * @param {IJsonLdContextNormalized} context A context.
     * @param {boolean} vocab If the term is a predicate or type and should be expanded based on @vocab,
     *                        otherwise it is considered a regular term that is expanded based on @base.
     * @return {string} The expanded term, the term as-is, or null if it was explicitly disabled in the context.
     */
    static expandTerm(term, context, vocab) {
        const contextValue = context[term];
        // Immediately return if the term was disabled in the context
        if (contextValue === null || (contextValue && contextValue['@id'] === null)) {
            return null;
        }
        // Check the @id
        if (contextValue && vocab) {
            const value = this.getContextValueId(contextValue);
            if (value && value !== term) {
                return value;
            }
        }
        // Check if the term is prefixed
        const prefix = ContextParser.getPrefix(term, context);
        if (prefix) {
            const value = this.getContextValueId(context[prefix]);
            if (value) {
                return value + term.substr(prefix.length + 1);
            }
        }
        else if (vocab && context['@vocab'] && term.charAt(0) !== '@' && term.indexOf(':') < 0) {
            return context['@vocab'] + term;
        }
        else if (!vocab && context['@base'] && term.charAt(0) !== '@' && term.indexOf(':') < 0) {
            return relative_to_absolute_iri_1.resolve(term, context['@base']);
        }
        return term;
    }
    /**
     * Compact the given term using @base, @vocab, an aliased term, or a prefixed term.
     * @param {string} iri An IRI to compact.
     * @param {IJsonLdContextNormalized} context The context to compact with.
     * @param {boolean} vocab If the term is a predicate or type and should be compacted based on @vocab,
     *                        otherwise it is considered a regular term that is compacted based on @base.
     * @return {string} The compacted term or the IRI as-is.
     */
    static compactIri(iri, context, vocab) {
        // Try @vocab compacting
        if (vocab && context['@vocab'] && iri.startsWith(context['@vocab'])) {
            return iri.substr(context['@vocab'].length);
        }
        // Try @base compacting
        if (!vocab && context['@base'] && iri.startsWith(context['@base'])) {
            return iri.substr(context['@base'].length);
        }
        // Loop over all terms in the context
        for (const key in context) {
            const value = context[key];
            if (value && !key.startsWith('@')) {
                const contextIri = this.getContextValueId(value);
                if (iri.startsWith(contextIri)) {
                    const suffix = iri.substr(contextIri.length);
                    if (!suffix) {
                        if (vocab) {
                            // Compact aliased term
                            return key;
                        }
                    }
                    else {
                        // Compact prefixed term
                        return key + ':' + suffix;
                    }
                }
            }
        }
        return iri;
    }
    /**
     * Check if the given context value can be a prefix value.
     * @param value A context value.
     * @return {boolean} If it can be a prefix value.
     */
    static isPrefixValue(value) {
        return value && (typeof value === 'string' || value['@id'] || value['@type']);
    }
    /**
     * Check if the given IRI is valid.
     * @param {string} iri A potential IRI.
     * @return {boolean} If the given IRI is valid.
     */
    static isValidIri(iri) {
        return ContextParser.IRI_REGEX.test(iri);
    }
    /**
     * Add an @id term for all @reverse terms.
     * @param {IJsonLdContextNormalized} context A context.
     * @return {IJsonLdContextNormalized} The mutated input context.
     */
    static idifyReverseTerms(context) {
        for (const key of Object.keys(context)) {
            const value = context[key];
            if (value && typeof value === 'object') {
                if (value['@reverse'] && !value['@id']) {
                    if (typeof value['@reverse'] !== 'string') {
                        throw new Error(`Invalid @reverse value: '${value['@reverse']}'`);
                    }
                    value['@id'] = value['@reverse'];
                    value['@reverse'] = true;
                }
            }
        }
        return context;
    }
    /**
     * Expand all prefixed terms in the given context.
     * @param {IJsonLdContextNormalized} context A context.
     * @param {boolean} expandContentTypeToBase If @type inside the context may be expanded
     *                                          via @base if @vocab is set to null.
     * @return {IJsonLdContextNormalized} The mutated input context.
     */
    static expandPrefixedTerms(context, expandContentTypeToBase) {
        for (const key of Object.keys(context)) {
            // Only expand allowed keys
            if (ContextParser.EXPAND_KEYS_BLACKLIST.indexOf(key) < 0) {
                // Error if we try to alias a keyword to something else.
                if (key[0] === '@' && ContextParser.ALIAS_KEYS_BLACKLIST.indexOf(key) >= 0) {
                    throw new Error(`Keywords can not be aliased to something else.
Tried mapping ${key} to ${context[key]}`);
                }
                // Loop because prefixes might be nested
                while (ContextParser.isPrefixValue(context[key])) {
                    const value = context[key];
                    let changed = false;
                    if (typeof value === 'string') {
                        context[key] = ContextParser.expandTerm(value, context, true);
                        changed = changed || value !== context[key];
                    }
                    else {
                        const id = value['@id'];
                        const type = value['@type'];
                        if (id) {
                            context[key]['@id'] = ContextParser.expandTerm(id, context, true);
                            changed = changed || id !== context[key]['@id'];
                        }
                        if (type && type !== '@vocab') {
                            // First check @vocab, then fallback to @base
                            context[key]['@type'] = ContextParser.expandTerm(type, context, true);
                            if (expandContentTypeToBase && type === context[key]['@type']) {
                                context[key]['@type'] = ContextParser.expandTerm(type, context, false);
                            }
                            changed = changed || type !== context[key]['@type'];
                        }
                    }
                    if (!changed) {
                        break;
                    }
                }
            }
        }
        return context;
    }
    /**
     * Validate the entries of the given context.
     * @param {IJsonLdContextNormalized} context A context.
     */
    static validate(context) {
        for (const key of Object.keys(context)) {
            const value = context[key];
            const valueType = typeof value;
            // First check if the key is a keyword
            if (key[0] === '@') {
                switch (key.substr(1)) {
                    case 'vocab':
                        if (value !== null && valueType !== 'string') {
                            throw new Error(`Found an invalid @vocab IRI: ${value}`);
                        }
                        break;
                    case 'base':
                        if (value !== null && valueType !== 'string') {
                            throw new Error(`Found an invalid @base IRI: ${context[key]}`);
                        }
                        break;
                    case 'language':
                        if (value !== null && valueType !== 'string') {
                            throw new Error(`Found an invalid @language string: ${value}`);
                        }
                        break;
                }
            }
            // Otherwise, consider the key a term
            if (value !== null) {
                switch (valueType) {
                    case 'string':
                        // Always valid
                        break;
                    case 'object':
                        if (key.indexOf(':') < 0 && !('@id' in value)
                            && (value['@type'] === '@id' ? !context['@base'] : !context['@vocab'])) {
                            throw new Error(`Missing @id in context entry: '${key}': '${JSON.stringify(value)}'`);
                        }
                        for (const objectKey of Object.keys(value)) {
                            const objectValue = value[objectKey];
                            if (!objectValue) {
                                continue;
                            }
                            switch (objectKey) {
                                case '@id':
                                    if (objectValue[0] === '@' && objectValue !== '@type' && objectValue !== '@id') {
                                        throw new Error(`Illegal keyword alias in term value, found: '${key}': '${JSON.stringify(value)}'`);
                                    }
                                    break;
                                case '@type':
                                    if (objectValue !== '@id' && objectValue !== '@vocab'
                                        && (objectValue[0] === '_' || !ContextParser.isValidIri(objectValue))) {
                                        throw new Error(`A context @type must be an absolute IRI, found: '${key}': '${objectValue}'`);
                                    }
                                    break;
                                case '@reverse':
                                    if (typeof objectValue === 'string' && value['@id'] && value['@id'] !== objectValue) {
                                        throw new Error(`Found non-matching @id and @reverse term values in '${key}':\
'${objectValue}' and '${value['@id']}'`);
                                    }
                                    break;
                                case '@container':
                                    if (objectValue === '@list' && value['@reverse']) {
                                        throw new Error(`Term value can not be @container: @list and @reverse at the same time on '${key}'`);
                                    }
                                    if (ContextParser.CONTAINERS.indexOf(objectValue) < 0) {
                                        throw new Error(`Invalid term @container for '${key}' ('${objectValue}'), \
must be one of ${ContextParser.CONTAINERS.join(', ')}`);
                                    }
                                    break;
                                case '@language':
                                    if (objectValue !== null && typeof objectValue !== 'string') {
                                        throw new Error(`Found an invalid term @language string in: '${key}': '${JSON.stringify(value)}'`);
                                    }
                                    break;
                            }
                        }
                        break;
                    default:
                        throw new Error(`Found an invalid term value: '${key}': '${value}'`);
                }
            }
        }
    }
    /**
     * Parse a JSON-LD context in any form.
     * @param {JsonLdContext} context A context, URL to a context, or an array of contexts/URLs.
     * @param {IParseOptions} options Optional parsing options.
     * @return {Promise<IJsonLdContextNormalized>} A promise resolving to the context.
     */
    parse(context, { baseIri, parentContext, external } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context === null || context === undefined) {
                // Context that are explicitly set to null are empty.
                return baseIri ? { '@base': baseIri } : {};
            }
            else if (typeof context === 'string') {
                // Resolve relative context URIs
                if (!ContextParser.isValidIri(context)) {
                    context = relative_to_absolute_iri_1.resolve(context, baseIri);
                    if (!ContextParser.isValidIri(context)) {
                        throw new Error(`Invalid context IRI: ${context}`);
                    }
                }
                return this.parse(yield this.load(context), { baseIri, parentContext, external: true });
            }
            else if (Array.isArray(context)) {
                // As a performance consideration, first load all external contexts in parallel.
                const contexts = yield Promise.all(context.map((subContext) => {
                    if (typeof subContext === 'string') {
                        return this.load(subContext);
                    }
                    else {
                        return subContext;
                    }
                }));
                return contexts.reduce((accContextPromise, contextEntry) => accContextPromise
                    .then((accContext) => this.parse(contextEntry, { baseIri, parentContext: accContext, external })), Promise.resolve(parentContext));
            }
            else if (typeof context === 'object') {
                if (context['@context']) {
                    return yield this.parse(context['@context'], { baseIri, parentContext, external });
                }
                // We have an actual context object.
                let newContext = {};
                // According to the JSON-LD spec, @base must be ignored from external contexts.
                if (external) {
                    delete context['@base'];
                }
                // Override the base IRI if provided.
                if (baseIri && !('@base' in newContext)) {
                    newContext['@base'] = baseIri;
                }
                newContext = Object.assign({}, newContext, parentContext, context);
                ContextParser.idifyReverseTerms(newContext);
                ContextParser.expandPrefixedTerms(newContext, this.expandContentTypeToBase);
                if (this.validate) {
                    ContextParser.validate(newContext);
                }
                return newContext;
            }
            else {
                throw new Error(`Tried parsing a context that is not a string, array or object, but got ${context}`);
            }
        });
    }
    load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = this.documentCache[url];
            if (cached) {
                return Array.isArray(cached) ? cached.slice() : Object.assign({}, cached);
            }
            return this.documentCache[url] = (yield this.documentLoader.load(url))['@context'];
        });
    }
}
// Regex for valid IRIs
ContextParser.IRI_REGEX = /^([A-Za-z][A-Za-z0-9+-.]*|_):[^ "<>{}|\\\[\]`]*$/;
// Keys in the contexts that will not be expanded based on the base IRI
ContextParser.EXPAND_KEYS_BLACKLIST = [
    '@base',
    '@vocab',
    '@language',
];
// Keys in the contexts that may not be aliased
ContextParser.ALIAS_KEYS_BLACKLIST = [
    '@container',
    '@graph',
    '@id',
    '@index',
    '@list',
    '@nest',
    '@none',
    '@prefix',
    '@reverse',
    '@set',
    '@type',
    '@value',
];
// All valid @container values
ContextParser.CONTAINERS = [
    '@list',
    '@set',
    '@index',
    '@language',
];
exports.ContextParser = ContextParser;

},{"./FetchDocumentLoader":21,"isomorphic-fetch":18,"relative-to-absolute-iri":57}],21:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("isomorphic-fetch");
/**
 * Loads documents via the fetch API.
 */
class FetchDocumentLoader {
    load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(url, { headers: { accept: 'application/ld+json' } });
            if (response.ok) {
                return (yield response.json());
            }
            else {
                throw new Error(`No valid context was found at ${url}: ${response.statusText}`);
            }
        });
    }
}
exports.FetchDocumentLoader = FetchDocumentLoader;

},{"isomorphic-fetch":18}],22:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./lib/JsonLdParser"));

},{"./lib/JsonLdParser":24}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A tree structure that holds all contexts,
 * based on their position in the JSON object.
 *
 * Positions are identified by a path of keys.
 */
class ContextTree {
    constructor() {
        this.subTrees = {};
    }
    getContext([head, ...tail]) {
        if (!head && !tail.length) {
            return this.context;
        }
        else {
            const subTree = this.subTrees[head];
            return (subTree && subTree.getContext(tail)) || this.context;
        }
    }
    setContext([head, ...tail], context) {
        if (!head && !tail.length) {
            this.context = context;
        }
        else {
            let subTree = this.subTrees[head];
            if (!subTree) {
                subTree = this.subTrees[head] = new ContextTree();
            }
            subTree.setContext(tail, context);
        }
    }
}
exports.ContextTree = ContextTree;

},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-var-requires
const Parser = require('jsonparse');
const stream_1 = require("stream");
const EntryHandlerArrayValue_1 = require("./entryhandler/EntryHandlerArrayValue");
const EntryHandlerContainer_1 = require("./entryhandler/EntryHandlerContainer");
const EntryHandlerInvalidFallback_1 = require("./entryhandler/EntryHandlerInvalidFallback");
const EntryHandlerPredicate_1 = require("./entryhandler/EntryHandlerPredicate");
const EntryHandlerKeywordContext_1 = require("./entryhandler/keyword/EntryHandlerKeywordContext");
const EntryHandlerKeywordGraph_1 = require("./entryhandler/keyword/EntryHandlerKeywordGraph");
const EntryHandlerKeywordId_1 = require("./entryhandler/keyword/EntryHandlerKeywordId");
const EntryHandlerKeywordType_1 = require("./entryhandler/keyword/EntryHandlerKeywordType");
const EntryHandlerKeywordUnknownFallback_1 = require("./entryhandler/keyword/EntryHandlerKeywordUnknownFallback");
const EntryHandlerKeywordValue_1 = require("./entryhandler/keyword/EntryHandlerKeywordValue");
const ParsingContext_1 = require("./ParsingContext");
const Util_1 = require("./Util");
/**
 * A stream transformer that parses JSON-LD (text) streams to an {@link RDF.Stream}.
 */
class JsonLdParser extends stream_1.Transform {
    constructor(options) {
        super({ objectMode: true });
        options = options || {};
        this.options = options;
        this.parsingContext = new ParsingContext_1.ParsingContext(Object.assign({ parser: this }, options));
        this.util = new Util_1.Util({ dataFactory: options.dataFactory, parsingContext: this.parsingContext });
        this.jsonParser = new Parser();
        this.contextAwaitingJobs = [];
        this.contextJobs = [];
        this.lastDepth = 0;
        this.lastOnValueJob = Promise.resolve();
        this.attachJsonParserListeners();
    }
    /**
     * Parses the given text stream into a quad stream.
     * @param {NodeJS.EventEmitter} stream A text stream.
     * @return {NodeJS.EventEmitter} A quad stream.
     */
    import(stream) {
        const output = new stream_1.PassThrough({ objectMode: true });
        stream.on('error', (error) => parsed.emit('error', error));
        stream.on('data', (data) => output.write(data));
        stream.on('end', () => output.emit('end'));
        const parsed = output.pipe(new JsonLdParser(this.options));
        return parsed;
    }
    _transform(chunk, encoding, callback) {
        this.jsonParser.write(chunk);
        this.lastOnValueJob
            .then(() => callback(), (error) => callback(error));
    }
    /**
     * Start a new job for parsing the given value.
     *
     * This will let the first valid {@link IEntryHandler} handle the entry.
     *
     * @param {any[]} keys The stack of keys.
     * @param value The value to parse.
     * @param {number} depth The depth to parse at.
     * @return {Promise<void>} A promise resolving when the job is done.
     */
    async newOnValueJob(keys, value, depth) {
        // When we go up the stack, emit all unidentified values
        // We need to do this before the new job, because the new job may require determined values from the flushed jobs.
        if (depth < this.lastDepth) {
            // Check if we had any RDF lists that need to be terminated with an rdf:nil
            const listPointer = this.parsingContext.listPointerStack[this.lastDepth];
            if (listPointer) {
                if (listPointer.term) {
                    this.emit('data', this.util.dataFactory.quad(listPointer.term, this.util.rdfRest, this.util.rdfNil, this.util.getDefaultGraph()));
                }
                else {
                    this.parsingContext.getUnidentifiedValueBufferSafe(listPointer.listRootDepth)
                        .push({ predicate: listPointer.initialPredicate, object: this.util.rdfNil, reverse: false });
                }
                this.parsingContext.listPointerStack.splice(this.lastDepth, 1);
            }
            // Flush the buffer for lastDepth
            await this.flushBuffer(this.lastDepth, keys);
        }
        const key = await this.util.unaliasKeyword(keys[depth], keys, depth);
        const parentKey = await this.util.unaliasKeywordParent(keys, depth);
        this.parsingContext.emittedStack[depth] = true;
        let handleKey = true;
        // Keywords inside @reverse is not allowed
        if (Util_1.Util.isKeyword(key) && parentKey === '@reverse') {
            this.emit('error', new Error(`Found the @id '${value}' inside an @reverse property`));
        }
        // Skip further processing if one of the parent nodes are invalid.
        // We use the validationStack to reuse validation results that were produced before with common key stacks.
        let inProperty = false;
        if (this.parsingContext.validationStack.length > 1) {
            inProperty = this.parsingContext.validationStack[this.parsingContext.validationStack.length - 1].property;
        }
        for (let i = Math.max(1, this.parsingContext.validationStack.length - 1); i < keys.length - 1; i++) {
            const validationResult = this.parsingContext.validationStack[i]
                || (this.parsingContext.validationStack[i] = await this.validateKey(keys.slice(0, i + 1), i, inProperty));
            if (!validationResult.valid) {
                this.parsingContext.emittedStack[depth] = false;
                handleKey = false;
                break;
            }
            else if (!inProperty && validationResult.property) {
                inProperty = true;
            }
        }
        // Skip further processing if this node is part of a literal
        if (this.util.isLiteral(depth)) {
            handleKey = false;
        }
        // Get handler
        if (handleKey) {
            for (const entryHandler of JsonLdParser.ENTRY_HANDLERS) {
                const testResult = await entryHandler.test(this.parsingContext, this.util, key, keys, depth);
                if (testResult) {
                    // Pass processing over to the handler
                    await entryHandler.handle(this.parsingContext, this.util, key, keys, value, depth, testResult);
                    break;
                }
            }
            // Flag that this depth is processed
            this.parsingContext.processingStack[depth] = true;
        }
        // Validate value indexes on the root.
        if (depth === 0 && Array.isArray(value)) {
            await this.util.validateValueIndexes(value);
        }
        // When we go up the stack, flush the old stack
        if (depth < this.lastDepth) {
            // Reset our stack
            this.parsingContext.processingStack.splice(this.lastDepth, 1);
            this.parsingContext.emittedStack.splice(this.lastDepth, 1);
            this.parsingContext.idStack.splice(this.lastDepth, 1);
            this.parsingContext.graphStack.splice(this.lastDepth + 1, 1);
            this.parsingContext.literalStack.splice(this.lastDepth, 1);
            this.parsingContext.validationStack.splice(this.lastDepth - 1, 2);
        }
        this.lastDepth = depth;
        // Clear the keyword cache at this depth, and everything underneath.
        this.parsingContext.unaliasedKeywordCacheStack.splice(depth - 1);
    }
    /**
     * Check if at least one {@link IEntryHandler} validates the entry to true.
     * @param {any[]} keys A stack of keys.
     * @param {number} depth A depth.
     * @param {boolean} inProperty If the current depth is part of a valid property node.
     * @return {Promise<{ valid: boolean, property: boolean }>} A promise resolving to true or false.
     */
    async validateKey(keys, depth, inProperty) {
        for (const entryHandler of JsonLdParser.ENTRY_HANDLERS) {
            if (await entryHandler.validate(this.parsingContext, this.util, keys, depth, inProperty)) {
                return { valid: true, property: inProperty || entryHandler.isPropertyHandler() };
            }
        }
        return { valid: false, property: false };
    }
    /**
     * Attach all required listeners to the JSON parser.
     *
     * This should only be called once.
     */
    attachJsonParserListeners() {
        // Listen to json parser events
        this.jsonParser.onValue = (value) => {
            const depth = this.jsonParser.stack.length;
            const keys = (new Array(depth + 1).fill(0)).map((v, i) => {
                return i === depth ? this.jsonParser.key : this.jsonParser.stack[i].key;
            });
            if (!this.isParsingContextInner(depth)) { // Don't parse inner nodes inside @context
                const valueJobCb = () => this.newOnValueJob(keys, value, depth);
                if (this.parsingContext.allowOutOfOrderContext
                    && !this.parsingContext.contextTree.getContext(keys.slice(0, -1))) {
                    // If an out-of-order context is allowed,
                    // we have to buffer everything.
                    // We store jobs for @context's separately,
                    // because at the end, we have to process them first.
                    if (keys[depth] === '@context') {
                        let jobs = this.contextJobs[depth];
                        if (!jobs) {
                            jobs = this.contextJobs[depth] = [];
                        }
                        jobs.push(valueJobCb);
                    }
                    else {
                        this.contextAwaitingJobs.push(valueJobCb);
                    }
                }
                else {
                    // Make sure that our value jobs are chained synchronously
                    this.lastOnValueJob = this.lastOnValueJob.then(valueJobCb);
                }
                // Execute all buffered jobs on deeper levels
                if (this.parsingContext.allowOutOfOrderContext && depth === 0) {
                    this.lastOnValueJob = this.lastOnValueJob
                        .then(() => this.executeBufferedJobs());
                }
            }
        };
        this.jsonParser.onError = (error) => {
            this.emit('error', error);
        };
    }
    /**
     * Check if the parser is currently parsing an element that is part of an @context entry.
     * @param {number} depth A depth.
     * @return {boolean} A boolean.
     */
    isParsingContextInner(depth) {
        for (let i = depth; i > 0; i--) {
            if (this.jsonParser.stack[i - 1].key === '@context') {
                return true;
            }
        }
        return false;
    }
    /**
     * Execute all buffered jobs.
     * @return {Promise<void>} A promise resolving if all jobs are finished.
     */
    async executeBufferedJobs() {
        // Handle context jobs
        for (const jobs of this.contextJobs) {
            if (jobs) {
                for (const job of jobs) {
                    await job();
                }
            }
        }
        // Handle non-context jobs
        for (const job of this.contextAwaitingJobs) {
            await job();
        }
    }
    /**
     * Flush buffers for the given depth.
     *
     * This should be called after the last entry at a given depth was processed.
     *
     * @param {number} depth A depth.
     * @param {any[]} keys A stack of keys.
     * @return {Promise<void>} A promise resolving if flushing is done.
     */
    async flushBuffer(depth, keys) {
        let subject = this.parsingContext.idStack[depth];
        if (subject === undefined) {
            subject = this.parsingContext.idStack[depth] = this.util.dataFactory.blankNode();
        }
        // Flush values at this level
        const valueBuffer = this.parsingContext.unidentifiedValuesBuffer[depth];
        if (valueBuffer) {
            if (subject) {
                const depthOffsetGraph = await this.util.getDepthOffsetGraph(depth, keys);
                const graph = this.parsingContext.graphStack[depth] || depthOffsetGraph >= 0
                    ? this.parsingContext.idStack[depth - depthOffsetGraph - 1] : this.util.getDefaultGraph();
                if (graph) {
                    // Flush values to stream if the graph @id is known
                    this.parsingContext.emittedStack[depth] = true;
                    for (const bufferedValue of valueBuffer) {
                        if (bufferedValue.reverse) {
                            this.parsingContext.emitQuad(depth, this.util.dataFactory.quad(bufferedValue.object, bufferedValue.predicate, subject, graph));
                        }
                        else {
                            this.parsingContext.emitQuad(depth, this.util.dataFactory.quad(subject, bufferedValue.predicate, bufferedValue.object, graph));
                        }
                    }
                }
                else {
                    // Place the values in the graphs buffer if the graph @id is not yet known
                    const subGraphBuffer = this.parsingContext.getUnidentifiedGraphBufferSafe(depth - await this.util.getDepthOffsetGraph(depth, keys) - 1);
                    for (const bufferedValue of valueBuffer) {
                        if (bufferedValue.reverse) {
                            subGraphBuffer.push({
                                object: subject,
                                predicate: bufferedValue.predicate,
                                subject: bufferedValue.object,
                            });
                        }
                        else {
                            subGraphBuffer.push({
                                object: bufferedValue.object,
                                predicate: bufferedValue.predicate,
                                subject,
                            });
                        }
                    }
                }
            }
            this.parsingContext.unidentifiedValuesBuffer.splice(depth, 1);
            this.parsingContext.literalStack.splice(depth, 1);
        }
        // Flush graphs at this level
        const graphBuffer = this.parsingContext.unidentifiedGraphsBuffer[depth];
        if (graphBuffer) {
            if (subject) {
                // A @graph statement at the root without @id relates to the default graph,
                // unless there are top-level properties,
                // others relate to blank nodes.
                const graph = depth === 1 && subject.termType === 'BlankNode'
                    && !this.parsingContext.topLevelProperties ? this.util.getDefaultGraph() : subject;
                this.parsingContext.emittedStack[depth] = true;
                for (const bufferedValue of graphBuffer) {
                    this.parsingContext.emitQuad(depth, this.util.dataFactory.quad(bufferedValue.subject, bufferedValue.predicate, bufferedValue.object, graph));
                }
            }
            this.parsingContext.unidentifiedGraphsBuffer.splice(depth, 1);
        }
    }
}
JsonLdParser.DEFAULT_PROCESSING_MODE = '1.0';
JsonLdParser.ENTRY_HANDLERS = [
    new EntryHandlerArrayValue_1.EntryHandlerArrayValue(),
    new EntryHandlerKeywordContext_1.EntryHandlerKeywordContext(),
    new EntryHandlerKeywordId_1.EntryHandlerKeywordId(),
    new EntryHandlerKeywordGraph_1.EntryHandlerKeywordGraph(),
    new EntryHandlerKeywordType_1.EntryHandlerKeywordType(),
    new EntryHandlerKeywordValue_1.EntryHandlerKeywordValue(),
    new EntryHandlerKeywordUnknownFallback_1.EntryHandlerKeywordUnknownFallback(),
    new EntryHandlerContainer_1.EntryHandlerContainer(),
    new EntryHandlerPredicate_1.EntryHandlerPredicate(),
    new EntryHandlerInvalidFallback_1.EntryHandlerInvalidFallback(),
];
exports.JsonLdParser = JsonLdParser;

},{"./ParsingContext":25,"./Util":26,"./entryhandler/EntryHandlerArrayValue":29,"./entryhandler/EntryHandlerContainer":30,"./entryhandler/EntryHandlerInvalidFallback":31,"./entryhandler/EntryHandlerPredicate":32,"./entryhandler/keyword/EntryHandlerKeywordContext":34,"./entryhandler/keyword/EntryHandlerKeywordGraph":35,"./entryhandler/keyword/EntryHandlerKeywordId":36,"./entryhandler/keyword/EntryHandlerKeywordType":37,"./entryhandler/keyword/EntryHandlerKeywordUnknownFallback":38,"./entryhandler/keyword/EntryHandlerKeywordValue":39,"jsonparse":40,"stream":60}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonld_context_parser_1 = require("jsonld-context-parser");
const ContextTree_1 = require("./ContextTree");
const JsonLdParser_1 = require("./JsonLdParser");
/**
 * Data holder for parsing information.
 */
class ParsingContext {
    constructor(options) {
        // Initialize settings
        this.contextParser = new jsonld_context_parser_1.ContextParser({ documentLoader: options.documentLoader });
        this.allowOutOfOrderContext = options.allowOutOfOrderContext;
        this.baseIRI = options.baseIRI;
        this.produceGeneralizedRdf = options.produceGeneralizedRdf;
        this.allowSubjectList = options.allowSubjectList;
        this.processingMode = options.processingMode || JsonLdParser_1.JsonLdParser.DEFAULT_PROCESSING_MODE;
        this.errorOnInvalidProperties = options.errorOnInvalidIris;
        this.validateValueIndexes = options.validateValueIndexes;
        this.defaultGraph = options.defaultGraph;
        // Initialize stacks
        this.processingStack = [];
        this.emittedStack = [];
        this.idStack = [];
        this.graphStack = [];
        this.listPointerStack = [];
        this.contextTree = new ContextTree_1.ContextTree();
        this.literalStack = [];
        this.validationStack = [];
        this.unaliasedKeywordCacheStack = [];
        this.unidentifiedValuesBuffer = [];
        this.unidentifiedGraphsBuffer = [];
        this.parser = options.parser;
        if (options.context) {
            this.rootContext = this.contextParser.parse(options.context, { baseIri: options.baseIRI });
            this.rootContext.then((context) => this.validateContext(context));
        }
        else {
            this.rootContext = Promise.resolve(this.baseIRI ? { '@base': this.baseIRI } : {});
        }
        this.topLevelProperties = false;
    }
    /**
     * Check if the given context is valid.
     * If not, an error will be thrown.
     * @param {IJsonLdContextNormalized} context A context.
     */
    validateContext(context) {
        const activeVersion = context['@version'];
        if (activeVersion && parseFloat(activeVersion) > parseFloat(this.processingMode)) {
            throw new Error(`Unsupported JSON-LD processing mode: ${activeVersion}`);
        }
    }
    /**
     * Get the context at the given path.
     * @param {keys} keys The path of keys to get the context at.
     * @param {number} offset The path offset, defaults to 1.
     * @return {Promise<IJsonLdContextNormalized>} A promise resolving to a context.
     */
    getContext(keys, offset = 1) {
        if (offset) {
            keys = keys.slice(0, -offset);
        }
        return this.contextTree.getContext(keys) || this.rootContext;
    }
    /**
     * Start a new job for parsing the given value.
     * @param {any[]} keys The stack of keys.
     * @param value The value to parse.
     * @param {number} depth The depth to parse at.
     * @return {Promise<void>} A promise resolving when the job is done.
     */
    async newOnValueJob(keys, value, depth) {
        await this.parser.newOnValueJob(keys, value, depth);
    }
    /**
     * Emit the given quad into the output stream.
     * @param {number} depth The depth the quad was generated at.
     * @param {Quad} quad A quad to emit.
     */
    emitQuad(depth, quad) {
        if (depth === 1) {
            this.topLevelProperties = true;
        }
        this.parser.push(quad);
    }
    /**
     * Emit the given error into the output stream.
     * @param {Error} error An error to emit.
     */
    emitError(error) {
        this.parser.emit('error', error);
    }
    /**
     * Emit the given context into the output stream under the 'context' event.
     * @param {JsonLdContext} context A context to emit.
     */
    emitContext(context) {
        this.parser.emit('context', context);
    }
    /**
     * Safely get or create the depth value of {@link ParsingContext.unidentifiedValuesBuffer}.
     * @param {number} depth A depth.
     * @return {{predicate: Term; object: Term; reverse: boolean}[]} An element of
     *                                                               {@link ParsingContext.unidentifiedValuesBuffer}.
     */
    getUnidentifiedValueBufferSafe(depth) {
        let buffer = this.unidentifiedValuesBuffer[depth];
        if (!buffer) {
            buffer = [];
            this.unidentifiedValuesBuffer[depth] = buffer;
        }
        return buffer;
    }
    /**
     * Safely get or create the depth value of {@link ParsingContext.unidentifiedGraphsBuffer}.
     * @param {number} depth A depth.
     * @return {{predicate: Term; object: Term; reverse: boolean}[]} An element of
     *                                                               {@link ParsingContext.unidentifiedGraphsBuffer}.
     */
    getUnidentifiedGraphBufferSafe(depth) {
        let buffer = this.unidentifiedGraphsBuffer[depth];
        if (!buffer) {
            buffer = [];
            this.unidentifiedGraphsBuffer[depth] = buffer;
        }
        return buffer;
    }
}
exports.ParsingContext = ParsingContext;

},{"./ContextTree":23,"./JsonLdParser":24,"jsonld-context-parser":19}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonld_context_parser_1 = require("jsonld-context-parser");
/**
 * Utility functions and methods.
 */
class Util {
    constructor(options) {
        this.parsingContext = options.parsingContext;
        this.dataFactory = options.dataFactory || require('@rdfjs/data-model');
        this.rdfFirst = this.dataFactory.namedNode(Util.RDF + 'first');
        this.rdfRest = this.dataFactory.namedNode(Util.RDF + 'rest');
        this.rdfNil = this.dataFactory.namedNode(Util.RDF + 'nil');
        this.rdfType = this.dataFactory.namedNode(Util.RDF + 'type');
    }
    /**
     * Helper function to get the value of a context entry,
     * or fallback to a certain value.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} contextKey A pre-defined JSON-LD key in context entries.
     * @param {string} key A context entry key.
     * @param {string} fallback A fallback value for when the given contextKey
     *                          could not be found in the value with the given key.
     * @return {string} The value of the given contextKey in the entry behind key in the given context,
     *                  or the given fallback value.
     */
    static getContextValue(context, contextKey, key, fallback) {
        const entry = context[key];
        if (!entry) {
            return fallback;
        }
        const type = entry[contextKey];
        return type === undefined ? fallback : type;
    }
    /**
     * Get the container type of the given key in the context.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} key A context entry key.
     * @return {string} The container type.
     */
    static getContextValueContainer(context, key) {
        return Util.getContextValue(context, '@container', key, '@set');
    }
    /**
     * Get the node type of the given key in the context.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} key A context entry key.
     * @return {string} The node type.
     */
    static getContextValueType(context, key) {
        return Util.getContextValue(context, '@type', key, null);
    }
    /**
     * Get the node type of the given key in the context.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} key A context entry key.
     * @return {string} The node type.
     */
    static getContextValueLanguage(context, key) {
        return Util.getContextValue(context, '@language', key, context['@language'] || null);
    }
    /**
     * Check if the given key in the context is a reversed property.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} key A context entry key.
     * @return {boolean} If the context value has a @reverse key.
     */
    static isContextValueReverse(context, key) {
        return !!Util.getContextValue(context, '@reverse', key, null);
    }
    /**
     * Check if the given key refers to a reversed property.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} key The property key.
     * @param {string} parentKey The parent key.
     * @return {boolean} If the property must be reversed.
     */
    static isPropertyReverse(context, key, parentKey) {
        // '!==' is needed because reversed properties in a @reverse container should cancel each other out.
        return parentKey === '@reverse' !== Util.isContextValueReverse(context, key);
    }
    /**
     * Check if the given key is a keyword.
     * @param {string} key A key, can be falsy.
     * @return {boolean} If the given key starts with an @.
     */
    static isKeyword(key) {
        return typeof key === 'string' && key[0] === '@';
    }
    /**
     * Check if the given IRI is valid.
     * @param {string} iri A potential IRI.
     * @return {boolean} If the given IRI is valid.
     */
    static isValidIri(iri) {
        return jsonld_context_parser_1.ContextParser.isValidIri(iri);
    }
    /**
     * Make sure that @id-@index pairs are equal over all array values.
     * Reject otherwise.
     * @param {any[]} value An array value.
     * @return {Promise<void>} A promise rejecting if conflicts are present.
     */
    async validateValueIndexes(value) {
        if (this.parsingContext.validateValueIndexes) {
            const indexHashes = {};
            for (const entry of value) {
                if (entry && typeof entry === 'object') {
                    const id = entry['@id'];
                    const index = entry['@index'];
                    if (id && index) {
                        const existingIndexValue = indexHashes[id];
                        if (existingIndexValue && existingIndexValue !== index) {
                            throw new Error(`Conflicting @index value for ${id}`);
                        }
                        indexHashes[id] = index;
                    }
                }
            }
        }
    }
    /**
     * Convert a given JSON value to an RDF term.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} key The current JSON key.
     * @param value A JSON value.
     * @param {number} depth The depth the value is at.
     * @param {string[]} keys The path of keys.
     * @return {RDF.Term} An RDF term.
     */
    async valueToTerm(context, key, value, depth, keys) {
        const type = typeof value;
        switch (type) {
            case 'object':
                // Skip if we have a null or undefined object
                if (value === null || value === undefined) {
                    return null;
                }
                // Special case for arrays
                if (Array.isArray(value)) {
                    // We handle arrays at value level so we can emit earlier, so this is handled already when we get here.
                    // Empty context-based lists are emitted at this place, because our streaming algorithm doesn't detect those.
                    if (Util.getContextValueContainer(context, key) === '@list' && value.length === 0) {
                        return this.rdfNil;
                    }
                    await this.validateValueIndexes(value);
                    return null;
                }
                // In all other cases, we have a hash
                value = await this.unaliasKeywords(value, keys, depth); // Un-alias potential keywords in this hash
                if ("@value" in value) {
                    let val;
                    let valueLanguage;
                    let valueType;
                    let valueIndex; // We don't use the index, but we need to check its type for spec-compliance
                    for (key in value) {
                        const subValue = value[key];
                        switch (key) {
                            case '@value':
                                val = subValue;
                                break;
                            case '@language':
                                valueLanguage = subValue;
                                break;
                            case '@type':
                                valueType = subValue;
                                break;
                            case '@index':
                                valueIndex = subValue;
                                break;
                            default:
                                throw new Error(`Unknown value entry '${key}' in @value: ${JSON.stringify(value)}`);
                        }
                    }
                    // Validate @value
                    if (val === null) {
                        return null;
                    }
                    if (typeof val === 'object') {
                        throw new Error(`The value of an '@value' can not be an object, got '${JSON.stringify(val)}'`);
                    }
                    // Validate @index
                    if (this.parsingContext.validateValueIndexes && valueIndex && typeof valueIndex !== 'string') {
                        throw new Error(`The value of an '@index' must be a string, got '${JSON.stringify(valueIndex)}'`);
                    }
                    // Validate @language
                    if (valueLanguage) {
                        if (valueType) {
                            throw new Error(`Can not have both '@language' and '@type' in a value: '${JSON.stringify(value)}'`);
                        }
                        if (typeof valueLanguage !== 'string') {
                            throw new Error(`The value of an '@language' must be a string, got '${JSON.stringify(valueLanguage)}'`);
                        }
                        if (typeof val !== 'string') {
                            throw new Error(`When an '@language' is set, the value of '@value' must be a string, got '${JSON.stringify(val)}'`);
                        }
                        return this.dataFactory.literal(val, valueLanguage);
                    }
                    else if (valueType) { // Validate @type
                        if (typeof valueType !== 'string') {
                            throw new Error(`The value of an '@type' must be a string, got '${JSON.stringify(valueType)}'`);
                        }
                        const typeTerm = this.createVocabOrBaseTerm(context, valueType);
                        if (!typeTerm) {
                            return null;
                        }
                        if (typeTerm.termType !== 'NamedNode') {
                            throw new Error(`Illegal value type (${typeTerm.termType}): ${valueType}`);
                        }
                        return this.dataFactory.literal(val, typeTerm);
                    }
                    // We don't pass the context, because context-based things like @language should be ignored
                    return await this.valueToTerm({}, key, val, depth, keys);
                }
                else if ('@set' in value) {
                    // No other entries are allow in this value
                    if (Object.keys(value).length > 1) {
                        throw new Error(`Found illegal neighbouring entries next to @set in value: ${JSON.stringify(value)}`);
                    }
                    // No need to do anything here, this is handled at the deeper level.
                    return null;
                }
                else if ('@list' in value) {
                    // No other entries are allow in this value
                    if (Object.keys(value).length > 1) {
                        throw new Error(`Found illegal neighbouring entries next to @set in value: ${JSON.stringify(value)}`);
                    }
                    const listValue = value["@list"];
                    // We handle lists at value level so we can emit earlier, so this is handled already when we get here.
                    // Empty anonymous lists are emitted at this place, because our streaming algorithm doesn't detect those.
                    if (Array.isArray(listValue)) {
                        if (listValue.length === 0) {
                            return this.rdfNil;
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        // We only have a single list element here, so emit this directly as single element
                        return this.valueToTerm(await this.parsingContext.getContext(keys), key, listValue, depth - 1, keys.slice(0, -1));
                    }
                }
                else if ('@reverse' in value) {
                    // We handle reverse properties at value level so we can emit earlier,
                    // so this is handled already when we get here.
                    return null;
                }
                else if ("@id" in value) {
                    if (value["@type"] === '@vocab') {
                        return this.createVocabOrBaseTerm(context, value["@id"]);
                    }
                    else {
                        return this.resourceToTerm(context, value["@id"]);
                    }
                }
                else {
                    // Only make a blank node if at least one triple was emitted at the value's level.
                    if (this.parsingContext.emittedStack[depth + 1]) {
                        return this.parsingContext.idStack[depth + 1]
                            || (this.parsingContext.idStack[depth + 1] = this.dataFactory.blankNode());
                    }
                    else {
                        return null;
                    }
                }
            case 'string':
                return this.stringValueToTerm(context, key, value, null);
            case 'boolean':
                return this.stringValueToTerm(context, key, Boolean(value).toString(), this.dataFactory.namedNode(Util.XSD_BOOLEAN));
            case 'number':
                return this.stringValueToTerm(context, key, value, this.dataFactory.namedNode(value % 1 === 0 ? Util.XSD_INTEGER : Util.XSD_DOUBLE));
            default:
                this.parsingContext.emitError(new Error(`Could not determine the RDF type of a ${type}`));
        }
    }
    /**
     * Convert a given JSON key to an RDF predicate term,
     * based on @vocab.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param key A JSON key.
     * @return {RDF.NamedNode} An RDF named node.
     */
    predicateToTerm(context, key) {
        const expanded = jsonld_context_parser_1.ContextParser.expandTerm(key, context, true);
        // Immediately return if the predicate was disabled in the context
        if (!expanded) {
            return null;
        }
        // Check if the predicate is a blank node
        if (expanded[0] === '_' && expanded[1] === ':') {
            if (this.parsingContext.produceGeneralizedRdf) {
                return this.dataFactory.blankNode(expanded.substr(2));
            }
            else {
                return null;
            }
        }
        // Check if the predicate is a valid IRI
        if (Util.isValidIri(expanded)) {
            return this.dataFactory.namedNode(expanded);
        }
        else {
            if (expanded && this.parsingContext.errorOnInvalidProperties) {
                this.parsingContext.emitError(new Error(`Invalid predicate IRI: ${expanded}`));
            }
            else {
                return null;
            }
        }
    }
    /**
     * Convert a given JSON key to an RDF resource term or blank node,
     * based on @base.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param key A JSON key.
     * @return {RDF.NamedNode} An RDF named node or null.
     */
    resourceToTerm(context, key) {
        if (key.startsWith('_:')) {
            return this.dataFactory.blankNode(key.substr(2));
        }
        const iri = jsonld_context_parser_1.ContextParser.expandTerm(key, context, false);
        if (!Util.isValidIri(iri)) {
            if (iri && this.parsingContext.errorOnInvalidProperties) {
                this.parsingContext.emitError(new Error(`Invalid resource IRI: ${iri}`));
            }
            else {
                return null;
            }
        }
        return this.dataFactory.namedNode(iri);
    }
    /**
     * Convert a given JSON key to an RDF resource term.
     * It will do this based on the @vocab,
     * and fallback to @base.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param key A JSON key.
     * @return {RDF.NamedNode} An RDF named node or null.
     */
    createVocabOrBaseTerm(context, key) {
        if (key.startsWith('_:')) {
            return this.dataFactory.blankNode(key.substr(2));
        }
        let expanded = jsonld_context_parser_1.ContextParser.expandTerm(key, context, true);
        if (expanded === key) {
            expanded = jsonld_context_parser_1.ContextParser.expandTerm(key, context, false);
        }
        if (!Util.isValidIri(expanded)) {
            if (expanded && this.parsingContext.errorOnInvalidProperties) {
                this.parsingContext.emitError(new Error(`Invalid term IRI: ${expanded}`));
            }
            else {
                return null;
            }
        }
        return this.dataFactory.namedNode(expanded);
    }
    /**
     * Ensure that the given value becomes a string.
     * @param {string | number} value A string or number.
     * @param {NamedNode} datatype The intended datatype.
     * @return {string} The returned string.
     */
    intToString(value, datatype) {
        if (typeof value === 'number') {
            if (Number.isFinite(value)) {
                const isInteger = value % 1 === 0;
                if (isInteger && datatype.value !== Util.XSD_DOUBLE) {
                    return Number(value).toString();
                }
                else {
                    return value.toExponential(15).replace(/(\d)0*e\+?/, '$1E');
                }
            }
            else {
                return value > 0 ? 'INF' : '-INF';
            }
        }
        else {
            return value;
        }
    }
    /**
     * Convert a given JSON string value to an RDF term.
     * @param {IJsonLdContextNormalized} context A JSON-LD context.
     * @param {string} key The current JSON key.
     * @param {string} value A JSON value.
     * @param {NamedNode} defaultDatatype The default datatype for the given value.
     * @return {RDF.Term} An RDF term or null.
     */
    stringValueToTerm(context, key, value, defaultDatatype) {
        // Check the datatype from the context
        const contextType = Util.getContextValueType(context, key);
        if (contextType) {
            if (contextType === '@id') {
                return this.resourceToTerm(context, this.intToString(value, defaultDatatype));
            }
            else if (contextType === '@vocab') {
                return this.createVocabOrBaseTerm(context, this.intToString(value, defaultDatatype));
            }
            else {
                defaultDatatype = this.dataFactory.namedNode(contextType);
            }
        }
        // If we don't find such a datatype, check the language from the context
        if (!defaultDatatype) {
            const contextLanguage = Util.getContextValueLanguage(context, key);
            if (contextLanguage) {
                return this.dataFactory.literal(this.intToString(value, defaultDatatype), contextLanguage);
            }
        }
        // If all else fails, make a literal based on the default content type
        return this.dataFactory.literal(this.intToString(value, defaultDatatype), defaultDatatype);
    }
    /**
     * If the key is not a keyword, try to check if it is an alias for a keyword,
     * and if so, un-alias it.
     * @param {string} key A key, can be falsy.
     * @param {string[]} keys The path of keys.
     * @param {number} depth The depth to
     * @param {boolean} disableCache If the cache should be disabled
     * @return {Promise<string>} A promise resolving to the key itself, or another key.
     */
    async unaliasKeyword(key, keys, depth, disableCache) {
        // Numbers can not be an alias
        if (Number.isInteger(key)) {
            return key;
        }
        // Try to grab from cache if it was already un-aliased before.
        if (!disableCache) {
            const cachedUnaliasedKeyword = this.parsingContext.unaliasedKeywordCacheStack[depth];
            if (cachedUnaliasedKeyword) {
                return cachedUnaliasedKeyword;
            }
        }
        if (!Util.isKeyword(key)) {
            const context = await this.parsingContext.getContext(keys);
            let unliased = context[key];
            if (unliased && typeof unliased === 'object') {
                unliased = unliased['@id'];
            }
            if (Util.isKeyword(unliased)) {
                key = unliased;
            }
        }
        return disableCache ? key : (this.parsingContext.unaliasedKeywordCacheStack[depth] = key);
    }
    /**
     * Unalias the keyword of the parent.
     * This adds a safety check if no parent exist.
     * @param {any[]} keys A stack of keys.
     * @param {number} depth The current depth.
     * @return {Promise<any>} A promise resolving to the parent key, or another key.
     */
    async unaliasKeywordParent(keys, depth) {
        return await this.unaliasKeyword(depth > 0 && keys[depth - 1], keys, depth - 1);
    }
    /**
     * Un-alias all keywords in the given hash.
     * @param {{[p: string]: any}} hash A hash object.
     * @param {string[]} keys The path of keys.
     * @param {number} depth The depth.
     * @return {Promise<{[p: string]: any}>} A promise resolving to the new hash.
     */
    async unaliasKeywords(hash, keys, depth) {
        const newHash = {};
        for (const key in hash) {
            newHash[await this.unaliasKeyword(key, keys, depth + 1, true)] = hash[key];
        }
        return newHash;
    }
    /**
     * Check if we are processing a literal at the given depth.
     * This will also check higher levels,
     * because if a parent is a literal,
     * then the deeper levels are definitely a literal as well.
     * @param {number} depth The depth.
     * @return {boolean} If we are processing a literal.
     */
    isLiteral(depth) {
        for (let i = depth; i >= 0; i--) {
            if (this.parsingContext.literalStack[i]) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check how many parents should be skipped for checking the @graph for the given node.
     *
     * @param {number} depth The depth of the node.
     * @param {any[]} keys An array of keys.
     * @return {number} The graph depth offset.
     */
    async getDepthOffsetGraph(depth, keys) {
        for (let i = depth - 1; i > 0; i--) {
            if (await this.unaliasKeyword(keys[i], keys, i) === '@graph') {
                return depth - i - 1;
            }
        }
        return -1;
    }
    /**
     * Check if the given subject is of a valid type.
     * This should be called when applying @reverse'd properties.
     * @param {Term} subject A subject.
     */
    validateReverseSubject(subject) {
        if (subject.termType === 'Literal') {
            throw new Error(`Found illegal literal in subject position: ${subject.value}`);
        }
    }
    /**
     * Get the default graph.
     * @return {Term} An RDF term.
     */
    getDefaultGraph() {
        return this.parsingContext.defaultGraph || this.dataFactory.defaultGraph();
    }
}
Util.XSD = 'http://www.w3.org/2001/XMLSchema#';
Util.XSD_BOOLEAN = Util.XSD + 'boolean';
Util.XSD_INTEGER = Util.XSD + 'integer';
Util.XSD_DOUBLE = Util.XSD + 'double';
Util.RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
exports.Util = Util;

},{"@rdfjs/data-model":1,"jsonld-context-parser":19}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Container handler for @index.
 *
 * This will ignore the current key and add this entry to the parent node.
 */
class ContainerHandlerIndex {
    async handle(parsingContext, keys, value, depth) {
        await parsingContext.newOnValueJob(keys, value, depth - 1);
    }
}
exports.ContainerHandlerIndex = ContainerHandlerIndex;

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Container handler for @language.
 *
 * It assumes that the current key is the language of the current value.
 * This will add this value to the parent node.
 */
class ContainerHandlerLanguage {
    async handle(parsingContext, keys, value, depth) {
        if (Array.isArray(value)) {
            value = value.map((subValue) => ({ '@value': subValue, '@language': keys[depth] }));
        }
        else {
            value = { '@value': value, '@language': keys[depth] };
        }
        await parsingContext.newOnValueJob(keys, value, depth - 1);
    }
}
exports.ContainerHandlerLanguage = ContainerHandlerLanguage;

},{}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
/**
 * Handles values that are part of an array.
 */
class EntryHandlerArrayValue {
    isPropertyHandler() {
        return false;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        return this.test(parsingContext, util, null, keys, depth);
    }
    async test(parsingContext, util, key, keys, depth) {
        return typeof keys[depth] === 'number';
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        const parentKey = await util.unaliasKeywordParent(keys, depth);
        // Check if we have an anonymous list
        if (parentKey === '@list') {
            // Our value is part of an array
            // Determine the list root key
            let listRootKey = null;
            let listRootDepth;
            for (let i = depth - 2; i > 0; i--) {
                const keyOption = keys[i];
                if (typeof keyOption === 'string') {
                    listRootDepth = i;
                    listRootKey = keyOption;
                    break;
                }
            }
            // Throw an error if we encounter a nested list
            if (listRootKey === '@list' ||
                (listRootDepth !== depth - 2 && typeof keys[depth - 2] === 'number'
                    && Util_1.Util.getContextValueContainer(await parsingContext
                        .getContext(keys, listRootDepth - depth), listRootKey) === '@list')) {
                throw new Error(`Lists of lists are not supported: '${listRootKey}'`);
            }
            const object = await util.valueToTerm(await parsingContext.getContext(keys), listRootKey, value, depth, keys);
            if (listRootKey !== null) {
                await this.handleListElement(parsingContext, util, object, depth, keys.slice(0, listRootDepth), listRootDepth, listRootKey, keys);
            }
        }
        else if (parentKey === '@set') {
            // Our value is part of a set, so we just add it to the parent-parent
            await parsingContext.newOnValueJob(keys.slice(0, -2), value, depth - 2);
        }
        else if (parentKey !== undefined && parentKey !== '@type') {
            // Buffer our value using the parent key as predicate
            // Check if the predicate is marked as an @list in the context
            const parentContext = await parsingContext.getContext(keys.slice(0, -1));
            if (Util_1.Util.getContextValueContainer(parentContext, parentKey) === '@list') {
                // Our value is part of an array
                const object = await util.valueToTerm(await parsingContext.getContext(keys), parentKey, value, depth, keys);
                await this.handleListElement(parsingContext, util, object, depth, keys.slice(0, -1), depth - 1, parentKey, keys);
            }
            else {
                // Copy the id stack value up one level so that the next job can access the id.
                if (parsingContext.idStack[depth + 1]) {
                    parsingContext.idStack[depth] = parsingContext.idStack[depth + 1];
                    parsingContext.emittedStack[depth] = true;
                }
                // Execute the job one level higher
                await parsingContext.newOnValueJob(keys.slice(0, -1), value, depth - 1);
            }
        }
    }
    async handleListElement(parsingContext, util, value, depth, listRootKeys, listRootDepth, listRootKey, keys) {
        // Buffer our value as an RDF list using the listRootKey as predicate
        let listPointer = parsingContext.listPointerStack[depth];
        if (value) {
            if (!listPointer || !listPointer.term) {
                const linkTerm = util.dataFactory.blankNode();
                const listRootContext = await parsingContext.getContext(listRootKeys);
                const predicate = await util.predicateToTerm(listRootContext, listRootKey);
                const reverse = Util_1.Util.isPropertyReverse(listRootContext, listRootKey, keys[listRootDepth - 1]);
                // Lists are not allowed in @reverse'd properties
                if (reverse && !parsingContext.allowSubjectList) {
                    throw new Error(`Found illegal list value in subject position at ${listRootKey}`);
                }
                parsingContext.getUnidentifiedValueBufferSafe(listRootDepth)
                    .push({ predicate, object: linkTerm, reverse });
                listPointer = { term: linkTerm, initialPredicate: null, listRootDepth };
            }
            else {
                // rdf:rest links are always emitted before the next element,
                // as the blank node identifier is only created at that point.
                // Because of this reason, the final rdf:nil is emitted when the stack depth is decreased.
                const newLinkTerm = util.dataFactory.blankNode();
                parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer.term, util.rdfRest, newLinkTerm, util.getDefaultGraph()));
                // Update the list pointer for the next element
                listPointer.term = newLinkTerm;
            }
            // Emit a list element for the current value
            parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer.term, util.rdfFirst, value, util.getDefaultGraph()));
        }
        else {
            // A falsy list element if found.
            // Just enable the list flag for this depth if it has not been set before.
            if (!listPointer) {
                const predicate = await util.predicateToTerm(await parsingContext.getContext(listRootKeys), listRootKey);
                listPointer = { term: null, initialPredicate: predicate, listRootDepth };
            }
        }
        parsingContext.listPointerStack[depth] = listPointer;
    }
}
exports.EntryHandlerArrayValue = EntryHandlerArrayValue;

},{"../Util":26}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ContainerHandlerIndex_1 = require("../containerhandler/ContainerHandlerIndex");
const ContainerHandlerLanguage_1 = require("../containerhandler/ContainerHandlerLanguage");
const Util_1 = require("../Util");
/**
 * Handles values that are part of a container type (like @index),
 * as specified by {@link IContainerHandler}.
 */
class EntryHandlerContainer {
    isPropertyHandler() {
        return false;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        return !!await this.test(parsingContext, util, null, keys, depth);
    }
    async test(parsingContext, util, key, keys, depth) {
        return EntryHandlerContainer.CONTAINER_HANDLERS[Util_1.Util.getContextValueContainer(await parsingContext.getContext(keys), keys[depth - 1])];
    }
    async handle(parsingContext, util, key, keys, value, depth, testResult) {
        parsingContext.emittedStack[depth] = false; // We will emit a level higher
        return testResult.handle(parsingContext, keys, value, depth);
    }
}
EntryHandlerContainer.CONTAINER_HANDLERS = {
    '@index': new ContainerHandlerIndex_1.ContainerHandlerIndex(),
    '@language': new ContainerHandlerLanguage_1.ContainerHandlerLanguage(),
};
exports.EntryHandlerContainer = EntryHandlerContainer;

},{"../Util":26,"../containerhandler/ContainerHandlerIndex":27,"../containerhandler/ContainerHandlerLanguage":28}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A catch-all for properties, that will either emit an error or ignore,
 * depending on whether or not the `errorOnInvalidIris` property is set.
 */
class EntryHandlerInvalidFallback {
    isPropertyHandler() {
        return false;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        return false;
    }
    async test(parsingContext, util, key, keys, depth) {
        return true;
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        parsingContext.emittedStack[depth] = false;
    }
}
exports.EntryHandlerInvalidFallback = EntryHandlerInvalidFallback;

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
/**
 * Interprets keys as predicates.
 * The most common case in JSON-LD processing.
 */
class EntryHandlerPredicate {
    /**
     * Handle the given predicate-object by either emitting it,
     * or by placing it in the appropriate stack for later emission when no @graph and/or @id has been defined.
     * @param {ParsingContext} parsingContext A parsing context.
     * @param {Util} util A utility instance.
     * @param {any[]} keys A stack of keys.
     * @param {number} depth The current depth.
     * @param parentKey The parent key.
     * @param {Term} predicate The predicate.
     * @param {Term} object The object.
     * @param {boolean} reverse If the property is reversed.
     * @return {Promise<void>} A promise resolving when handling is done.
     */
    static async handlePredicateObject(parsingContext, util, keys, depth, parentKey, predicate, object, reverse) {
        const depthProperties = depth - (parentKey === '@reverse' ? 1 : 0);
        const depthOffsetGraph = await util.getDepthOffsetGraph(depth, keys);
        const depthPropertiesGraph = depth - depthOffsetGraph;
        if (parsingContext.idStack[depthProperties]) {
            // Emit directly if the @id was already defined
            const subject = parsingContext.idStack[depthProperties];
            // Check if we're in a @graph context
            const atGraph = depthOffsetGraph >= 0;
            if (atGraph) {
                const graph = parsingContext.idStack[depthPropertiesGraph - 1];
                if (graph) {
                    // Emit our quad if graph @id is known
                    if (reverse) {
                        util.validateReverseSubject(object);
                        parsingContext.emitQuad(depth, util.dataFactory.quad(object, predicate, subject, graph));
                    }
                    else {
                        parsingContext.emitQuad(depth, util.dataFactory.quad(subject, predicate, object, graph));
                    }
                }
                else {
                    // Buffer our triple if graph @id is not known yet.
                    if (reverse) {
                        util.validateReverseSubject(object);
                        parsingContext.getUnidentifiedGraphBufferSafe(depthPropertiesGraph - 1).push({ subject: object, predicate, object: subject });
                    }
                    else {
                        parsingContext.getUnidentifiedGraphBufferSafe(depthPropertiesGraph - 1)
                            .push({ subject, predicate, object });
                    }
                }
            }
            else {
                // Emit if no @graph was applicable
                if (reverse) {
                    util.validateReverseSubject(object);
                    parsingContext.emitQuad(depth, util.dataFactory.quad(object, predicate, subject, util.getDefaultGraph()));
                }
                else {
                    parsingContext.emitQuad(depth, util.dataFactory.quad(subject, predicate, object, util.getDefaultGraph()));
                }
            }
        }
        else {
            // Buffer until our @id becomes known, or we go up the stack
            if (reverse) {
                util.validateReverseSubject(object);
            }
            parsingContext.getUnidentifiedValueBufferSafe(depthProperties).push({ predicate, object, reverse });
        }
    }
    isPropertyHandler() {
        return true;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        return keys[depth] && !!await util.predicateToTerm(await parsingContext.getContext(keys), keys[depth]);
    }
    async test(parsingContext, util, key, keys, depth) {
        return keys[depth];
    }
    async handle(parsingContext, util, key, keys, value, depth, testResult) {
        const keyOriginal = keys[depth];
        const parentKey = await util.unaliasKeywordParent(keys, depth);
        const context = await parsingContext.getContext(keys);
        const predicate = await util.predicateToTerm(context, key);
        if (predicate) {
            const objectContext = await parsingContext.getContext(keys, 0);
            let object = await util.valueToTerm(objectContext, key, value, depth, keys);
            if (object) {
                const reverse = Util_1.Util.isPropertyReverse(context, keyOriginal, parentKey);
                // Special case if our term was defined as an @list, but does not occur in an array,
                // In that case we just emit it as an RDF list with a single element.
                const listValueContainer = Util_1.Util.getContextValueContainer(context, key) === '@list';
                if (listValueContainer || value['@list']) {
                    if ((listValueContainer || (value['@list'] && !Array.isArray(value['@list']))) && object !== util.rdfNil) {
                        const listPointer = util.dataFactory.blankNode();
                        parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer, util.rdfRest, util.rdfNil, util.getDefaultGraph()));
                        parsingContext.emitQuad(depth, util.dataFactory.quad(listPointer, util.rdfFirst, object, util.getDefaultGraph()));
                        object = listPointer;
                    }
                    // Lists are not allowed in @reverse'd properties
                    if (reverse && !parsingContext.allowSubjectList) {
                        throw new Error(`Found illegal list value in subject position at ${key}`);
                    }
                }
                await EntryHandlerPredicate.handlePredicateObject(parsingContext, util, keys, depth, parentKey, predicate, object, reverse);
            }
            else {
                // An invalid value was encountered, so we ignore it higher in the stack.
                parsingContext.emittedStack[depth] = false;
            }
        }
    }
}
exports.EntryHandlerPredicate = EntryHandlerPredicate;

},{"../Util":26}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An abstract keyword entry handler.
 */
class EntryHandlerKeyword {
    constructor(keyword) {
        this.keyword = keyword;
    }
    isPropertyHandler() {
        return false;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        return false;
    }
    async test(parsingContext, util, key, keys, depth) {
        return key === this.keyword;
    }
}
exports.EntryHandlerKeyword = EntryHandlerKeyword;

},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @context entries.
 */
class EntryHandlerKeywordContext extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@context');
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        // Error if an out-of-order context was found when support is not enabled.
        if (!parsingContext.allowOutOfOrderContext && parsingContext.processingStack[depth]) {
            parsingContext.emitError(new Error('Found an out-of-order context, while support is not enabled.' +
                '(enable with `allowOutOfOrderContext`)'));
        }
        // Find the parent context to inherit from
        const parentContext = parsingContext.getContext(keys.slice(0, -1));
        // Set the context for this scope
        const context = parsingContext.contextParser.parse(value, { baseIri: parsingContext.baseIRI, parentContext: await parentContext });
        parsingContext.contextTree.setContext(keys.slice(0, -1), context);
        parsingContext.emitContext(value);
        await parsingContext.validateContext(await context);
    }
}
exports.EntryHandlerKeywordContext = EntryHandlerKeywordContext;

},{"./EntryHandlerKeyword":33}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @graph entries.
 */
class EntryHandlerKeywordGraph extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@graph');
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        // The current identifier identifies a graph for the deeper level.
        parsingContext.graphStack[depth + 1] = true;
    }
}
exports.EntryHandlerKeywordGraph = EntryHandlerKeywordGraph;

},{"./EntryHandlerKeyword":33}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @id entries.
 */
class EntryHandlerKeywordId extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@id');
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        // Error if an @id for this node already existed.
        if (parsingContext.idStack[depth] !== undefined) {
            parsingContext.emitError(new Error(`Found duplicate @ids '${parsingContext
                .idStack[depth].value}' and '${value}'`));
        }
        // Save our @id on the stack
        parsingContext.idStack[depth] = await util.resourceToTerm(await parsingContext.getContext(keys), value);
    }
}
exports.EntryHandlerKeywordId = EntryHandlerKeywordId;

},{"./EntryHandlerKeyword":33}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../../Util");
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
const EntryHandlerPredicate_1 = require("../EntryHandlerPredicate");
/**
 * Handles @graph entries.
 */
class EntryHandlerKeywordType extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@type');
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        const keyOriginal = keys[depth];
        const parentKey = await util.unaliasKeywordParent(keys, depth);
        // The current identifier identifies an rdf:type predicate.
        // But we only emit it once the node closes,
        // as it's possible that the @type is used to identify the datatype of a literal, which we ignore here.
        const context = await parsingContext.getContext(keys);
        const predicate = util.rdfType;
        const reverse = Util_1.Util.isPropertyReverse(context, keyOriginal, parentKey);
        // Handle multiple values if the value is an array
        if (Array.isArray(value)) {
            for (const element of value) {
                const type = util.createVocabOrBaseTerm(context, element);
                if (type) {
                    await EntryHandlerPredicate_1.EntryHandlerPredicate.handlePredicateObject(parsingContext, util, keys, depth, parentKey, predicate, type, reverse);
                }
            }
        }
        else {
            const type = util.createVocabOrBaseTerm(context, value);
            if (type) {
                await EntryHandlerPredicate_1.EntryHandlerPredicate.handlePredicateObject(parsingContext, util, keys, depth, parentKey, predicate, type, reverse);
            }
        }
    }
}
exports.EntryHandlerKeywordType = EntryHandlerKeywordType;

},{"../../Util":26,"../EntryHandlerPredicate":32,"./EntryHandlerKeyword":33}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../../Util");
/**
 * A catch-all for keywords, that will either emit an error or ignore,
 * depending on whether or not the `errorOnInvalidIris` property is set.
 */
class EntryHandlerKeywordUnknownFallback {
    isPropertyHandler() {
        return false;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        const key = await util.unaliasKeyword(keys[depth], keys, depth);
        if (Util_1.Util.isKeyword(key)) {
            // Don't emit anything inside free-floating lists
            if (!inProperty) {
                if (key === '@list') {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    async test(parsingContext, util, key, keys, depth) {
        return Util_1.Util.isKeyword(key);
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        const keywordType = EntryHandlerKeywordUnknownFallback.VALID_KEYWORDS_TYPES[key];
        if (keywordType !== undefined) {
            if (keywordType && typeof value !== keywordType) {
                parsingContext.emitError(new Error(`Invalid value type for '${key}' with value '${value}'`));
            }
        }
        else if (parsingContext.errorOnInvalidProperties) {
            parsingContext.emitError(new Error(`Unknown keyword '${key}' with value '${value}'`));
        }
        parsingContext.emittedStack[depth] = false;
    }
}
EntryHandlerKeywordUnknownFallback.VALID_KEYWORDS_TYPES = {
    '@index': 'string',
    '@list': null,
    '@reverse': 'object',
    '@set': null,
    '@value': null,
};
exports.EntryHandlerKeywordUnknownFallback = EntryHandlerKeywordUnknownFallback;

},{"../../Util":26}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @value entries.
 */
class EntryHandlerKeywordValue extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@value');
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        // If the value is valid, indicate that we are processing a literal.
        // The actual value will be determined at the parent level when the @value is part of an object,
        // because we may want to take into account additional entries such as @language.
        // See {@link Util.valueToTerm}
        // Indicate that we are processing a literal, and that no later predicates should be parsed at this depth.
        parsingContext.literalStack[depth] = true;
        // Void any buffers that we may have accumulated up until now
        delete parsingContext.unidentifiedValuesBuffer[depth];
        delete parsingContext.unidentifiedGraphsBuffer[depth];
        // Indicate that we have not emitted at this depth
        parsingContext.emittedStack[depth] = false;
    }
}
exports.EntryHandlerKeywordValue = EntryHandlerKeywordValue;

},{"./EntryHandlerKeyword":33}],40:[function(require,module,exports){
(function (Buffer){
/*global Buffer*/
// Named constants with unique integer values
var C = {};
// Tokens
var LEFT_BRACE    = C.LEFT_BRACE    = 0x1;
var RIGHT_BRACE   = C.RIGHT_BRACE   = 0x2;
var LEFT_BRACKET  = C.LEFT_BRACKET  = 0x3;
var RIGHT_BRACKET = C.RIGHT_BRACKET = 0x4;
var COLON         = C.COLON         = 0x5;
var COMMA         = C.COMMA         = 0x6;
var TRUE          = C.TRUE          = 0x7;
var FALSE         = C.FALSE         = 0x8;
var NULL          = C.NULL          = 0x9;
var STRING        = C.STRING        = 0xa;
var NUMBER        = C.NUMBER        = 0xb;
// Tokenizer States
var START   = C.START   = 0x11;
var STOP    = C.STOP    = 0x12;
var TRUE1   = C.TRUE1   = 0x21;
var TRUE2   = C.TRUE2   = 0x22;
var TRUE3   = C.TRUE3   = 0x23;
var FALSE1  = C.FALSE1  = 0x31;
var FALSE2  = C.FALSE2  = 0x32;
var FALSE3  = C.FALSE3  = 0x33;
var FALSE4  = C.FALSE4  = 0x34;
var NULL1   = C.NULL1   = 0x41;
var NULL2   = C.NULL2   = 0x42;
var NULL3   = C.NULL3   = 0x43;
var NUMBER1 = C.NUMBER1 = 0x51;
var NUMBER3 = C.NUMBER3 = 0x53;
var STRING1 = C.STRING1 = 0x61;
var STRING2 = C.STRING2 = 0x62;
var STRING3 = C.STRING3 = 0x63;
var STRING4 = C.STRING4 = 0x64;
var STRING5 = C.STRING5 = 0x65;
var STRING6 = C.STRING6 = 0x66;
// Parser States
var VALUE   = C.VALUE   = 0x71;
var KEY     = C.KEY     = 0x72;
// Parser Modes
var OBJECT  = C.OBJECT  = 0x81;
var ARRAY   = C.ARRAY   = 0x82;
// Character constants
var BACK_SLASH =      "\\".charCodeAt(0);
var FORWARD_SLASH =   "\/".charCodeAt(0);
var BACKSPACE =       "\b".charCodeAt(0);
var FORM_FEED =       "\f".charCodeAt(0);
var NEWLINE =         "\n".charCodeAt(0);
var CARRIAGE_RETURN = "\r".charCodeAt(0);
var TAB =             "\t".charCodeAt(0);

var STRING_BUFFER_SIZE = 64 * 1024;

function Parser() {
  this.tState = START;
  this.value = undefined;

  this.string = undefined; // string data
  this.stringBuffer = Buffer.alloc ? Buffer.alloc(STRING_BUFFER_SIZE) : new Buffer(STRING_BUFFER_SIZE);
  this.stringBufferOffset = 0;
  this.unicode = undefined; // unicode escapes
  this.highSurrogate = undefined;

  this.key = undefined;
  this.mode = undefined;
  this.stack = [];
  this.state = VALUE;
  this.bytes_remaining = 0; // number of bytes remaining in multi byte utf8 char to read after split boundary
  this.bytes_in_sequence = 0; // bytes in multi byte utf8 char to read
  this.temp_buffs = { "2": new Buffer(2), "3": new Buffer(3), "4": new Buffer(4) }; // for rebuilding chars split before boundary is reached

  // Stream offset
  this.offset = -1;
}

// Slow code to string converter (only used when throwing syntax errors)
Parser.toknam = function (code) {
  var keys = Object.keys(C);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    if (C[key] === code) { return key; }
  }
  return code && ("0x" + code.toString(16));
};

var proto = Parser.prototype;
proto.onError = function (err) { throw err; };
proto.charError = function (buffer, i) {
  this.tState = STOP;
  this.onError(new Error("Unexpected " + JSON.stringify(String.fromCharCode(buffer[i])) + " at position " + i + " in state " + Parser.toknam(this.tState)));
};
proto.appendStringChar = function (char) {
  if (this.stringBufferOffset >= STRING_BUFFER_SIZE) {
    this.string += this.stringBuffer.toString('utf8');
    this.stringBufferOffset = 0;
  }

  this.stringBuffer[this.stringBufferOffset++] = char;
};
proto.appendStringBuf = function (buf, start, end) {
  var size = buf.length;
  if (typeof start === 'number') {
    if (typeof end === 'number') {
      if (end < 0) {
        // adding a negative end decreeses the size
        size = buf.length - start + end;
      } else {
        size = end - start;
      }
    } else {
      size = buf.length - start;
    }
  }

  if (size < 0) {
    size = 0;
  }

  if (this.stringBufferOffset + size > STRING_BUFFER_SIZE) {
    this.string += this.stringBuffer.toString('utf8', 0, this.stringBufferOffset);
    this.stringBufferOffset = 0;
  }

  buf.copy(this.stringBuffer, this.stringBufferOffset, start, end);
  this.stringBufferOffset += size;
};
proto.write = function (buffer) {
  if (typeof buffer === "string") buffer = new Buffer(buffer);
  var n;
  for (var i = 0, l = buffer.length; i < l; i++) {
    if (this.tState === START){
      n = buffer[i];
      this.offset++;
      if(n === 0x7b){ this.onToken(LEFT_BRACE, "{"); // {
      }else if(n === 0x7d){ this.onToken(RIGHT_BRACE, "}"); // }
      }else if(n === 0x5b){ this.onToken(LEFT_BRACKET, "["); // [
      }else if(n === 0x5d){ this.onToken(RIGHT_BRACKET, "]"); // ]
      }else if(n === 0x3a){ this.onToken(COLON, ":");  // :
      }else if(n === 0x2c){ this.onToken(COMMA, ","); // ,
      }else if(n === 0x74){ this.tState = TRUE1;  // t
      }else if(n === 0x66){ this.tState = FALSE1;  // f
      }else if(n === 0x6e){ this.tState = NULL1; // n
      }else if(n === 0x22){ // "
        this.string = "";
        this.stringBufferOffset = 0;
        this.tState = STRING1;
      }else if(n === 0x2d){ this.string = "-"; this.tState = NUMBER1; // -
      }else{
        if (n >= 0x30 && n < 0x40) { // 1-9
          this.string = String.fromCharCode(n); this.tState = NUMBER3;
        } else if (n === 0x20 || n === 0x09 || n === 0x0a || n === 0x0d) {
          // whitespace
        } else {
          return this.charError(buffer, i);
        }
      }
    }else if (this.tState === STRING1){ // After open quote
      n = buffer[i]; // get current byte from buffer
      // check for carry over of a multi byte char split between data chunks
      // & fill temp buffer it with start of this data chunk up to the boundary limit set in the last iteration
      if (this.bytes_remaining > 0) {
        for (var j = 0; j < this.bytes_remaining; j++) {
          this.temp_buffs[this.bytes_in_sequence][this.bytes_in_sequence - this.bytes_remaining + j] = buffer[j];
        }

        this.appendStringBuf(this.temp_buffs[this.bytes_in_sequence]);
        this.bytes_in_sequence = this.bytes_remaining = 0;
        i = i + j - 1;
      } else if (this.bytes_remaining === 0 && n >= 128) { // else if no remainder bytes carried over, parse multi byte (>=128) chars one at a time
        if (n <= 193 || n > 244) {
          return this.onError(new Error("Invalid UTF-8 character at position " + i + " in state " + Parser.toknam(this.tState)));
        }
        if ((n >= 194) && (n <= 223)) this.bytes_in_sequence = 2;
        if ((n >= 224) && (n <= 239)) this.bytes_in_sequence = 3;
        if ((n >= 240) && (n <= 244)) this.bytes_in_sequence = 4;
        if ((this.bytes_in_sequence + i) > buffer.length) { // if bytes needed to complete char fall outside buffer length, we have a boundary split
          for (var k = 0; k <= (buffer.length - 1 - i); k++) {
            this.temp_buffs[this.bytes_in_sequence][k] = buffer[i + k]; // fill temp buffer of correct size with bytes available in this chunk
          }
          this.bytes_remaining = (i + this.bytes_in_sequence) - buffer.length;
          i = buffer.length - 1;
        } else {
          this.appendStringBuf(buffer, i, i + this.bytes_in_sequence);
          i = i + this.bytes_in_sequence - 1;
        }
      } else if (n === 0x22) {
        this.tState = START;
        this.string += this.stringBuffer.toString('utf8', 0, this.stringBufferOffset);
        this.stringBufferOffset = 0;
        this.onToken(STRING, this.string);
        this.offset += Buffer.byteLength(this.string, 'utf8') + 1;
        this.string = undefined;
      }
      else if (n === 0x5c) {
        this.tState = STRING2;
      }
      else if (n >= 0x20) { this.appendStringChar(n); }
      else {
          return this.charError(buffer, i);
      }
    }else if (this.tState === STRING2){ // After backslash
      n = buffer[i];
      if(n === 0x22){ this.appendStringChar(n); this.tState = STRING1;
      }else if(n === 0x5c){ this.appendStringChar(BACK_SLASH); this.tState = STRING1;
      }else if(n === 0x2f){ this.appendStringChar(FORWARD_SLASH); this.tState = STRING1;
      }else if(n === 0x62){ this.appendStringChar(BACKSPACE); this.tState = STRING1;
      }else if(n === 0x66){ this.appendStringChar(FORM_FEED); this.tState = STRING1;
      }else if(n === 0x6e){ this.appendStringChar(NEWLINE); this.tState = STRING1;
      }else if(n === 0x72){ this.appendStringChar(CARRIAGE_RETURN); this.tState = STRING1;
      }else if(n === 0x74){ this.appendStringChar(TAB); this.tState = STRING1;
      }else if(n === 0x75){ this.unicode = ""; this.tState = STRING3;
      }else{
        return this.charError(buffer, i);
      }
    }else if (this.tState === STRING3 || this.tState === STRING4 || this.tState === STRING5 || this.tState === STRING6){ // unicode hex codes
      n = buffer[i];
      // 0-9 A-F a-f
      if ((n >= 0x30 && n < 0x40) || (n > 0x40 && n <= 0x46) || (n > 0x60 && n <= 0x66)) {
        this.unicode += String.fromCharCode(n);
        if (this.tState++ === STRING6) {
          var intVal = parseInt(this.unicode, 16);
          this.unicode = undefined;
          if (this.highSurrogate !== undefined && intVal >= 0xDC00 && intVal < (0xDFFF + 1)) { //<56320,57343> - lowSurrogate
            this.appendStringBuf(new Buffer(String.fromCharCode(this.highSurrogate, intVal)));
            this.highSurrogate = undefined;
          } else if (this.highSurrogate === undefined && intVal >= 0xD800 && intVal < (0xDBFF + 1)) { //<55296,56319> - highSurrogate
            this.highSurrogate = intVal;
          } else {
            if (this.highSurrogate !== undefined) {
              this.appendStringBuf(new Buffer(String.fromCharCode(this.highSurrogate)));
              this.highSurrogate = undefined;
            }
            this.appendStringBuf(new Buffer(String.fromCharCode(intVal)));
          }
          this.tState = STRING1;
        }
      } else {
        return this.charError(buffer, i);
      }
    } else if (this.tState === NUMBER1 || this.tState === NUMBER3) {
        n = buffer[i];

        switch (n) {
          case 0x30: // 0
          case 0x31: // 1
          case 0x32: // 2
          case 0x33: // 3
          case 0x34: // 4
          case 0x35: // 5
          case 0x36: // 6
          case 0x37: // 7
          case 0x38: // 8
          case 0x39: // 9
          case 0x2e: // .
          case 0x65: // e
          case 0x45: // E
          case 0x2b: // +
          case 0x2d: // -
            this.string += String.fromCharCode(n);
            this.tState = NUMBER3;
            break;
          default:
            this.tState = START;
            var result = Number(this.string);

            if (isNaN(result)){
              return this.charError(buffer, i);
            }

            if ((this.string.match(/[0-9]+/) == this.string) && (result.toString() != this.string)) {
              // Long string of digits which is an ID string and not valid and/or safe JavaScript integer Number
              this.onToken(STRING, this.string);
            } else {
              this.onToken(NUMBER, result);
            }

            this.offset += this.string.length - 1;
            this.string = undefined;
            i--;
            break;
        }
    }else if (this.tState === TRUE1){ // r
      if (buffer[i] === 0x72) { this.tState = TRUE2; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === TRUE2){ // u
      if (buffer[i] === 0x75) { this.tState = TRUE3; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === TRUE3){ // e
      if (buffer[i] === 0x65) { this.tState = START; this.onToken(TRUE, true); this.offset+= 3; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === FALSE1){ // a
      if (buffer[i] === 0x61) { this.tState = FALSE2; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === FALSE2){ // l
      if (buffer[i] === 0x6c) { this.tState = FALSE3; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === FALSE3){ // s
      if (buffer[i] === 0x73) { this.tState = FALSE4; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === FALSE4){ // e
      if (buffer[i] === 0x65) { this.tState = START; this.onToken(FALSE, false); this.offset+= 4; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === NULL1){ // u
      if (buffer[i] === 0x75) { this.tState = NULL2; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === NULL2){ // l
      if (buffer[i] === 0x6c) { this.tState = NULL3; }
      else { return this.charError(buffer, i); }
    }else if (this.tState === NULL3){ // l
      if (buffer[i] === 0x6c) { this.tState = START; this.onToken(NULL, null); this.offset += 3; }
      else { return this.charError(buffer, i); }
    }
  }
};
proto.onToken = function (token, value) {
  // Override this to get events
};

proto.parseError = function (token, value) {
  this.tState = STOP;
  this.onError(new Error("Unexpected " + Parser.toknam(token) + (value ? ("(" + JSON.stringify(value) + ")") : "") + " in state " + Parser.toknam(this.state)));
};
proto.push = function () {
  this.stack.push({value: this.value, key: this.key, mode: this.mode});
};
proto.pop = function () {
  var value = this.value;
  var parent = this.stack.pop();
  this.value = parent.value;
  this.key = parent.key;
  this.mode = parent.mode;
  this.emit(value);
  if (!this.mode) { this.state = VALUE; }
};
proto.emit = function (value) {
  if (this.mode) { this.state = COMMA; }
  this.onValue(value);
};
proto.onValue = function (value) {
  // Override me
};
proto.onToken = function (token, value) {
  if(this.state === VALUE){
    if(token === STRING || token === NUMBER || token === TRUE || token === FALSE || token === NULL){
      if (this.value) {
        this.value[this.key] = value;
      }
      this.emit(value);
    }else if(token === LEFT_BRACE){
      this.push();
      if (this.value) {
        this.value = this.value[this.key] = {};
      } else {
        this.value = {};
      }
      this.key = undefined;
      this.state = KEY;
      this.mode = OBJECT;
    }else if(token === LEFT_BRACKET){
      this.push();
      if (this.value) {
        this.value = this.value[this.key] = [];
      } else {
        this.value = [];
      }
      this.key = 0;
      this.mode = ARRAY;
      this.state = VALUE;
    }else if(token === RIGHT_BRACE){
      if (this.mode === OBJECT) {
        this.pop();
      } else {
        return this.parseError(token, value);
      }
    }else if(token === RIGHT_BRACKET){
      if (this.mode === ARRAY) {
        this.pop();
      } else {
        return this.parseError(token, value);
      }
    }else{
      return this.parseError(token, value);
    }
  }else if(this.state === KEY){
    if (token === STRING) {
      this.key = value;
      this.state = COLON;
    } else if (token === RIGHT_BRACE) {
      this.pop();
    } else {
      return this.parseError(token, value);
    }
  }else if(this.state === COLON){
    if (token === COLON) { this.state = VALUE; }
    else { return this.parseError(token, value); }
  }else if(this.state === COMMA){
    if (token === COMMA) {
      if (this.mode === ARRAY) { this.key++; this.state = VALUE; }
      else if (this.mode === OBJECT) { this.state = KEY; }

    } else if (token === RIGHT_BRACKET && this.mode === ARRAY || token === RIGHT_BRACE && this.mode === OBJECT) {
      this.pop();
    } else {
      return this.parseError(token, value);
    }
  }else{
    return this.parseError(token, value);
  }
};

Parser.C = C;

module.exports = Parser;

}).call(this,require("buffer").Buffer)
},{"buffer":11}],41:[function(require,module,exports){
(function (process){
'use strict';

if (typeof process === 'undefined' ||
    !process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":42}],42:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],43:[function(require,module,exports){
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":44}],44:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":46,"./_stream_writable":48,"core-util-is":12,"inherits":15,"process-nextick-args":41}],45:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":47,"core-util-is":12,"inherits":15}],46:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":44,"./internal/streams/BufferList":49,"./internal/streams/destroy":50,"./internal/streams/stream":51,"_process":42,"core-util-is":12,"events":13,"inherits":15,"isarray":17,"process-nextick-args":41,"safe-buffer":59,"string_decoder/":52,"util":10}],47:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":44,"core-util-is":12,"inherits":15}],48:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"./_stream_duplex":44,"./internal/streams/destroy":50,"./internal/streams/stream":51,"_process":42,"core-util-is":12,"inherits":15,"process-nextick-args":41,"safe-buffer":59,"timers":61,"util-deprecate":62}],49:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":59,"util":10}],50:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":41}],51:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":13}],52:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":59}],53:[function(require,module,exports){
module.exports = require('./readable').PassThrough

},{"./readable":54}],54:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":44,"./lib/_stream_passthrough.js":45,"./lib/_stream_readable.js":46,"./lib/_stream_transform.js":47,"./lib/_stream_writable.js":48}],55:[function(require,module,exports){
module.exports = require('./readable').Transform

},{"./readable":54}],56:[function(require,module,exports){
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":48}],57:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./lib/Resolve"));

},{"./lib/Resolve":58}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Convert the given relative IRI to an absolute IRI
 * by taking into account the given optional baseIRI.
 *
 * @param {string} relativeIRI The relative IRI to convert to an absolute IRI.
 * @param {string} baseIRI The optional base IRI.
 * @return {string} an absolute IRI.
 */
function resolve(relativeIRI, baseIRI) {
    baseIRI = baseIRI || '';
    const baseFragmentPos = baseIRI.indexOf('#');
    // Ignore any fragments in the base IRI
    if (baseFragmentPos > 0) {
        baseIRI = baseIRI.substr(0, baseFragmentPos);
    }
    // Convert empty value directly to base IRI
    if (!relativeIRI.length) {
        return baseIRI;
    }
    // If the value starts with a query character, concat directly (but strip the existing query)
    if (relativeIRI.startsWith('?')) {
        const baseQueryPos = baseIRI.indexOf('?');
        if (baseQueryPos > 0) {
            baseIRI = baseIRI.substr(0, baseQueryPos);
        }
        return baseIRI + relativeIRI;
    }
    // If the value starts with a fragment character, concat directly
    if (relativeIRI.startsWith('#')) {
        return baseIRI + relativeIRI;
    }
    // Ignore baseIRI if it is empty
    if (!baseIRI.length) {
        return removeDotSegmentsOfPath(relativeIRI, relativeIRI.indexOf(':'));
    }
    // Ignore baseIRI if the value is absolute
    const valueColonPos = relativeIRI.indexOf(':');
    if (valueColonPos >= 0) {
        return removeDotSegmentsOfPath(relativeIRI, valueColonPos);
    }
    // At this point, the baseIRI MUST be absolute, otherwise we error
    const baseColonPos = baseIRI.indexOf(':');
    if (baseColonPos < 0) {
        throw new Error(`Found invalid baseIRI '${baseIRI}' for value '${relativeIRI}'`);
    }
    const baseIRIScheme = baseIRI.substr(0, baseColonPos + 1);
    // Inherit the baseIRI scheme if the value starts with '//'
    if (relativeIRI.indexOf('//') === 0) {
        return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
    }
    // Check cases where '://' occurs in the baseIRI, and where there is no '/' after a ':' anymore.
    let baseSlashAfterColonPos;
    if (baseIRI.indexOf('//', baseColonPos) === baseColonPos + 1) {
        // If there is no additional '/' after the '//'.
        baseSlashAfterColonPos = baseIRI.indexOf('/', baseColonPos + 3);
        if (baseSlashAfterColonPos < 0) {
            // If something other than a '/' follows the '://', append the value after a '/',
            // otherwise, prefix the value with only the baseIRI scheme.
            if (baseIRI.length > baseColonPos + 3) {
                return baseIRI + '/' + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
            }
            else {
                return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
            }
        }
    }
    else {
        // If there is not even a single '/' after the ':'
        baseSlashAfterColonPos = baseIRI.indexOf('/', baseColonPos + 1);
        if (baseSlashAfterColonPos < 0) {
            // If we don't have a '/' after the ':',
            // prefix the value with only the baseIRI scheme.
            return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
        }
    }
    // If the value starts with a '/', then prefix it with everything before the first effective slash of the base IRI.
    if (relativeIRI.indexOf('/') === 0) {
        return baseIRI.substr(0, baseSlashAfterColonPos) + removeDotSegments(relativeIRI);
    }
    let baseIRIPath = baseIRI.substr(baseSlashAfterColonPos);
    const baseIRILastSlashPos = baseIRIPath.lastIndexOf('/');
    // Ignore everything after the last '/' in the baseIRI path
    if (baseIRILastSlashPos >= 0 && baseIRILastSlashPos < baseIRIPath.length - 1) {
        baseIRIPath = baseIRIPath.substr(0, baseIRILastSlashPos + 1);
        // Also remove the first character of the relative path if it starts with '.' (and not '..' or './')
        // This change is only allowed if there is something else following the path
        if (relativeIRI[0] === '.' && relativeIRI[1] !== '.' && relativeIRI[1] !== '/' && relativeIRI[2]) {
            relativeIRI = relativeIRI.substr(1);
        }
    }
    // Prefix the value with the baseIRI path where
    relativeIRI = baseIRIPath + relativeIRI;
    // Remove dot segment from the IRI
    relativeIRI = removeDotSegments(relativeIRI);
    // Prefix our transformed value with the part of the baseIRI until the first '/' after the first ':'.
    return baseIRI.substr(0, baseSlashAfterColonPos) + relativeIRI;
}
exports.resolve = resolve;
/**
 * Remove dot segments from the given path,
 * as described in https://www.ietf.org/rfc/rfc3986.txt (page 32).
 * @param {string} path An IRI path.
 * @return {string} A path, will always start with a '/'.
 */
function removeDotSegments(path) {
    // Prepare a buffer with segments between each '/.
    // Each segment represents an array of characters.
    const segmentBuffers = [];
    let i = 0;
    while (i < path.length) {
        // Remove '/.' or '/..'
        switch (path[i]) {
            case '/':
                if (path[i + 1] === '.') {
                    if (path[i + 2] === '.') {
                        // Start a new segment if we find an invalid character after the '.'
                        if (!isCharacterAllowedAfterRelativePathSegment(path[i + 3])) {
                            segmentBuffers.push([]);
                            i++;
                            break;
                        }
                        // Go to parent directory,
                        // so we remove a parent segment
                        segmentBuffers.pop();
                        // Ensure that we end with a slash if there is a trailing '/..'
                        if (!path[i + 3]) {
                            segmentBuffers.push([]);
                        }
                        i += 3;
                    }
                    else {
                        // Start a new segment if we find an invalid character after the '.'
                        if (!isCharacterAllowedAfterRelativePathSegment(path[i + 2])) {
                            segmentBuffers.push([]);
                            i++;
                            break;
                        }
                        // Ensure that we end with a slash if there is a trailing '/.'
                        if (!path[i + 2]) {
                            segmentBuffers.push([]);
                        }
                        // Go to the current directory,
                        // so we do nothing
                        i += 2;
                    }
                }
                else {
                    // Start a new segment
                    segmentBuffers.push([]);
                    i++;
                }
                break;
            case '#':
            case '?':
                // Query and fragment string should be appended unchanged
                if (!segmentBuffers.length) {
                    segmentBuffers.push([]);
                }
                segmentBuffers[segmentBuffers.length - 1].push(path.substr(i));
                // Break the while loop
                i = path.length;
                break;
            default:
                // Not a special character, just append it to our buffer
                if (!segmentBuffers.length) {
                    segmentBuffers.push([]);
                }
                segmentBuffers[segmentBuffers.length - 1].push(path[i]);
                i++;
                break;
        }
    }
    return '/' + segmentBuffers.map((buffer) => buffer.join('')).join('/');
}
exports.removeDotSegments = removeDotSegments;
/**
 * Removes dot segments of the given IRI.
 * @param {string} iri An IRI (or part of IRI).
 * @param {number} colonPosition The position of the first ':' in the IRI.
 * @return {string} The IRI where dot segments were removed.
 */
function removeDotSegmentsOfPath(iri, colonPosition) {
    // Determine where we should start looking for the first '/' that indicates the start of the path
    let searchOffset = colonPosition + 1;
    if (colonPosition >= 0) {
        if (iri[colonPosition + 1] === '/' && iri[colonPosition + 2] === '/') {
            searchOffset = colonPosition + 3;
        }
    }
    else {
        if (iri[0] === '/' && iri[1] === '/') {
            searchOffset = 2;
        }
    }
    // Determine the path
    const pathSeparator = iri.indexOf('/', searchOffset);
    if (pathSeparator < 0) {
        return iri;
    }
    const base = iri.substr(0, pathSeparator);
    const path = iri.substr(pathSeparator);
    // Remove dot segments from the path
    return base + removeDotSegments(path);
}
exports.removeDotSegmentsOfPath = removeDotSegmentsOfPath;
function isCharacterAllowedAfterRelativePathSegment(character) {
    return !character || character === '#' || character === '?' || character === '/';
}

},{}],59:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":11}],60:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":13,"inherits":15,"readable-stream/duplex.js":43,"readable-stream/passthrough.js":53,"readable-stream/readable.js":54,"readable-stream/transform.js":55,"readable-stream/writable.js":56}],61:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":42,"timers":61}],62:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],63:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],64:[function(require,module,exports){
"use strict";

const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;
/*
  It should be strai
// https://github.com/rdfjs/rdfxml-streaming-parser.js
const RdfXmlParser = require("rdfxml-streaming-parser").RdfXmlParser;
*/

let repost = function(type, dataFromParser) {
  //console.log(type, dataFromParser);
  self.postMessage({type: type, data: dataFromParser});
}

self.onmessage = function(event) {
  let url = event.data.url;
  var parser;
  if (url.endsWith('jsonld')) {
    parser = new JsonLdParser();
  } else {
    throw new Error(`Not yet handling ${url} just .jsonld`);
  }
   parser
    .on('context', (data) => {repost('context', data)})
    .on('data',    (data) => {self.postMessage(data)})
    .on('error',   (data) => {repost('error', data)})
    .on('end',     (data) => {repost('end', data)});
  fetch(url)
    // Until streaming is solved, do the whole response at one go.
    .then(response => response.text())
    .then(text => {
      parser.write(text);
      parser.end();
    })
    .catch(console.log);
  /*
    // TODO figure out how to feed a stream to the parser
    //   https://developer.mozilla.org/en-US/docs/Web/API/Body/body
    // Is the problem that parser.import expects a NodeJS EventEmitter?
    .then(response => response.body)
    .then(body => body.getReader())
    .then(stream => parser.import(stream))
  */
}


},{"jsonld-streaming-parser":22}]},{},[64]);
