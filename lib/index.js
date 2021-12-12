"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDynamicPattern = exports.globbySync = exports.globbyStream = exports.globby = exports.generateGlobTasks = void 0;
Object.defineProperty(exports, "isGitIgnored", {
  enumerable: true,
  get: function get() {
    return _gitignore.isGitIgnored;
  }
});
Object.defineProperty(exports, "isGitIgnoredSync", {
  enumerable: true,
  get: function get() {
    return _gitignore.isGitIgnoredSync;
  }
});

var _nodeFs = require("node:fs");

var _arrayUnion = require("array-union");

var _merge = require("merge2");

var _fastGlob = require("fast-glob");

var _dirGlob = require("dir-glob");

var _gitignore = require("./gitignore.js");

var _streamUtils = require("./stream-utils.js");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DEFAULT_FILTER = function DEFAULT_FILTER() {
  return false;
};

var isNegative = function isNegative(pattern) {
  return pattern[0] === '!';
};

var assertPatternsInput = function assertPatternsInput(patterns) {
  if (!patterns.every(function (pattern) {
    return typeof pattern === 'string';
  })) {
    throw new TypeError('Patterns must be a string or an array of strings');
  }
};

var checkCwdOption = function checkCwdOption() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!options.cwd) {
    return;
  }

  var stat;

  try {
    stat = _nodeFs.statSync(options.cwd);
  } catch (_unused) {
    return;
  }

  if (!stat.isDirectory()) {
    throw new Error('The `cwd` option must be a path to a directory');
  }
};

var getPathString = function getPathString(p) {
  return p.stats instanceof _nodeFs.Stats ? p.path : p;
};

var generateGlobTasks = function generateGlobTasks(patterns, taskOptions) {
  patterns = _arrayUnion([patterns].flat());
  assertPatternsInput(patterns);
  checkCwdOption(taskOptions);
  var globTasks = [];
  taskOptions = _objectSpread({
    ignore: [],
    expandDirectories: true
  }, taskOptions);

  var _iterator = _createForOfIteratorHelper(patterns.entries()),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _slicedToArray(_step.value, 2),
          index = _step$value[0],
          pattern = _step$value[1];

      if (isNegative(pattern)) {
        continue;
      }

      var ignore = patterns.slice(index).filter(function (pattern) {
        return isNegative(pattern);
      }).map(function (pattern) {
        return pattern.slice(1);
      });

      var options = _objectSpread(_objectSpread({}, taskOptions), {}, {
        ignore: [].concat(_toConsumableArray(taskOptions.ignore), _toConsumableArray(ignore))
      });

      globTasks.push({
        pattern: pattern,
        options: options
      });
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return globTasks;
};

exports.generateGlobTasks = generateGlobTasks;

var globDirectories = function globDirectories(task, fn) {
  var options = {};

  if (task.options.cwd) {
    options.cwd = task.options.cwd;
  }

  if (Array.isArray(task.options.expandDirectories)) {
    options = _objectSpread(_objectSpread({}, options), {}, {
      files: task.options.expandDirectories
    });
  } else if (_typeof(task.options.expandDirectories) === 'object') {
    options = _objectSpread(_objectSpread({}, options), task.options.expandDirectories);
  }

  return fn(task.pattern, options);
};

var getPattern = function getPattern(task, fn) {
  return task.options.expandDirectories ? globDirectories(task, fn) : [task.pattern];
};

var getFilterSync = function getFilterSync(options) {
  return options && options.gitignore ? (0, _gitignore.isGitIgnoredSync)({
    cwd: options.cwd,
    ignore: options.ignore
  }) : DEFAULT_FILTER;
};

