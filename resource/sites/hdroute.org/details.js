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
      let query = $("button.buttonDownload");
      let url = "";
      if (query.length > 0) {
        let id = location.href.getQueryString("id");
        if (id) {
          url = PTService.site.url + "download.php?id=" + id;
        }
      }

      return url;
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      return $(".details-title-section > p:first")
        .text()
        .trim();
    }
  }
  new App().init();
})(jQuery, window);
