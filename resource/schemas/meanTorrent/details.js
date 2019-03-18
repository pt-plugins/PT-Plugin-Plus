(function ($, window) {
  console.log("this is details.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }
    /**
     * 初始化按钮列表
     */
    initButtons() {
      this.initDetailButtons();
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let query = $("button[mt-copy-to-clipboard]");
      let url = "";

      if (query.length > 0) {
        url = query.attr("mt-copy-to-clipboard");
      } else {
        query = location.pathname.match(/torrents\/([a-z0-9]{24})/);
        if (query && query.length > 1) {
          url = location.href.replace("torrents", "api/torrents/download");
        }
      }

      return url;
    }
  };
  (new App()).init();
})(jQuery, window);