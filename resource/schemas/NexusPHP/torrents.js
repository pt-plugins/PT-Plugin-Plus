(function ($) {
  console.log("this is torrent.js");
  class App extends window.NexusPHPCommon {
      init() {
        // super();
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
        this.defaultClientOptions && PTSevrice.addButton({
          title: `将当前页面所有种子下载到[${this.defaultClientOptions.name}]`,
          icon: "get_app",
          label: "下载所有",
          click: (success, error) => {
            let size = this.checkSize();

            if (size !== true) {
              if (!confirm("当前页面种子容量为 " + size + " 已超过 " + PTSevrice.options.exceedSize + " " + PTSevrice.options.exceedSizeUnit + "，是否发送？")) {
                error("容量超限，已取消");
                return;
              }
            }

            let urls = this.getDownloadURLs();
            if (!urls.length) {
              error(urls);
              return;
            }

            if (!PTSevrice.site.passkey) {
              if (!confirm("该站点未设置密钥，可能无法正常下载，是否继续？")) {
                error("操作已取消");
                return;
              }
            }

            this.downloadURLs(urls, urls.length, (msg) => {
              success({
                msg
              });
            });

          }
        });

        // 复制下载链接
        PTSevrice.addButton({
          title: "复制下载链接到剪切板",
          icon: "file_copy",
          label: "复制链接",
          click: (success, error) => {
            let urls = this.getDownloadURLs();

            if (!urls.length) {
              error(urls);
              return;
            }

            if (!PTSevrice.site.passkey) {
              if (!confirm("该站点未设置密钥，请在复制链接后手工添加密钥，是否继续？")) {
                error("操作已取消");
                return;
              }
            }

            PTSevrice.call(
              PTSevrice.action.copyTextToClipboard,
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
          this.statusBar.find(".noticejs-content").html(msg);
        }
      }

      /**
       * 获取下载链接
       */
      getDownloadURLs() {
        let links = $("a[href*='download']").toArray();
        let siteURL = PTSevrice.site.url;
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
          let url = $(item).attr("href").replace(/details\.php/gi, "download.php") + (PTSevrice.site.passkey ? "&passkey=" + PTSevrice.site.passkey : "");
          if (url) {
            if (url.substr(0, 2) === '//') { // 适配HUDBT、WHU这样以相对链接开头
              url = location.protocol + url;
            } else if (url.substr(0, 4) !== "http") {
              url = siteURL + url;
            }

            if (url && url.indexOf("https=1") === -1 && !PTSevrice.site.disableHttps) {
              url += "&https=1"
            }
          }
          return url;
        });

        return urls;
      }

      checkSize() {
        if (!PTSevrice.options.needConfirmWhenExceedSize) {
          return true;
        }
        // 获取所有种子的大小信息
        let doms = $(".torrents").find("td:contains('MB'),td:contains('GB'),td:contains('TB')");
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