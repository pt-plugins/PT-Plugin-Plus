(function($) {
  console.log("this is torrent.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.options = PTService.options;
      this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化按钮列表
     */
    initButtons() {
      this.initListButtons();
    }

    /**
     * 获取下载链接
     */
    getDownloadURLs() {
      let text = $("textarea:first").val();

      if (!text) {
        return this.t("getDownloadURLsFailed");
      }

      let links = text.split("\n");

      if (links.length == 0) {
        //  "获取下载链接失败，未能正确定位到链接";
        return this.t("getDownloadURLsFailed");
      }

      let urls = [];

      links.forEach(link => {
        if (this.checkURL(link)) {
          urls.push(link);
        }
      });

      if (urls.length == 0) {
        return this.t("getDownloadURLsFailed");
      }

      return urls;
    }

    checkURL(url) {
      const sites = this.options.sites;
      if (!sites) {
        return false;
      }
      const URL = PTService.filters.parseURL(url);
      const index = sites.findIndex(site => {
        return site.host === URL.host;
      });

      return index !== -1;
    }
  }
  new App().init();
})(jQuery);
