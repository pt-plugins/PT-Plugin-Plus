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
        // 添加下载按钮
        PTService.addButton({
          title: `将当前页面所有种子下载到[${this.defaultClientOptions.name}]`,
          icon: "get_app",
          label: "下载所有",
          click: (success, error) => {
            if (!PTService.site.passkey) {
              error("请先设置站点密钥（Passkey）。");
              return;
            }

            if (!this.confirmSize($("#torrent_table").find("td[align='center']:contains('MB'),td[align='center']:contains('GB'),td[align='center']:contains('TB')"))) {
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
            if (!PTService.site.passkey) {
              error("请先设置站点密钥（Passkey）。");
              return;
            }

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
        let links = $("a.bookmark").toArray();
        let urls = $.map(links, (item) => {
          let id = $(item).attr("tid");
          return this.getDownloadURL(id);
        });

        return urls;
      }

      getDownloadURL(id) {
        // 格式：vvvid|||passkey|||sslzz
        let key = (new Base64).encode("vvv" + id + "|||" + PTService.site.passkey + "|||sslzz");
        return `https://${PTService.site.host}/rssdd.php?par=${key}&ssl=yes`;
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
        if (!PTService.site.passkey) {
          PTService.showNotice({
            msg: "请先设置站点密钥（Passkey）。"
          });
          callback();
          return;
        }

        if (typeof data === "string") {
          data = {
            url: data,
            title: ""
          };
        }

        let values = data.url.split("/");
        let id = values[values.length - 2];
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
    }
    (new App()).init();
})(jQuery);