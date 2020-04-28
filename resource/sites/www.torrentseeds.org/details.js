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
      let siteURL = PTService.site.url;
      let url = $("td.details-text-ellipsis:eq(0) > a").attr("href");
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      return this.getFullURL(siteURL + url);
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      return $("div.pull-left > h1").text();
    }
  }
  new App().init();
})(jQuery, window);
