(function ($, window) {
  console.log("this is details.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.showTorrentSize()
      this.initButtons()
      this.initFreeSpaceButton()
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
        title: "复制下载链接到剪切板",
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
      let query = $("a[href*='/dl/']:not([class])");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
        // 直接获取的链接下载成功率很低
        // 如果设置了 passkey 则使用 rss 订阅的方式下载
        if (PTSevrice.site.passkey) {
          let values = url.split("/");
          let id = values[values.length - 2];

          // 格式：vvvid|||passkey|||sslzz
          let key = (new Base64).encode("vvv" + id + "|||" + PTSevrice.site.passkey + "|||sslzz");
          url = `https://${PTSevrice.site.host}/rssdd.php?par=${key}&ssl=yes`;
        }
      }

      return url;
    }

    showTorrentSize() {
      let query = $("td[valign='top'][align='left']:contains('字节')");
      let size = "";
      if (query.length > 0) {
        size = query.text().split(" (")[0];
        // attachment
        PTSevrice.addButton({
          title: "当前种子大小",
          icon: "attachment",
          label: size
        });
      }
    }

    getTitle() {
      return /\"(.*?)\"/.exec($("title").text())[1];
    }
  };
  (new App()).init();
})(jQuery, window);