(function ($) {
  console.log("this is browse.js");
  class App extends window.NexusPHPCommon {
      init() {
        this.initButtons();
        this.initFreeSpaceButton();
        // 设置当前页面
        PTService.pageApp = this;
      }

      isNexusPHP() {//want use same code
        return PTService.site.schema == "HDB";
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
        let links = $("a.js-download").toArray();

        let urls = $.map(links, (item) => {
          let link = $(item).attr("href");
          link = link.replace("source=browse", "source=rss");
          link = link.replace(new RegExp("/download.php/.*\.torrent"),"download.php");
          if (link && link.substr(0, 4) !== "http") {
            link = `${siteURL}${link}`;
          }
          return link;
        });

        if (links.length == 0) {
          return "获取下载链接失败，未能正确定位到链接";
        }

        return urls;
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

      getDroperURL(url) {
        let siteURL = PTService.site.url;
        if (siteURL.substr(-1) != "/") {
          siteURL += "/";
        }
        if (!url.getQueryString) {
          PTService.showNotice({
            msg:
              "系统依赖函数（getQueryString）未正确加载，请尝试刷新页面或重新启用插件。"
          });
          return null;
        }
        if (url.indexOf("download.php") == -1) {
          let id = url.getQueryString("id");
          let firstlink = $("a.js-download:first");
          let passkey = firstlink.attr("href").getQueryString("passkey");
          if (id) {
            // 如果站点没有配置禁用https，则默认添加https链接
            url =
              siteURL +
              "download.php?id=" +
              id +
              (PTService.site.passkey
                ? "&passkey=" + PTService.site.passkey
                : passkey ? "&passkey="+ passkey : "") +
              "&source=rss";
          } else {
            url = "";
          }
        }
        return url;
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
        let result = this.getDroperURL(data.url);

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
        return this.confirmSize($("#torrent-list").find("td.center:contains('MiB'),td.center:contains('GiB'),td.center:contains('TiB')"));
      }
    }
    (new App()).init();
})(jQuery);
