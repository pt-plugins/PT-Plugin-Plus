(function($, window) {
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
      let query = $("div.download a[href*='/torrents/download/']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      }

      if (!url) {
        return "";
      }

      return `${location.origin}${url}`;
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      let title = $("header.panel-heading h2").text().trim();
      return title;
    }
  }
  new App().init();
})(jQuery, window);
