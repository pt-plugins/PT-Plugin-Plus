/**
 * 拖放功能
 * @see http://demo.jb51.net/js/2015/js-mxdx-draw-plug-codes/
 */
function Drag() {
  // 初始化
  this.initialize.apply(this, arguments);
}
Drag.prototype = {
  // 参数设置
  setOptions: function(options) {
    this.options = {
      // 事件对象
      handle: this.drag,
      // 锁定范围
      limit: true,
      // 锁定位置
      lock: false,
      // 锁定水平位置
      lockX: false,
      // 锁定垂直位置
      lockY: false,
      // 指定限制容器
      maxContainer: document.documentElement || document.body,

      // 开始时回调函数
      onStart: function() {},
      // 拖拽时回调函数
      onMove: function() {},
      // 停止时回调函数
      onStop: function() {}
    };
    for (var p in options) this.options[p] = options[p];
  },
  // 初始化
  initialize: function(drag, options) {
    this.drag = this.$(drag);
    this._x = this._y = this.left = this.top = 0;
    this._moveDrag = this.bind(this, this.moveDrag);
    this._stopDrag = this.bind(this, this.stopDrag);

    this.setOptions(options);

    this.handle = this.$(this.options.handle);
    this.maxContainer = this.$(this.options.maxContainer);

    this.maxTop =
      Math.max(this.maxContainer.clientHeight, this.maxContainer.scrollHeight) -
      this.drag.offsetHeight;
    this.maxLeft =
      Math.max(this.maxContainer.clientWidth, this.maxContainer.scrollWidth) -
      this.drag.offsetWidth;
    this.limit = this.options.limit;
    this.lockX = this.options.lockX;
    this.lockY = this.options.lockY;
    this.lock = this.options.lock;
    this.onStart = this.options.onStart;
    this.onMove = this.options.onMove;
    this.onStop = this.options.onStop;
    this.handle.style.cursor = "move";
    this.addHandler(this.handle, "mousedown", this.bind(this, this.startDrag));
  },
  startDrag: function(event) {
    var event = event || window.event;
    this._x = event.clientX - this.drag.offsetLeft;
    this._y = event.clientY - this.drag.offsetTop;
    this.addHandler(document, "mousemove", this._moveDrag);
    this.addHandler(document, "mouseup", this._stopDrag);
    event.preventDefault && event.preventDefault();
    this.handle.setCapture && this.handle.setCapture();
    this.onStart();
  },
  moveDrag: function(event) {
    var event = event || window.event;
    var iTop = event.clientY - this._y;
    var iLeft = event.clientX - this._x;
    if (this.lock) return;
    this.limit &&
      (iTop < 0 && (iTop = 0),
      iLeft < 0 && (iLeft = 0),
      iTop > this.maxTop && (iTop = this.maxTop),
      iLeft > this.maxLeft && (iLeft = this.maxLeft));
    this.lockY || (this.drag.style.top = iTop + "px");
    this.lockX || (this.drag.style.left = iLeft + "px");
    event.preventDefault && event.preventDefault();
    this.left = iLeft;
    this.top = iTop;
    this.onMove();
  },
  stopDrag: function() {
    this.removeHandler(document, "mousemove", this._moveDrag);
    this.removeHandler(document, "mouseup", this._stopDrag);
    this.handle.releaseCapture && this.handle.releaseCapture();
    this.onStop({
      left: this.left,
      top: this.top
    });
  },

  // 获取id
  $: function(id) {
    return typeof id === "string" ? document.getElementById(id) : id;
  },
  // 添加绑定事件
  addHandler: function(oElement, sEventType, fnHandler) {
    return oElement.addEventListener
      ? oElement.addEventListener(sEventType, fnHandler, false)
      : oElement.attachEvent("on" + sEventType, fnHandler);
  },
  // 删除绑定事件
  removeHandler: function(oElement, sEventType, fnHandler) {
    return oElement.removeEventListener
      ? oElement.removeEventListener(sEventType, fnHandler, false)
      : oElement.detachEvent("on" + sEventType, fnHandler);
  },
  // 绑定事件到对象
  bind: function(object, fnHandler) {
    return function() {
      return fnHandler.apply(object, arguments);
    };
  }
};
