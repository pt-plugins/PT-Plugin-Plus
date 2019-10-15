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
      if (this.getDownloadURL()) {
        this.initDetailButtons();
      }
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let query = $("a#detailsDownloadButton");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      }

      if (!url) {
        return "";
      }

      return this.getFullURL(url);
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      let title = $("title").text();
      let datas = /\"(.*?)\"/.exec(title);
      if (datas && datas.length > 1) {
        return datas[1] || title;
      }
      return title;
    }
  }
  new App().init();
})(jQuery, window);
