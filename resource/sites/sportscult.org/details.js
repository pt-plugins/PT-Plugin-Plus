(function ($, window) {
   if(/\?page\=torrent-details/.test(window.location.search)){
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
    console.log("this is torrents.js");
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
        let links = $("#bodyarea > table > tbody > tr > td:nth-child(2) > div > .block-content > div > div > div table:nth-child(4) > tbody > tr:nth-child(2) > td > table")
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
          $("#bodyarea > table > tbody > tr > td:nth-child(2) > div > .block-content > div > div > div table:nth-child(4) > tbody > tr:nth-child(2) > td > table").find(
            "td:contains('MB'),td:contains('GB'),td:contains('TB'),td:contains('MiB'),td:contains('GiB'),td:contains('TiB')"
          )
        );
      }

  
    /**
     * 下载拖放的种子
     * @param {*} data
     * @param {*} callback
     */
     downloadFromDroper(data, callback) {
      if (typeof data === "string") {
        data = {
          url: data,
          title: ""
        };
      }

      console.log(data);

      if (!data.url) {
        PTService.showNotice({
          msg: this.t("invalidURL") //"无效的链接"
        });
        callback();
        return;
      }

      if (data.url.substr(0, 1) === "/") {
        data.url = `${location.origin}${data.url}`;
      } else if (data.url.substr(0, 4) !== "http") {
        data.url = `${location.origin}/${data.url}`;
      }

      this.sendTorrentToDefaultClient(result)
        .then(result => {
          callback(result);
        })
        .catch(result => {
          callback(result);
        });
    }
    }
    new App().init();
  }
})(jQuery, window);