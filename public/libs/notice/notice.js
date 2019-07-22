(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("NoticeJs", [], factory);
	else if(typeof exports === 'object')
		exports["NoticeJs"] = factory();
	else
		root["NoticeJs"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var noticeJsModalClassName = exports.noticeJsModalClassName = 'noticejs-modal';
var closeAnimation = exports.closeAnimation = 'noticejs-fadeOut';

var Defaults = exports.Defaults = {
    title: '',
    text: '',
    type: 'success',
    position: 'topRight',
    newestOnTop: false,
    timeout: 30,
    progressBar: true,
    indeterminate: false,
    closeWith: ['button'],
    animation: null,
    modal: false,
    width: 320,
    scroll: {
        maxHeightContent: 300,
        showOnHover: true
    },
    rtl: false,
    callbacks: {
        beforeShow: [],
        onShow: [],
        afterShow: [],
        onClose: [],
        afterClose: [],
        onClick: [],
        onHover: [],
        onTemplate: []
    }
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.appendNoticeJs = exports.addListener = exports.CloseItem = exports.AddModal = undefined;
exports.getCallback = getCallback;

var _api = __webpack_require__(0);

var API = _interopRequireWildcard(_api);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var options = API.Defaults;

/**
 * @param {NoticeJs} ref
 * @param {string} eventName
 * @return {void}
 */
function getCallback(ref, eventName) {
    if (ref.callbacks.hasOwnProperty(eventName)) {
        ref.callbacks[eventName].forEach(function (cb) {
            if (typeof cb === 'function') {
                cb.apply(ref);
            }
        });
    }
}

var AddModal = exports.AddModal = function AddModal() {
    if (document.getElementsByClassName(API.noticeJsModalClassName).length <= 0) {
        var element = document.createElement('div');
        element.classList.add(API.noticeJsModalClassName);
        element.classList.add('noticejs-modal-open');
        document.body.appendChild(element);
        // Remove class noticejs-modal-open
        setTimeout(function () {
            element.className = API.noticeJsModalClassName;
        }, 200);
    }
};

var CloseItem = exports.CloseItem = function CloseItem(item) {
    getCallback(options, 'onClose');

    // Set animation to close notification item
    if (options.animation !== null && options.animation.close !== null) {
        item.className += ' ' + options.animation.close;
    }
    setTimeout(function () {
        item.remove();
    }, 200);

    // Close modal
    if (options.modal === true && document.querySelectorAll("[noticejs-modal='true']").length >= 1) {
        document.querySelector('.noticejs-modal').className += ' noticejs-modal-close';
        setTimeout(function () {
            document.querySelector('.noticejs-modal').remove();
        }, 500);
    }

    // Remove container
    var position = '.' + item.closest('.noticejs').className.replace('noticejs', '').trim();
    setTimeout(function () {
        if (document.querySelectorAll(position + ' .item').length <= 0) {
            document.querySelector(position) && document.querySelector(position).remove();
        }
    }, 500);
};

var addListener = exports.addListener = function addListener(item) {
    // Add close button Event
    if (options.closeWith.includes('button')) {
        item.querySelector('.close').addEventListener('click', function () {
            CloseItem(item);
        });
    }

    // Add close by click Event
    if (options.closeWith.includes('click')) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function (e) {
            if (e.target.className !== 'close') {
                getCallback(options, 'onClick');
                CloseItem(item);
            }
        });
    } else {
        item.addEventListener('click', function (e) {
            if (e.target.className !== 'close') {
                getCallback(options, 'onClick');
            }
        });
    }

    item.addEventListener('mouseover', function () {
        getCallback(options, 'onHover');
    });
};

var appendNoticeJs = exports.appendNoticeJs = function appendNoticeJs(noticeJsHeader, noticeJsBody, noticeJsProgressBar) {
    var target_class = '.noticejs-' + options.position;
    // Create NoticeJs item
    var noticeJsItem = document.createElement('div');
    noticeJsItem.classList.add('item');
    noticeJsItem.classList.add(options.type);
    if (options.rtl === true) {
        noticeJsItem.classList.add('noticejs-rtl');
    }
    if (options.width !== '' && Number.isInteger(options.width)) {
        noticeJsItem.style.width = options.width + 'px';
    }

    // Add Header
    if (noticeJsHeader && noticeJsHeader !== '') {
        noticeJsItem.appendChild(noticeJsHeader);
    }

    // Add body
    noticeJsItem.appendChild(noticeJsBody);

    // Add progress bar
    if (noticeJsProgressBar && noticeJsProgressBar !== '') {
        noticeJsItem.appendChild(noticeJsProgressBar);
    }

    // Empty top and bottom container
    if (['top', 'bottom'].includes(options.position)) {
        document.querySelector(target_class).innerHTML = '';
    }

    // Add open animation
    if (options.animation !== null && options.animation.open !== null) {
        noticeJsItem.className += ' ' + options.animation.open;
    }

    // Add Modal
    if (options.modal === true) {
        noticeJsItem.setAttribute('noticejs-modal', 'true');
        AddModal();
    }

    // Add Listener
    addListener(noticeJsItem, options.closeWith);

    getCallback(options, 'beforeShow');
    getCallback(options, 'onShow');
    if (options.newestOnTop === true) {
        document.querySelector(target_class).insertAdjacentElement('afterbegin', noticeJsItem);
    } else {
        document.querySelector(target_class).appendChild(noticeJsItem);
    }
    getCallback(options, 'afterShow');

    return noticeJsItem;
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _noticejs = __webpack_require__(3);

var _noticejs2 = _interopRequireDefault(_noticejs);

var _api = __webpack_require__(0);

var API = _interopRequireWildcard(_api);

var _components = __webpack_require__(4);

var _helpers = __webpack_require__(1);

var helper = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NoticeJs = function () {
  /**
   * @param {object} options 
   * @returns {Noty}
   */
  function NoticeJs() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, NoticeJs);

    this.options = Object.assign(API.Defaults, options);
    this.component = new _components.Components();
    this.id = "noticejs-" + Math.random();

    this.on('beforeShow', this.options.callbacks.beforeShow);
    this.on('onShow', this.options.callbacks.onShow);
    this.on('afterShow', this.options.callbacks.afterShow);
    this.on('onClose', this.options.callbacks.onClose);
    this.on('afterClose', this.options.callbacks.afterClose);
    this.on('onClick', this.options.callbacks.onClick);
    this.on('onHover', this.options.callbacks.onHover);

    return this;
  }

  /**
   * @returns {NoticeJs}
   */


  _createClass(NoticeJs, [{
    key: 'show',
    value: function show() {
      var container = this.component.createContainer();
      if (document.querySelector('.noticejs-' + this.options.position) === null) {
        document.body.appendChild(container);
      }

      var noticeJsHeader = void 0;
      var noticeJsBody = void 0;
      var noticeJsProgressBar = void 0;

      // Create NoticeJs header
      noticeJsHeader = this.component.createHeader(this.options.title, this.options.closeWith);

      // Create NoticeJs body
      noticeJsBody = this.component.createBody(this.options.text);

      // Create NoticeJs progressBar
      if (this.options.progressBar === true) {
        noticeJsProgressBar = this.component.createProgressBar();
      }

      //Append NoticeJs
      var noticeJs = helper.appendNoticeJs(noticeJsHeader, noticeJsBody, noticeJsProgressBar);
      noticeJs.setAttribute("id", this.id);
      this.dom = noticeJs;
      return noticeJs;
    }

    /**
     * @param {string} eventName
     * @param {function} cb
     * @return {NoticeJs}
     */

  }, {
    key: 'on',
    value: function on(eventName) {
      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

      if (typeof cb === 'function' && this.options.callbacks.hasOwnProperty(eventName)) {
        this.options.callbacks[eventName].push(cb);
      }

      return this;
    }

    /**
     * @param {Object} options 
     * @return {Notice}
     */

  }, {
    key: 'close',


    /**
     * close
     */
    value: function close() {
      helper.CloseItem(this.dom);
    }
  }], [{
    key: 'overrideDefaults',
    value: function overrideDefaults(options) {
      this.options = Object.assign(API.Defaults, options);
      return this;
    }
  }]);

  return NoticeJs;
}();

