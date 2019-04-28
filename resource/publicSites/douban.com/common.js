(function ($, window) {
  class Common {
    init() {
      this.initButtons && this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 按指定的关键字进行搜索
     * @param {*} key 
     * @param {*} button 
     */
    search(key, button) {
      PTService.call(PTService.action.openOptions, `search-torrent/${key}`).catch((error) => {
        console.log(error);
        button && button.html(error.msg || "执行失败");
      });
    }
  };
  window.DoubanCommon = Common;
})(jQuery, window);