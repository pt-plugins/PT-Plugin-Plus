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
        "a.brolin[href*='details.php?id='][href*='hit=1']:has(b)"
      ).toArray();
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (links.length == 0) {
        //  "获取下载链接失败，未能正确定位到链接";
        return this.t("getDownloadURLsFailed");
      }

      let urls = $.map(links, item => {
        let url =
          "download.php?id=" +
          $(item)
            .attr("href")
            .getQueryString("id");
        if (url) {
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
        $("table[border='1']:last").find(
          "td:contains('MB'),td:contains('GB'),td:contains('TB')"
        )
      );
    }

    /**
     * 获取有效的拖放地址
     * @param {*} url
     */
    getDroperURL(url) {
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (!url.getQueryString) {
        PTService.showNotice({
          msg:
            "系统依赖函数（getQueryString）未正确加载，请尝试刷新页面或重新启用插件。"
        });
        return null;
      }

      let id = url.getQueryString("id");
      if (id) {
        url = siteURL + "download.php?id=" + id;
      } else {
        url = "";
      }

      return url;
    }
  }
  new App().init();
})(jQuery);
