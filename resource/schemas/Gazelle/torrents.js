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
        // 添加下载按钮
        this.defaultClientOptions && PTService.addButton({
          title: `将当前页面所有种子下载到[${this.defaultClientOptions.name}]`,
          icon: "get_app",
          label: "下载所有",
          click: (success, error) => {
            if (!this.confirmSize($("#torrent_table").find("td:contains('MB'),td:contains('GB'),td:contains('TB')"))) {
              error("容量超限，已取消");
              return;
            }

            let urls = this.getDownloadURLs();

            this.downloadURLs(urls, urls.length, (msg) => {
              success({
                msg
              });
            });

          }
        });

        // 复制下载链接
        PTService.addButton({
          title: "复制下载链接到剪切板",
          icon: "file_copy",
          label: "复制链接",
          click: (success, error) => {
            let urls = this.getDownloadURLs();

            PTService.call(
              PTService.action.copyTextToClipboard,
              urls.join("\n")
            ).then((result) => {
              console.log("命令执行完成", result);
              success();
            }).catch(() => {
              error()
            });
          }
        })
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