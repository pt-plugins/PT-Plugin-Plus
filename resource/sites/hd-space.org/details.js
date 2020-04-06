(function ($, window) {
  console.log("this is details.js");
   if(/\?page\=torrent-details/.test(window.location.search)){
    console.log("torrent-details");
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
        this.showTorrentSize();
        this.initDetailButtons();
      }

      /**
       * 获取下载链接
       */
      getDownloadURL() {
        let query = $("a[href*='download.php']:first");
        let url = "";
        if (query.length > 0) {
          url = query.attr("href");
          if (url.substr(0, 4) != "http") {
            url = PTService.site.url + url;
          }
        }

        return url;
      }

      showTorrentSize() {
        let size = PTService.filters.formatSize(PTService.getFieldValue("size"));
        PTService.addButton({
         title: "当前种子大小",
          icon: "attachment",
          label: size
        });
      }
      /**
       * 获取当前种子标题
       */
      getTitle() {
        return $("a[href*='download.php']:first").text().trim();
      }
    };
    (new App()).init();
  }else if(/\?page\=torrents|seedwanted/.test(window.location.search)){
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
        let links = $("#bodyarea > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(3) > td > table, #mcol > table > tbody > tr:nth-child(2) > td > table")
          .find("a[href*='download.php']")
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
          $("table.mainblockcontenttt:first").find(
            "td:contains('MiB'),td:contains('GiB'),td:contains('TiB')"
          )
        );
      }
    }
    new App().init();
  }
})(jQuery, window);