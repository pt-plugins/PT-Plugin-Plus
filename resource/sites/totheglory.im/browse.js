(function ($) {
  console.log("this is browse.js");
  class App extends window.NexusPHPCommon {
      init() {
        this.initButtons();
        this.initFreeSpaceButton();
        // 设置当前页面
        PTSevrice.pageApp = this;
      }

      /**
       * 初始化按钮列表
       */
      initButtons() {
        // 添加下载按钮
        PTSevrice.addButton({
          title: `将当前页面所有种子下载到[${this.defaultClientOptions.name}]`,
          icon: "get_app",
          label: "下载所有",
          click: (success, error) => {
            if (!PTSevrice.site.passkey) {
              error("请先设置站点密钥（Passkey）。");
              return;
            }

            let size = this.checkSize();

            if (size !== true) {
              if (!confirm("当前页面种子容量为 " + size + " 已超过 " + PTSevrice.options.exceedSize + " " + PTSevrice.options.exceedSizeUnit + "，是否发送？")) {
                error("容量超限，已取消");
                return;
              }
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
        PTSevrice.addButton({
          title: "复制下载链接到剪切板",
          icon: "file_copy",
          label: "复制链接",
          click: (success, error) => {
            if (!PTSevrice.site.passkey) {
              error("请先设置站点密钥（Passkey）。");
              return;
            }

            let urls = this.getDownloadURLs();

            console.log("复制链接", urls.join("\n"));
            success();
          }
        })
      }

      downloadURLs(urls, count, callback) {
        let index = count - urls.length;
        let url = urls.shift();
        if (!url) {
          $(this.statusBar).remove();
          this.statusBar = null;
          callback(count + "条链接已发送完成。");
          return;
        }
        this.showStatusMessage("正在发送：" + (url.replace(PTSevrice.site.passkey, "***")) + "(" + (count - index) + "/" + count + ")", 0);
        this.sendTorrentToDefaultClient(url, false).then((result) => {
          this.downloadURLs(urls, count, callback);
        }).catch((result) => {
          this.downloadURLs(urls, count, callback);
        });
      }

      showStatusMessage(msg) {
        if (!this.statusBar) {
          this.statusBar = PTSevrice.showNotice({
            text: msg,
            type: "info",
            width: 600,
            progressBar: false
          });
        } else {
          $(this.statusBar).find(".noticejs-content").html(msg);
        }
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
        let key = (new Base64).encode("vvv" + id + "|||" + PTSevrice.site.passkey + "|||sslzz");
        return `https://${PTSevrice.site.host}/rssdd.php?par=${key}&ssl=yes`;
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
            case PTSevrice.action.downloadFromDroper:
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
        if (!PTSevrice.site.passkey) {
          PTSevrice.showNotice({
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

      checkSize() {
        if (!PTSevrice.options.needConfirmWhenExceedSize) {
          return true;
        }
        // 获取所有种子的大小信息
        let doms = $("#torrent_table").find("td[align='center']:contains('MB'),td[align='center']:contains('GB'),td[align='center']:contains('TB')");
        let size = this.getSize(doms);

        let exceedSize = 0;
        switch (PTSevrice.options.exceedSizeUnit) {
          // 
          case PTSevrice.sizeUnit.MiB:
            exceedSize = (PTSevrice.options.exceedSize * 1048576);
            break;

          case PTSevrice.sizeUnit.GiB:
            exceedSize = (PTSevrice.options.exceedSize * 1073741824);
            break;

          case "T":
          case PTSevrice.sizeUnit.TiB:
            exceedSize = (PTSevrice.options.exceedSize * 1099511627776);
            break;
        }

        return (size >= exceedSize ? PTSevrice.filters.formatSize(size) : true);
      }

      getSize(source) {
        let total = 0;

        $.each(source, (index, item) => {
          let size = parseFloat($(item).text().replace(/[A-Za-z]/g, ""));
          let unit = $(item).text().replace(/[^A-Za-z]/g, "");
          switch (unit) {
            case "MB":
              total += (size * 1048576);
              break;

            case "GB":
              total += (size * 1073741824);
              break;

            case "T":
            case "TB":
              total += (size * 1099511627776);
              break;
          }
        });

        return (total);
      }
    }
    (new App()).init();
})(jQuery);