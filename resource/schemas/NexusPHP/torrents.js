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
      let links = $("a[href*='download']").toArray();
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (links.length == 0) {
        links = $(".torrentname a[href*='details.php']").toArray();
      }

      if (links.length == 0) {
        //  "获取下载链接失败，未能正确定位到链接";
        return this.t("getDownloadURLsFailed");
      }

      let urls = $.map(links, item => {
        let url = $(item)
          .attr("href")
          .replace(/details\.php/gi, "download.php");
        if (url) {
          if (url.substr(0, 2) === "//") {
            // 适配HUDBT、WHU这样以相对链接开头
            url = location.protocol + url;
          } else if (url.substr(0, 4) !== "http") {
            url = siteURL + url;
          }

          if (url.indexOf("passkey=") === -1 && PTService.site.passkey) {
            url += "&passkey=" + PTService.site.passkey;
          }

          if (
            url &&
            url.indexOf("https=1") === -1 &&
            !PTService.site.disableHttps
          ) {
            url += "&https=1";
          }
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

      if (url.indexOf("download.php") === -1) {
        let id = url.getQueryString("id");
        if (id) {
          // 如果站点没有配置禁用https，则默认添加https链接
          url =
            siteURL +
            "download.php?id=" +
            id +
            (PTService.site.passkey
              ? "&passkey=" + PTService.site.passkey
              : "") +
            (PTService.site.disableHttps ? "" : "&https=1");
        } else {
          url = "";
        }
      }

      return url;
    }
  }
  new App().init();
})(jQuery);
