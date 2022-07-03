/**
 * 对数字进行四舍五入操作
 * @param {number} precision 
 */
Number.prototype.toRound = function (precision) {
  if (isNaN(precision) || precision == null || precision < 0) {
    precision = 0;
  }

  if (window.accounting) {
    return parseFloat(accounting.toFixed(this, precision));
  } else {
    return parseFloat(parseFloat(Math.round(this * Math.pow(10, precision)) / Math.pow(10, precision)).toFixed(precision));
  }
};
// 百分比
Number.prototype.toPercent = function (divisor, fix) {
  if (Math.abs(this) > 0) {
    if (fix == undefined) {
      fix = 2;
    }

    return ((100 - parseFloat((parseFloat(divisor) - parseFloat(this)) / parseFloat(divisor) * 100 + 0.005)).toRound(fix)) + '%';
  } else {
    return "0";
  }
};

/**
 * 相册
 * @author 栽培者
 * @version 0.1.0
 */
const _imageCache = [];
window.album = function (options) {
  return ({
    options: {
      // 初始图片列表，每个对象需要有以下属性
      // url：图片原始地址
      // thumb：缩略图地址
      // title：显示标题
      // key：关键字
      images: [],
      url: "",
      fileIds: "",
      active: "",
      resizeRate: 5,
      listHeight: 160,
      // 保持缩略图栏
      keepThumbBar: false,
      maxSize: 100,
      minSize: 5,
      allowContextmenu: false,
      allowDownload: true,
      // 是否显示属性栏
      showPropColumn: false,
      // 是否显示顶部工具栏
      showTopBar: true,
      // 是否显示标签信息栏
      showLabelBar: true,
      clickImageToClose: true,
      // 用户自定义按钮
      buttons: [],
      tags: [],
      defaultTag: "全部",
      activeTag: null,
      onButtonClick() {},
      theme: "",
      onClose() {},
    },
    // 当前活动对象
    activeItem: null,
    // 当前用于显示相册的“窗口”
    window: null,
    systemButtons: {
      left: null,
      right: null
    },
    allowClose: true,
    shower: null,
    listBar: null,
    thumbImagesBar: null,
    activeImage: null,
    loadingBar: null,
    images: [],
    imageItems: {},
    listBarOffset: 0,
    listBarWidth: 0,
    loadedImageWidth: 0,
    tags: {},
    topBarTimer: null,
    overTopBar: false,
    theme: "",
    IE: ("v" == "\v"),
    init() {
      console.log('this\'s album.js');
      this.options = $.extend(this.options, options);
      if (!this.options.parent) {
        this.options.parent = $(document.body);
      } else {
        this.allowClose = false;
      }
      if (this.options.theme) {
        this.theme = `-${this.options.theme}`;
      }
      this.parent = this.options.parent;
      // 主框架
      this.window = $("<div class='album' tabindex='-1'/>").appendTo(this.parent).focus();
      // 背景
      this.background = $(`<div class='background${this.theme}'/>`).appendTo(this.window);
      // 显示大图片区域
      this.shower = $("<div class='shower'/>").appendTo(this.window);
      // 控制图片功能区域
      this.controlBar = $("<div class='controlbar'/>").appendTo(this.window);
      // 缩略图显示区域
      this.listBar = $(`<div class='listbar${this.theme}'/>`).css({
        height: this.options.listHeight
      }).appendTo(this.controlBar);
      // 缩略图列表
      this.thumbImagesBar = $("<div class='thumbimages'/>").appendTo(this.listBar);
      // 标签列表
      this.labelBar = $("<div class='labelbar'/>").appendTo(this.controlBar);
      // 标签显示容器
      // this.label = $("<span class='label'/>").appendTo(this.labelBar);
      this.label = $("<a class='label' target='_blank'/>").appendTo(this.labelBar);
      // 数量显示容器
      this.countBar = $("<span class='status-count'/>").appendTo(this.labelBar);
      // 当前缩放尺寸显示容器
      this.zoomBar = $("<span class='zoomBar'/>").html("100%").appendTo(this.labelBar);
      this.systemButtons.zoomIn = $("<i class='button-zoom-in' title='放大'/>").appendTo(this.labelBar);
      this.systemButtons.zoomOut = $("<i class='button-zoom-out' title='缩小'/>").appendTo(this.labelBar);
      if (!this.options.showLabelBar) {
        this.labelBar.hide();
        this.listBar.css({
          bottom: 0
        });
      }

      // 正在加载显示容器
      this.loadingBar = $("<div class='loading'/>").hide().appendTo(this.window);
      $("<img/>").attr({
        src: "loading.gif"
      }).appendTo(this.loadingBar);

      // 系统按钮
      this.systemButtons.left = $("<div class='button-left' title='← 上一张'/>").appendTo(this.window).hide();
      this.systemButtons.right = $("<div class='button-right' title='下一张 →'/>").appendTo(this.window).hide();

      // 标签
      this.tagsBar = $("<div class='album-tags'/>").hide().appendTo(this.window);
      // .css({
      // 	bottom: this.options.listHeight+this.labelBar.height()
      // })

      this.createTag(this.options.defaultTag, true);


      this.listBarOffset = this.parent.width() / 2;
      this.listBarWidth = this.listBar.width();
      this.initSystemButtons();
      this.initCustomButtons();
      this.initEvents();

      if (this.options.tags.length > 0) {
        for (let i = 0; i < this.options.tags.length; i++) {
          this.createTag(this.options.tags[i]);
        };
      }

      if (this.options.images.length > 0) {
        this.initImageList(this.options.images, this.options.active);
      } else if (this.options.url) {
        this.load(this.options.url);
      }

      if (this.options.activeTag) {
        if (this.tags[this.options.activeTag]) {
          this.tags[this.options.activeTag].dom.click();
        }
      }

      return this;
    },
    /**
     * 初始化系统按钮
     * @return {[type]} [description]
     */
    initSystemButtons() {
      if (this.options.showTopBar == false) return;
      // 顶部工具栏
      this.topBar = $("<div class='topbar'/>").appendTo(this.window).hide();
      // $("<i class='spliter'/>").appendTo(this.topBar);
      this.systemButtons.close = $("<a class='item close' title='关闭(ESC)'/>").appendTo(this.topBar);
    },
    /**
     * [initCustomButtons 初始化自定按钮区]
     * @return {[type]} [description]
     */
    initCustomButtons() {
      if (this.options.buttons.length == 0) return;

      // 用户自定义按钮区
      this.customButtonBar = $("<div class='custom-botton-bar'/>").appendTo(this.window);
      const _self = this;
      engine.create("toolbar", {
        parent: this.customButtonBar,
        items: this.options.buttons,
        buttonType: 1,
        onitemclick(item) {
          _self.options.onButtonClick(item, _self.activeItem);
        }
      });
      this.customButtonBar.removeClass("toolbar-container");
      this.customButtonBar.find("table").css("display", "inline-block");

      this.customButtonBar.css({
        top: this.listBar.offset().top - 30
      });
    },
    /**
     * 删除当前对象
     * @return {null}
     */
    remove() {
      if (!this.allowClose) return;
      clearTimeout(this.topBarTimer);
      this.window.empty().remove();
      this.options.onClose && this.options.onClose();
    },
    /**
     * [behind 将当前框架置后]
     * @return {[type]} [description]
     */
    behind(zIndex) {
      this.isBehind = true;
      if (!zIndex) {
        zIndex = 0;
      }

      this.zIndex = this.window.css("zIndex");
      this.window.css("zIndex", zIndex);
    },
    /**
     * 置前
     * @return {[type]} [description]
     */
    bringToFront() {
      if (!this.isBehind) return;

      this.isBehind = false;
      this.window.css("zIndex", this.zIndex);
    },
    /**
     * 初始化事件
     * @return {self} 
     */
    initEvents(self = this) {
      // 鼠标滚轮放大缩小
      // DOMMouseScroll 为 FF
      this.shower.on("mousewheel DOMMouseScroll", event => {
        // $.log("mousewheel", event);
        const v = (event.type == "mousewheel" ? event.originalEvent.wheelDelta : event.originalEvent.detail);
        if (v < 0) {
          self.resize(-self.options.resizeRate);
        } else {
          self.resize(self.options.resizeRate);
        }
        event.preventDefault();
        event.stopPropagation();
      });

      // 键盘事件捕捉
      this.window.on("keydown", event => {
        // $.log("keydown", event);
        // event.preventDefault();
        switch (event.keyCode) {
          // 向左
          case 37:
            // Page up
          case 33:
            self.gotoImage("prev");
            event.preventDefault();
            event.stopPropagation();
            break;

            // 向右
          case 39:
            // Page down
          case 34:
            self.gotoImage("next");
            event.preventDefault();
            event.stopPropagation();
            break;

            // 向上
          case 38:
            self.showThumbsBar();
            event.preventDefault();
            event.stopPropagation();
            break;

            // 向下
          case 40:
            self.hideThumbsBar();
            event.preventDefault();
            event.stopPropagation();
            break;

            // ESC
          case 27:
            self.remove();
            event.preventDefault();
            event.stopPropagation();
            break;

            // Enter
          case 13:
            if (self.activeItem && self.activeItem.link) {
              self.label.click();
            }
            // event.preventDefault();
            event.stopPropagation();
            break;
        }
      }).on("mousemove", () => {
        self.showTopBar();
      });

      if (!this.options.keepThumbBar) {
        // 鼠标离开和进入图片列表时
        this.controlBar.on("mouseleave", () => {
          if(self.hideThumbsBarTimer)
            clearTimeout(self.hideThumbsBarTimer);
          // 隐藏图片列表
          self.hideThumbsBarTimer = setTimeout(() => {
            self.hideThumbsBar();
          }, 500);
        }).on("mouseenter", () => {
          if(self.hideThumbsBarTimer)
            clearTimeout(self.hideThumbsBarTimer);
          self.showThumbsBar();
          // 鼠标滚轮上一张、下一张
        }).on("mousewheel DOMMouseScroll", event => {
          // $.log("mousewheel", event);
          const v = (event.type == "mousewheel" ? event.originalEvent.wheelDelta : event.originalEvent.detail);
          if (v < 0) {
            self.gotoImage("next");
          } else {
            self.gotoImage("prev");
          }

          event.preventDefault();
          event.stopPropagation();
        });

        // 隐藏图片列表
        self.hideThumbsBarTimer = setTimeout(() => {
          self.hideThumbsBar();
        }, 1000);

      } else {
        // 鼠标离开和进入图片列表时
        this.controlBar.on("mouseenter", () => {
          self.showThumbsBar();
          // 鼠标滚轮上一张、下一张
        }).on("mousewheel DOMMouseScroll", event => {
          // $.log("mousewheel", event);
          const v = (event.type == "mousewheel" ? event.originalEvent.wheelDelta : event.originalEvent.detail);
          if (v < 0) {
            self.gotoImage("next");
          } else {
            self.gotoImage("prev");
          }

          event.preventDefault();
          event.stopPropagation();
        });
      }

      // 上一张
      this.systemButtons.left.click(() => {
        self.gotoImage("prev");
      }).on("mouseleave", function () {
        $(this).animate({
          opacity: .5
        });
      }).on("mouseenter", function () {
        $(this).animate({
          opacity: 1
        });
      });

      // 下一张
      this.systemButtons.right.click(() => {
        self.gotoImage("next");
      }).on("mouseleave", function () {
        $(this).animate({
          opacity: .5
        });
      }).on("mouseenter", function () {
        $(this).animate({
          opacity: 1
        });
      });

      // 标签栏
      this.tagsBar.on("mouseleave", function () {
        $(this).animate({
          opacity: .5
        });
      }).on("mouseenter", function () {
        $(this).animate({
          opacity: 1
        });
      }).animate({
        opacity: .5
      });

      // 放大
      this.systemButtons.zoomIn.click(() => {
        self.resize(self.options.resizeRate);
      });

      // 缩小
      this.systemButtons.zoomOut.click(() => {
        self.resize(-self.options.resizeRate);
      });

      if (this.options.showTopBar) {
        // 关闭事件
        this.systemButtons.close.click(() => {
          self.remove();
        });

        this.topBar.on("mouseenter mousemove", function () {
          self.overTopBar = true;
          $(this).addClass("over");
        }).on("mouseleave", function () {
          self.overTopBar = false;
          $(this).removeClass("over");
        });
      }
      return this;
    },
    /**
     * 显示顶部菜单栏
     * @param  {[type]} self [description]
     * @return {[type]}      [description]
     */
    showTopBar(self) {
      if (this.options.showTopBar == false) {
        return;
      }
      self = self || this;
      clearTimeout(this.topBarTimer);
      this.topBarTimer = null;
      this.topBar.fadeIn();
      this.topBarTimer = setTimeout(() => {
        if (!self.overTopBar)
          self.topBar.fadeOut();
      }, 2000);
    },
    hideThumbsBar() {
      const _self = this;
      this.listBar.stop().animate({
        height: 30,
        opacity: .2
      }, () => {
        if (!_self.customButtonBar) return;
        _self.customButtonBar.css({
          top: _self.listBar.offset().top - 30
        });
      });

    },
    showThumbsBar() {
      const _self = this;
      this.listBar.stop().animate({
        height: this.options.listHeight,
        opacity: .8
      }, () => {
        if (!_self.customButtonBar) return;
        _self.customButtonBar.css({
          top: _self.listBar.offset().top - 30
        });
      });
    },
    /**
     * 加载指定的地址
     * @param {string|object} 当指定为一个字符串时，表示链接地址
     * @return {self}
     */
    load() {
      const self = this;
      let options = {
        url: "",
        type: "POST",
        data: null,
        active: ""
      };

      if (arguments.length == 2) {
        options.url = arguments[0];
        options.data = arguments[1];
      } else if (arguments.length == 1) {
        if (typeof (arguments[0]) == "string") {
          options.url = arguments[0];
        } else {
          options = $.extend(options, arguments[0]);
        }
      }

      $.ajax({
        url: options.url,
        type: options.type,
        data: options.data,
        success(data) {
          const result = data.result;
          if (!result) {
            alert("错误");
            return;
          }

          if (result.length == 0) {
            // alert("暂无资料");
            return false;
          }
          self.initImageList(result, options.active);
        }
      });
      return this;
    },
    /**
     * 添加明细列表
     * @param {[type]} item [description]
     */
    addItem(options, isTagClick) {
      const self = this;
      let item = {
        rate: 100,
        index: this.images.length,
        albumObject: this,
        tags: "",
        fileId: ""
      };
      if (typeof (options) == "string") {
        item.url = options;
      } else {
        delete options.index;
        options.isloaded = false;
        item = $.extend(item, options);
      }

      if (!item.key)
        item.key = item.url;

      if (!item.thumb) {
        item.thumb = item.url;
      }

      if (!isTagClick) {
        this.tags[this.options.defaultTag].items.push(item);
        this.tags[this.options.defaultTag].dom.html(`${this.options.defaultTag} (${this.tags[this.options.defaultTag].items.length})`);

        // 是否有标签
        if (item.tags) {
          this.tagsBar.show();
          this.addTag(item);
        }
      }

      this.loadImage(item.thumb, img => {
        self.loadedImageWidth += img.width + 10;
        if (self.loadedImageWidth >= self.listBarWidth) {
          self.listBarWidth += img.width + 10;
          self.listBar.width(self.listBarWidth);
        }
      });

      item.image = $("<img class='album-item'/>").attr({
        src: item.thumb,
        key: item.key,
        title: item.title,
        tags: (Array.isArray(item.tags) ? item.tags.join(",") : item.tags)
      }).css({
        "max-height": (this.options.listHeight - 10)
      }).click(function () {
        self.setActive(this.getAttribute("key"));
      }).appendTo(this.thumbImagesBar);

      this.images.push(item);
      this.imageItems[item.key] = item;
    },
    /**
     * [addTag 添加标签]
     * @param {[type]} item [description]
     */
    addTag(item) {
      let texts = [];
      if (typeof (item.tags) == "string") {
        texts.push(item.tags);
      } else if (Array.isArray(item.tags)) {
        texts = item.tags;
      } else {
        return;
      }

      for (const text of texts) {
        let tag = this.tags[text];
        if (!tag) {
          tag = this.createTag(text);
        }

        tag.items.push(item);
        tag.dom.html(`${text} (${tag.items.length})`);
      }
    },
    // 
    createTag(tag, setActive) {
      const _self = this;
      const result = {
        name: tag,
        items: [],
        dom: $("<a class='album-tag'/>").attr({
          href: "javascript:void(0);",
          tag
        }).html(tag).click(function () {
          if (_self.lastActiveTag) {
            _self.lastActiveTag.removeClass("album-active");
          }
          const tag = this.getAttribute("tag");
          $(this).addClass("album-active");
          _self.initImageList(_self.tags[tag].items, null, true);
          // if (tag=="全部")
          // {
          // 	_self.thumbImagesBar.find(".album-item").show();
          // }
          // else
          // {
          // 	_self.thumbImagesBar.find(".album-item").hide();
          // 	_self.thumbImagesBar.find(".album-item[tags*='"+this.getAttribute("tag")+"']").show();
          // }

          _self.lastActiveTag = $(this);

        }).appendTo(this.tagsBar)
      };

      if (setActive) {
        result.dom.addClass("album-active");
        this.lastActiveTag = result.dom;
      }

      this.tags[tag] = result;
      return result;
    },
    /**
     * 初始化小图片列表
     * @param {string} active 当前活动的键值
     * @return {self} 
     */
    initImageList(images, active, isTags) {
      this.thumbImagesBar.empty();
      images = images || this.images;
      this.images = [];
      this.imageItems = {};
      this.activeItem = null;
      if (images.length == 0) return;

      for (let i = 0; i < images.length; i++) {
        this.addItem(images[i], isTags);
      };

      if (active) {
        this.setActive(active, true);
      } else {
        this.setActive(this.images[0].key, true);
      }

      if (images.length == 1) {
        this.listBar.hide();
      }

      return this;
    },
    /**
     * 清除图片列表
     */
    clear() {
      this.thumbImagesBar.empty();
      this.images = [];
      this.imageItems = {};
      this.activeItem = null;
      this.activeImage.hide();
    },
    /**
     * 设置当前活动对象
     * @param {[type]} key [description]
     */
    setActive(key, resize) {
      this.bringToFront();
      const item = this.imageItems[key];
      if (!item) return;

      const self = this;
      if (this.activeItem) {
        if (this.activeItem.key == key)
          return;

        this.activeItem.rate = 100;
        this.activeItem.image.removeClass("active");
      }

      if (!this.activeImage) {
        this.activeImage = $("<img class='activeImage'/>").css({
          width: 100,
          position: "absolute"
          // }).draggable({
          //   cursor: "move"
        }).appendTo(this.shower);

        if (this.options.clickImageToClose) {
          this.activeImage.click(() => {
            self.remove();
          });
        }

        if (!this.options.allowContextmenu) {
          this.activeImage.on("contextmenu", event => {
            event.preventDefault();
            event.stopPropagation();
          });
        }
      }

      item.image.addClass("active");
      this.label.html(item.title);
      if (item.link) {
        this.label.attr("href", item.link);
      } else {
        this.label.removeAttr("href");
      }
      this.countBar.html(`${item.index+1}/${this.images.length}`);
      this.activeItem = item;

      // 设置缩略图列表位置
      const left = this.listBarOffset - item.image.position().left - item.image.width() / 2;

      // $.log(this.listBarOffset, item.image.position());
      this.thumbImagesBar.css({
        left
      });

      if (!item.isloaded && item.url != item.thumb) {
        this.loadingBar.show();
        this.activeImage.hide();

        // 预加载图片
        this.loadImage(item.url, img => {
          self.loadingBar.fadeOut();
          self.activeItem.isloaded = true;
          self.activeItem.width = img.width;
          self.activeItem.height = img.height;
          self.setActiveImage(resize);
        });
        // var img = new Image();
        // // 预加载图片
        // img.src = item.url;
        // img.onload = function() {

        // };
      } else if (item.url == item.thumb) {
        const _img = new Image();
        _img.onload = function () {
          self.loadingBar.fadeOut();
          self.activeItem.isloaded = true;
          self.activeItem.width = this.width;
          self.activeItem.height = this.height;
          self.setActiveImage(resize);
        };
        _img.src = item.url;

        // delete _img;
      } else {
        this.setActiveImage(resize);
      }

    },
    /**
     * 设置当前活动的图像
     * @param {[type]} resize [description]
     */
    _setActiveImage(resize) {
      const item = this.activeItem;

      this.activeImage.hide().attr({
        src: item.url,
        fileId: item.fileId
      });

      // if (!resize) 
      // {
      // 	this.activeImage.show();
      // 	return;
      // }

      const parentSize = {
        width: this.window.width(),
        height: this.window.height()
      };

      if (this.options.keepThumbBar) {
        parentSize.height -= this.options.listHeight;
      }

      const rateWidth = parseInt(parentSize.width.toPercent(item.width));
      const rateHeight = parseInt(parentSize.height.toPercent(item.height));
      let rate = Math.min(rateWidth, rateHeight);

      // $.log(rateWidth, rateHeight, item.width, item.height, parentSize.width, parentSize.height);

      if (rate > this.options.maxSize) {
        rate = this.options.maxSize;
      }

      this.activeItem.rate = rate;
      this.setSize();

      this.systemButtons.left.show();
      this.systemButtons.right.show();

      if (this.images.length > 1) {
        if (item.index == 0) {
          this.systemButtons.left.hide();
        } else if (item.index == this.images.length - 1) {
          this.systemButtons.right.hide();
        }
      } else {
        this.systemButtons.left.hide();
        this.systemButtons.right.hide();
      }
    },
    setActiveImage(resize, _self = this) {
      if (this.setActiveImageTimer) {
        clearTimeout(this.setActiveImageTimer);
      }
      this.setActiveImageTimer = setTimeout(() => {
        _self._setActiveImage(resize);
      }, 260);
    },
    /**
     * 重设当前图片大小
     * @param  {integer} rate 倍数，正数为放大，负数为缩小
     * @return {[type]}      [description]
     */
    resize(rate) {
      const min = this.options.minSize;
      const max = this.options.maxSize;

      if (!this.activeItem.rate) {
        this.activeItem.rate = 100;
      }
      this.activeItem.rate += rate;

      if (this.activeItem.rate < min) {
        this.activeItem.rate = min;
      } else if (this.activeItem.rate > max) {
        this.activeItem.rate = max;
      }

      if (this.timer) {
        clearTimeout(this.timer);
      }
      const self = this;
      this.timer = setTimeout(() => {
        self.setSize();
      }, 50);
    },
    setSize() {
      const width = this.activeItem.width * (this.activeItem.rate / 100);
      const height = this.activeItem.height * (this.activeItem.rate / 100);
      const left = this.listBarOffset - width / 2;

      // if (width<this.window.width())
      // {
      // 	left = this.listBarOffset - width/2;
      // }

      this.activeImage.animate({
        width,
        top: 0,
        left,
        marginLeft: 0,
        marginTop: 0
      }, 50).show();

      this.zoomBar.html(`${this.activeItem.rate}%`);
    },
    /**
     * 跳转至指定的图片
     * @param  {[type]} action [description]
     * @return {[type]}        [description]
     */
    gotoImage(action, _self) {
      if (typeof (action) == "number") {
        var item = this.image[action];
        if (item) {
          this.setActive(item.key);
        }
        return;
      }
      let index = this.activeItem.index;
      switch (action) {
        case "next":
          index++;
          break;

        case "prev":
          index--;
          break;
      }
      if (index < 0) {
        index = this.images.length - 1;
      } else if (index >= this.images.length) {
        index = 0;
      }

      var item = this.images[index];
      if (item) {
        this.setActive(item.key);
      }
    },
    /**
     * 加载图片
     * @param  {[type]}   url      [description]
     * @param  {Function} callback [description]
     * @param  {[type]}   reload   [description]
     * @return {[type]}            [description]
     */
    loadImage(url, callback, reload) {
      const cache = _imageCache[url];
      if (cache && !reload && cache.width > 0) {
        if (callback) {
          callback(cache);
        }
        return cache;
      } else {
        var _img = new Image();
        // _img.src = url + "?__t__" + Math.random();
        _img.src = url;
        if (callback) {
          _img.onload = function () {
            callback(this);
          }
        }
      }
      _imageCache[url] = _img;
      return _img;
    }
  }).init();
};
