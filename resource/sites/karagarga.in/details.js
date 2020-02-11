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
      let query = $("a[href*='down.php']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      }

      if (!url) {
        return "";
      }

      return `${location.origin}/${url}`;
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      return $("table.main h1:first aa[href*='browse.php?dirsearch='] +")
        .text()
        .match(/-(.*)\(/)
        .trim();
    }
  }
  new App().init();
})(jQuery, window);
