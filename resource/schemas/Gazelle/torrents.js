(function ($) {
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
        let links = $(("a[title='Download']")).toArray();
        let siteURL = PTService.site.url;
        if (siteURL.substr(-1) != "/") {
          siteURL += "/";
        }

        if (links.length == 0) {
          links = $(("a[href*='torrents.php?action=download']")).toArray();
        }

        if (links.length == 0) {
          return "获取下载链接失败，未能正确定位到链接";
        }

        let urls = $.map(links, (item) => {
          let link = $(item).attr("href");
          if (link && link.substr(0, 4) != 'http') {
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
        return this.confirmSize($("#torrent_table").find("td:contains('MB'),td:contains('GB'),td:contains('TB')"));
      }

      /**
       * 下载拖放的种子
       * @param {*} url 
       * @param {*} callback 
       */
      downloadFromDroper(data, callback) {
        if (typeof data === "string") {
          data = {
            url: data,
            title: ""
          };
        }

        console.log(data)

        if (!data.url) {
          PTService.showNotice({
            msg: "无效的链接"
          });
          callback();
          return;
        }

        let authkey = data.url.getQueryString("authkey");
        let torrent_pass = data.url.getQueryString("torrent_pass");
        // authkey=&torrent_pass
        if (!authkey && !torrent_pass) {
          PTService.showNotice({
            msg: "无效的链接，请拖放下载链接"
          });
          callback();
          return;
        }

        if (data.url.substr(0, 1) === "/") {
          data.url = `${location.origin}${data.url}`;
        } else if (data.url.substr(0, 4) !== "http") {
          data.url = `${location.origin}/${data.url}`;
        }

        this.sendTorrentToDefaultClient(data).then((result) => {
          callback(result);
        }).catch((result) => {
          callback(result);
        });
      }
    }
    (new App()).init();
})(jQuery);