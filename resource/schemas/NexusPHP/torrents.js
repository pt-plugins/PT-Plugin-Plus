(function ($) {
  console.log("this is torrent.js");
  const app = {
    init() {
      this.initButtons()
    },
    /**
     * 初始化按钮列表
     */
    initButtons() {
      // 添加下载按钮
      PTSevrice.addButton({
        title: "将当前种子下载到默认服务器",
        icon: "get_app",
        label: "一键下载",
        click: () => {
          let url = this.getDownloadURL();

          console.log("一键下载", url);

          if (url) {
            // PTSevrice.call(
            //   PTSevrice.action.sendTorrentToDefaultClient,
            //   (result => {
            //     console.log("命令执行完成", result);
            //   }), {
            //     url
            //   }
            // );
          }
        }
      });

      // 复制下载链接
      PTSevrice.addButton({
        title: "复制下载链接到剪切板",
        icon: "file_copy",
        label: "复制链接",
        click: () => {

        }
      })
    },
    /**
     * 获取下载链接
     */
    getDownloadURL() {
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

      if (url && url.substr(0, 1) === "/") {
        url = `${location.origin}${url}`;
      }

      return url;
    }
  };
  app.init();
})(jQuery);