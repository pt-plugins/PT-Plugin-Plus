(function($) {
  console.log("this is torrent.js");
  class App extends window.NexusPHPCommon {
    init() {
      // super();
      this.initButtons();
      this.initFreeSpaceButton();
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
      let links = $("table#torrents:first, table#torrentTable:first")
        .find("a[href*='/download.php/']")
        .toArray();
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (links.length == 0) {
        return this.t("getDownloadURLsFailed"); //"获取下载链接失败，未能正确定位到链接";
      }

      let urls = $.map(links, item => {
        let link = $(item).attr("href");
        if (link && link.substr(0, 4) != "http") {
          link = siteURL + link;
        }
        return link;
      });

      return urls;
    }

    /**
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(
        $("table#torrents:first, table#torrentTable:first").find(
          "td:contains('MiB'),td:contains('GiB'),td:contains('TiB')"
        )
      );
    }
  }
  new App().init();
})(jQuery);
