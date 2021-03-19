(function($) {
  console.log("this is browse.js");
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
      let links = $(
        "table#torrenttable:last a[href*='download.php']"
      ).toArray();
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (links.length == 0) {
        // "获取下载链接失败，未能正确定位到链接";
        return this.t("getDownloadURLsFailed");
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
        $("table#browse:last").find(
          "td:contains('MB'),td:contains('GB'),td:contains('TB')"
        )
      );
    }

    /**
     * 获取有效的拖放地址
     * @param {*} url
     */
    getDroperURL(url) {
      if (url.indexOf("down.php") === -1) {
        return "";
      }

      return url;
    }
  }
  new App().init();
})(jQuery);
