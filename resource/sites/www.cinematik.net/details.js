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
      let query = $("a[href*='download.php?id=']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      }

      if (!url) {
        let id = location.href.getQueryString("id");
        url = `download.php?id=${id}`;
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
      let title = $("title").text();
      return title.replace("Cinematik :: ", "");
    }
  }
  new App().init();
})(jQuery, window);
