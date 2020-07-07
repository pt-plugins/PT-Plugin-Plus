(function ($, window) {
  console.log("this is details.js");
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
      this.showTorrentSize();
      this.initDetailButtons();
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      // 有一些扩展会为链接添加class，导致选择器失效，因此使用正则来获取链接
      // let query = $("a[href*='/dl/']:not([class])");
      let query = $("a[href*='/dl/']").filter(function() {
        return this.href.match(/\/[0-9a-f]{32}$/)
      });

      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
        // 直接获取的链接下载成功率很低
        // 如果设置了 passkey 则使用 rss 订阅的方式下载
        if (PTService.site.passkey) {
          let values = url.split("/");
          let id = values[values.length - 2];

          // 格式：vvvid|||passkeyzz
          let key = (new Base64).encode("vvv" + id + "|||" + PTService.site.passkey + "zz");
          url = `https://${PTService.site.host}/rssdd.php?par=${key}&ssl=yes`;
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
        PTService.addButton({
          title: "当前种子大小",
          icon: "attachment",
          label: size
        });
      }
    }

    getTitle() {
      return /"(.*?)"/.exec($("title").text())[1];
    }
  }
  (new App()).init();
})(jQuery, window);
