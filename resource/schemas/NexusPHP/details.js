(function ($, window) {
  console.log("this is details.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons()
      this.initFreeSpaceButton()
      // 设置当前页面
      PTSevrice.pageApp = this;
    }
    /**
     * 初始化按钮列表
     */
    initButtons() {
      // 添加下载按钮
      PTSevrice.addButton({
        title: `将当前种子下载到[${this.defaultClientOptions.name}]` + (this.defaultPath ? "\n" + this.defaultPath : ""),
        icon: "get_app",
        label: "一键下载",
        /**
         * 单击事件
         * @param success 成功回调事件
         * @param error 失败回调事件
         * 
         * 两个事件必需执行一个，可以传递一个参数
         */
        click: (success, error) => {
          let url = this.getDownloadURL();
          let title = this.getTitle();

          if (url) {
            this.sendTorrentToDefaultClient({
              url,
              title
            }).then(() => {
              success();
            }).catch(() => {
              success();
            });
          }
        }
      });

      // 复制下载链接
      PTSevrice.addButton({
        title: "复制下载链接到剪切板",
        icon: "file_copy",
        label: "复制链接",
        click: (success, error) => {
          console.log(PTSevrice.site, this.defaultPath);
          PTSevrice.call(
            PTSevrice.action.copyTextToClipboard,
            this.getDownloadURL()
          ).then((result) => {
            console.log("命令执行完成", result);
            success();
          }).catch(() => {
            error()
          });
        }
      });
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      if (PTSevrice.site.passkey) {
        let id = location.href.getQueryString("id");
        if (id) {
          // 如果站点没有配置禁用https，则默认添加https链接
          return location.origin + "/download.php?id=" + id + "&passkey=" + PTSevrice.site.passkey + (PTSevrice.site.disableHttps ? "" : "&https=1");
        }
      }
      let query = $("a[href*='passkey'][href*='https']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      } else {
        query = $("a[href*='passkey']");
        if (query.length > 0) {
          url = query.attr("href");
        } else {
          url = $(":contains('passkey'):last").text();
        }
      }

      if (!url) {
        url = $("a[href*='download.php?id=']:first").attr("href");
      }

      if (url && url.substr(0, 1) === "/") {
        url = `${location.origin}${url}`;
      } else if (url && url.substr(0, 4) !== "http") {
        url = `${location.origin}/${url}`;
      }

      if (url.indexOf("https=1") === -1) {
        url += "&https=1"
      }

      return url;
    }

    getTitle() {
      return /\"(.*?)\"/.exec($("title").text())[1];
    }
  };
  (new App()).init();
})(jQuery, window);