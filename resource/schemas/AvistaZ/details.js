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
      let url = PTService.getFieldValue("downloadURL");
      if (!url) {
        let query = $("a.btn[href*='/download/torrent/']");
        if (query.length > 0) {
          url = query.attr("href");
          if (PTService.site.passkey) {
            url = url.replace(
              "/download/torrent/",
              `/rss/download/${PTService.site.passkey}/`
            );
          }
        }
      }

      return this.getFullURL(url);
    }
  }
  new App().init();
})(jQuery, window);