var globToTask = function globToTask(task) {
  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(glob) {
      var options;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              options = task.options;

              if (!(options.ignore && Array.isArray(options.ignore) && options.expandDirectories)) {
                _context.next = 5;
                break;
              }

              _context.next = 4;
              return _dirGlob(options.ignore);

            case 4:
              options.ignore = _context.sent;

            case 5:
              return _context.abrupt("return", {
                pattern: glob,
                options: options
              });

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
};

var globToTaskSync = function globToTaskSync(task) {
  return function (glob) {
    var options = task.options;

    if (options.ignore && Array.isArray(options.ignore) && options.expandDirectories) {
      options.ignore = _dirGlob.sync(options.ignore);
    }

    return {
      pattern: glob,
      options: options
    };
  };
};

var globby = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(patterns, options) {
    var globTasks, getFilter, getTasks, _yield$Promise$all, _yield$Promise$all2, filter, tasks, paths;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            globTasks = generateGlobTasks(patterns, options);

            getFilter = /*#__PURE__*/function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        return _context2.abrupt("return", options && options.gitignore ? (0, _gitignore.isGitIgnored)({
                          cwd: options.cwd,
                          ignore: options.ignore
                        }) : DEFAULT_FILTER);

                      case 1:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2);
              }));

              return function getFilter() {
                return _ref3.apply(this, arguments);
              };
            }();

            getTasks = /*#__PURE__*/function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                var tasks;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        _context4.next = 2;
                        return Promise.all(globTasks.map( /*#__PURE__*/function () {
                          var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(task) {
                            var globs;
                            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                              while (1) {
                                switch (_context3.prev = _context3.next) {
                                  case 0:
                                    _context3.next = 2;
                                    return getPattern(task, _dirGlob);

                                  case 2:
                                    globs = _context3.sent;
                                    return _context3.abrupt("return", Promise.all(globs.map(globToTask(task))));

                                  case 4:
                                  case "end":
                                    return _context3.stop();
                                }
                              }
                            }, _callee3);
                          }));

                          return function (_x4) {
                            return _ref5.apply(this, arguments);
                          };
                        }()));

                      case 2:
                        tasks = _context4.sent;
                        return _context4.abrupt("return", _arrayUnion.apply(void 0, _toConsumableArray(tasks)));

                      case 4:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4);
              }));

              return function getTasks() {
                return _ref4.apply(this, arguments);
              };
            }();

            _context5.next = 5;
            return Promise.all([getFilter(), getTasks()]);

          case 5:
            _yield$Promise$all = _context5.sent;
            _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 2);
            filter = _yield$Promise$all2[0];
            tasks = _yield$Promise$all2[1];
            _context5.next = 11;
            return Promise.all(tasks.map(function (task) {
              return _fastGlob(task.pattern, task.options);
            }));

          case 11:
            paths = _context5.sent;
            return _context5.abrupt("return", _arrayUnion.apply(void 0, _toConsumableArray(paths)).filter(function (path_) {
              return !filter(getPathString(path_));
            }));

          case 13:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function globby(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

exports.globby = globby;

var globbySync = function globbySync(patterns, options) {
  var globTasks = generateGlobTasks(patterns, options);
  var tasks = [];

  var _iterator2 = _createForOfIteratorHelper(globTasks),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _task = _step2.value;
      var newTask = getPattern(_task, _dirGlob.sync).map(globToTaskSync(_task));
      tasks.push.apply(tasks, _toConsumableArray(newTask));
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  var filter = getFilterSync(options);
  var matches = [];

  for (var _i2 = 0, _tasks = tasks; _i2 < _tasks.length; _i2++) {
    var task = _tasks[_i2];
    matches = _arrayUnion(matches, _fastGlob.sync(task.pattern, task.options));
  }

  return matches.filter(function (path_) {
    return !filter(path_);
  });
};

exports.globbySync = globbySync;

var globbyStream = function globbyStream(patterns, options) {
  var globTasks = generateGlobTasks(patterns, options);
  var tasks = [];

  var _iterator3 = _createForOfIteratorHelper(globTasks),
      _step3;

  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var task = _step3.value;
      var newTask = getPattern(task, _dirGlob.sync).map(globToTaskSync(task));
      tasks.push.apply(tasks, _toConsumableArray(newTask));
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }

  var filter = getFilterSync(options);
  var filterStream = new _streamUtils.FilterStream(function (p) {
    return !filter(p);
  });
  var uniqueStream = new _streamUtils.UniqueStream();
  return _merge(tasks.map(function (task) {
    return _fastGlob.stream(task.pattern, task.options);
  })).pipe(filterStream).pipe(uniqueStream);
};

exports.globbyStream = globbyStream;

var isDynamicPattern = function isDynamicPattern(patterns, options) {
  return [patterns].flat().some(function (pattern) {
    return _fastGlob.isDynamicPattern(pattern, options);
  });
};

exports.isDynamicPattern = isDynamicPattern;