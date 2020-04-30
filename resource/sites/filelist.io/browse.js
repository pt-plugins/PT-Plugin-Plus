(function ($) {
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
        this.initListButtons(false);
      }

      /**
       * 获取下载链接
       */
      getDownloadURLs() {
        let siteURL = PTService.site.url;
        if (siteURL.substr(-1) != "/") {
          siteURL += "/";
        }

        let links = $("a[href*='download'][onclick!='return show_confirm();']").toArray();
        let urls = $.map(links, (item) => {
          let link = $(item).attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${siteURL}${link}`+(PTService.site.passkey ? "&passkey=" + PTService.site.passkey : "");
          }
          return link;
        });

        if (links.length == 0) {
          return "获取下载链接失败，未能正确定位到链接";
        }

        return urls;
      }

      getDownloadURL(id) {
        return `https://${PTService.site.host}/download.php?id=${id}`+(PTService.site.passkey ? "&passkey=" + PTService.site.passkey : "");
      }

      /**
       * 执行指定的操作
       * @param {*} action 需要执行的执令
       * @param {*} data 附加数据
       * @return Promise
       */
      call(action, data) {
        return new Promise((resolve, reject) => {
          switch (action) {
            // 从当前的DOM中获取下载链接地址
            case PTService.action.downloadFromDroper:
              this.downloadFromDroper(data, () => {
                resolve()
              });
              break;
          }
        });
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

        let id = data.url.getQueryString("id");
        let result = this.getDownloadURL(id);

        if (!result) {
          callback();
          return;
        }

        this.sendTorrentToDefaultClient(result).then((result) => {
          callback(result);
        }).catch((result) => {
          callback(result);
        });
      }

      /**
       * 确认大小是否超限
       */
      confirmWhenExceedSize() {
        return this.confirmSize($("div.visitedlinks").find("div[class='torrenttable']:contains('MB'),div[class='torrenttable']:contains('GB'),div[class='torrenttable']:contains('TB')"));
      }
    }
    (new App()).init();
})(jQuery);
