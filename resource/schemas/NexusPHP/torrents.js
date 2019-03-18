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
            if (!this.confirmSize($(".torrents").find("td:contains('MB'),td:contains('GB'),td:contains('TB')"))) {
              error("容量超限，已取消");
              return;
            }

            let urls = this.getDownloadURLs();
            if (!urls.length) {
              error(urls);
              return;
            }

            // if (!PTService.site.passkey) {
            //   if (!confirm("该站点未设置密钥，可能无法正常下载，是否继续？")) {
            //     error("操作已取消");
            //     return;
            //   }
            // }

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

            if (!urls.length) {
              error(urls);
              return;
            }

            // if (!PTService.site.passkey) {
            //   if (!confirm("该站点未设置密钥，请在复制链接后手工添加密钥，是否继续？")) {
            //     error("操作已取消");
            //     return;
            //   }
            // }

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
        let links = $("a[href*='download']").toArray();
        let siteURL = PTService.site.url;
        if (siteURL.substr(-1) != "/") {
          siteURL += "/";
        }

        if (links.length == 0) {
          links = $(".torrentname a[href*='details.php']").toArray();
        }

        if (links.length == 0) {
          return "获取下载链接失败，未能正确定位到链接";
        }

        let urls = $.map(links, (item) => {
          let url = $(item).attr("href").replace(/details\.php/gi, "download.php") + (PTService.site.passkey ? "&passkey=" + PTService.site.passkey : "");
          if (url) {
            if (url.substr(0, 2) === '//') { // 适配HUDBT、WHU这样以相对链接开头
              url = location.protocol + url;
            } else if (url.substr(0, 4) !== "http") {
              url = siteURL + url;
            }

            if (url && url.indexOf("https=1") === -1 && !PTService.site.disableHttps) {
              url += "&https=1"
            }
          }
          return url;
        });

        return urls;
      }
    }
    (new App()).init();
})(jQuery);