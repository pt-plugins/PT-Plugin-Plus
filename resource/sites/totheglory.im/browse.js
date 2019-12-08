(function($) {
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
      this.initListButtons(true);
    }

    /**
     * 获取下载链接
     */
    getDownloadURLs() {
      let links = $("a.bookmark").toArray();
      let urls = $.map(links, item => {
        let id = $(item).attr("tid");
        return this.getDownloadURL(id);
      });

      if (links.length == 0) {
        return "获取下载链接失败，未能正确定位到链接";
      }

      return urls;
    }

    getDownloadURL(id) {
      // 格式：vvvid|||passkeyzz
      let key = new Base64().encode(
        "vvv" + id + "|||" + PTService.site.passkey + "zz"
      );
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
              resolve();
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

      let result = this.getDroperURL(data.url);

      if (!result) {
        callback();
        return;
      }

      this.sendTorrentToDefaultClient(result)
        .then(result => {
          callback(result);
        })
        .catch(result => {
          callback(result);
        });
    }

    /**
     * 获取有效的拖放地址
     * @param {*} url
     */
    getDroperURL(url) {
      let values = url.split("/");
      let id = values[values.length - 2];
      let result = this.getDownloadURL(id);

      return result;
    }

    /**
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(
        $("#torrent_table").find(
          "td[align='center']:contains('MB'),td[align='center']:contains('GB'),td[align='center']:contains('TB')"
        )
      );
    }
  }
  new App().init();
})(jQuery);
