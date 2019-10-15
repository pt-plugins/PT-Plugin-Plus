(function($) {
  console.log("this is torrents.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化按钮列表
     */
    initButtons() {
      this.initListButtons();
    }

    /**
     * 获取下载链接
     */
    getDownloadURLs() {
      let links = $("a.download").toArray();

      if (links.length == 0) {
        return this.t("getDownloadURLsFailed"); //"获取下载链接失败，未能正确定位到链接";
      }

      let urls = $.map(links, item => {
        let link = $(item).attr("href");
        return this.getFullURL(link);
      });

      return urls;
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

      console.log(data);

      if (!data.url) {
        PTService.showNotice({
          msg: this.t("invalidURL") //"无效的链接"
        });
        callback();
        return;
      }

      if (data.url.substr(0, 1) === "/") {
        data.url = `${location.origin}${data.url}`;
      } else if (data.url.substr(0, 4) !== "http") {
        data.url = `${location.origin}/${data.url}`;
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
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(
        $("#torrent_table").find(
          "td.td-size:contains('MB'),td[align='center']:contains('GB'),td[align='center']:contains('TB')"
        )
      );
    }
  }
  new App().init();
})(jQuery);
