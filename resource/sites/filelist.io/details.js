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
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      let query = $("a[href*='download.php'][onclick!='return show_confirm();']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
        // 直接获取的链接下载成功率很低
        // 如果设置了 passkey 则使用 rss 订阅的方式下载
        if (PTService.site.passkey) {
          let id = url.getQueryString("id");
          url = `https://${PTService.site.host}/download.php?id=${id}`+"&passkey=" + PTService.site.passkey;
        }
        if (url && url.substr(0, 4) !== "http") {
          url = `${siteURL}${url}`;
        }
      }

      return url;
    }

    showTorrentSize() {
      let query = $("div[style='width:25%;float:left;']:contains('Last activity')");
      let size = "";
      if (query.length > 0) {
        size = query.text().replace("Size","").replace(/[\r\n]/g,"").replace(/Files(.*)/,"");
        // attachment
        PTService.addButton({
          title: "当前种子大小",
          icon: "attachment",
          label: size
        });
      }
    }

    getTitle() {
      let query = $("div.cblock-header");
      return query ? query.text(): "";
    }
  };
  (new App()).init();
})(jQuery, window);
