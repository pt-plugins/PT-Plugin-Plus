(function ($, window) {
  console.log("this is details.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons()
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

          if (url) {
            this.sendTorrentToDefaultClient(url).then(() => {
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
      let query = $("a.btn[href*='/download/torrent/']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
        if (PTSevrice.site.passkey) {
          url = url.replace('/download/torrent/', `/rss/download/${PTSevrice.site.passkey}/`);
        }
      }

      return url;
    }
  };
  (new App()).init();
})(jQuery, window);