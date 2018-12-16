(function ($) {
  console.log("this is details.js");
  const app = {
    defaultPath: PTSevrice.getSiteDefaultPath(),
    downloadClientType: PTSevrice.downloadClientType,
    defaultClientOptions: PTSevrice.getClientOptions(),
    init() {
      this.initButtons()
      this.initFreeSpaceButton()
    },
    /**
     * 初始化按钮列表
     */
    initButtons() {
      // 添加下载按钮
      PTSevrice.addButton({
        title: "将当前种子下载到默认服务器" + (this.defaultPath ? "\n" + this.defaultPath : ""),
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

          // setTimeout(() => {
          //   success()
          // }, 1000);

          if (url) {
            PTSevrice.call(
              PTSevrice.action.sendTorrentToDefaultClient, {
                url: url,
                savePath: this.defaultPath,
                autoStart: this.defaultClientOptions.autoStart
              }
            ).then(result => {
              console.log("命令执行完成", result);
              switch (this.defaultClientOptions.type) {
                // Transmisson
                case this.downloadClientType.transmisson:
                  if (result && result.status && result.status === "duplicate") {
                    error(`${result.torrent.name} 已存在`);
                  } else {
                    if (!this.defaultPath) {
                      success({
                        msg: "种子已添加，但站点默认目录未配置，建议配置。"
                      });
                    } else {
                      success()
                    }
                  }
                  break;

                default:
                  success();
                  break;
              }
            }).catch((result) => {
              error(result)
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
          // setTimeout(() => {
          //   error()
          // }, 1000);
        }
      });
    },
    /**
     * 初始化当前默认服务器可用空间
     */
    initFreeSpaceButton() {
      if (!this.defaultPath) {
        return;
      }
      PTSevrice.call(
        PTSevrice.action.getFreeSpace, {
          path: this.defaultPath
        }
      ).then((result) => {
        console.log("命令执行完成", result);
        if (result && result.arguments) {
          // console.log(PTSevrice.filters.formatSize(result.arguments["size-bytes"]));

          PTSevrice.addButton({
            title: "默认服务器剩余空间\n" + this.defaultPath,
            icon: "filter_drama",
            label: PTSevrice.filters.formatSize(result.arguments["size-bytes"])
          })

        }
        // success();
      }).catch(() => {
        // error()
      });
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