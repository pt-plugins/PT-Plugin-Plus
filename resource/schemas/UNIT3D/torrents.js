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
            if (!this.confirmSize($("div.table-responsive > table:first").find("td:contains('MiB'),td:contains('GiB'),td:contains('TiB')"))) {
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
        let links = $("a[href*='/download/']").toArray();
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
    }
    (new App()).init();
})(jQuery);