exports.default = NoticeJs;
module.exports = exports['default'];

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Components = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _api = __webpack_require__(0);

var API = _interopRequireWildcard(_api);

var _helpers = __webpack_require__(1);

var helper = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var options = API.Defaults;

var Components = exports.Components = function () {
  function Components() {
    _classCallCheck(this, Components);
  }

  _createClass(Components, [{
    key: 'createContainer',
    value: function createContainer() {
      var element_class = 'noticejs-' + options.position;
      var element = document.createElement('div');
      element.classList.add('noticejs');
      element.classList.add(element_class);

      return element;
    }
  }, {
    key: 'createHeader',
    value: function createHeader() {
      var element = void 0;
      if (options.title && options.title !== '') {
        element = document.createElement('div');
        element.setAttribute('class', 'noticejs-heading');
        element.textContent = options.title;
      }

      // Add close button
      if (options.closeWith.includes('button')) {
        var close = document.createElement('div');
        close.setAttribute('class', 'close');
        close.innerHTML = '&times;';
        if (element) {
          element.appendChild(close);
        } else {
          element = close;
        }
      }

      return element;
    }
  }, {
    key: 'createBody',
    value: function createBody() {
      var element = document.createElement('div');
      element.setAttribute('class', 'noticejs-body');
      var content = document.createElement('div');
      content.setAttribute('class', 'noticejs-content');
      content.innerHTML = options.text;
      element.appendChild(content);

      if (options.scroll !== null && options.scroll.maxHeight !== '') {
        element.style.overflowY = 'auto';
        element.style.maxHeight = options.scroll.maxHeight + 'px';

        if (options.scroll.showOnHover === true) {
          element.style.visibility = 'hidden';
        }
      }
      return element;
    }
  }, {
    key: 'createProgressBar',
    value: function createProgressBar() {
      var element = document.createElement('div');
      element.setAttribute('class', 'noticejs-progressbar');
      var bar = document.createElement('div');
      bar.setAttribute('class', 'noticejs-bar');
      element.appendChild(bar);

      // Progress bar animation
      if (options.progressBar === true && typeof options.timeout !== 'boolean' && options.timeout !== false) {
        var _frame = function _frame() {
          if (width <= 0) {
            clearInterval(id);

            var item = element.closest('div.item');
            // Add close animation
            if (options.animation !== null && options.animation.close !== null) {

              // Remove open animation class
              item.className = item.className.replace(new RegExp('(?:^|\\s)' + options.animation.open + '(?:\\s|$)'), ' ');
              // Add close animation class
              item.className += ' ' + options.animation.close;

              // Close notification after 0.5s + timeout
              var close_time = parseInt(options.timeout) + 500;
              setTimeout(function () {
                helper.CloseItem(item);
              }, close_time);
            } else {
              // Close notification when progress bar completed
              helper.CloseItem(item);
            }
          } else {
            width--;
            bar.style.width = width + '%';
          }
        };

        var _indeterminateFrame = function _indeterminateFrame() {
          if (progressDirection === 0) {
            width--;
            if (width === 0) {
              progressDirection = 1;
            }
          } else {
            width++;
            if (width === 100) {
              progressDirection = 0;
            }
          }

          if (document.getElementById(domId) == null) {
            clearInterval(id);
          } else {
            bar.style.width = width + '%';
          }
        };

        var width = 100;
        var progressDirection = 0;
        var id = 0;
        var domId = "";

        if (options.indeterminate === true) {
          id = setInterval(_indeterminateFrame, options.timeout);
          domId = "noticejs-progressbar-" + id;
          element.setAttribute("id", domId);
        } else {
          id = setInterval(_frame, options.timeout);
        }
      }

      return element;
    }
  }]);

  return Components;
}();

/***/ })
/******/ ]);
});