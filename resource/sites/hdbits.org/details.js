(function ($, window) {
  console.log("this is details.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons();
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
      this.showTorrentSize();
      this.initDetailButtons();
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let siteURL = PTService.site.url;
      let query = $("a[href*='download.php']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
        url = url.replace("source=browse", "source=rss");
        url = url.replace(new RegExp("/download.php/.*\.torrent"),"download.php");
        if (url && url.substr(0, 4) !== "http") {
          url = `${siteURL}${url}`;
        }
      }
      return url;
    }

    showTorrentSize() {
      let query = $("th:contains('Size') + td");
      let size = "";
      if (query.length > 0) {
        size = query.text();
        // attachment
        PTService.addButton({
          title: "当前种子大小",
          icon: "attachment",
          label: size
        });
      }
    }

    getTitle() {
      let query = $("a[href*='download.php']");
      return query ? query.text().replace(".torrent", ""): "";
    }
  };
  (new App()).init();
})(jQuery, window);
