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
      let query = $("a[href*='download.php/']:first");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
        if (url.substr(0, 4) != "http") {
          url = PTService.site.url + url;
        }
      }

      return url;
    }
  };
  (new App()).init();
})(jQuery, window);