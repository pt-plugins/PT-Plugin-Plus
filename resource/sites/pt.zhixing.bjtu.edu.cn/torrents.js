(function($) {
  console.log("this is torrent.js");
  class App extends window.NexusPHPCommon {
    init() {
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
      let links = $("a[href^='/torrents/']").toArray();
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (links.length == 0) {
        return this.t("getDownloadURLsFailed"); //"获取下载链接失败，未能正确定位到链接";
      }

      let urls = $.map(links, item => {
        let url =
          $(item).attr("href")+"download/" ;
        if (url) {
          if (url.substr(0, 1) === "/") {
            url = url.substr(1);
          }
          url = siteURL + url;

        }
        return url;
      });

      return urls;
    }

    /**
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(
        $(".torrents").find(
          "td:contains('MB'),td:contains('GB'),td:contains('TB')"
        )
      );
    }
  }
  new App().init();
})(jQuery);
