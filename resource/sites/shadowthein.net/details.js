(function($, window) {
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
      let query = $("a.index[href*='download.php']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      }

      if (!url) {
        return "";
      }

      return `${location.origin}${url}`;
    }

    showTorrentSize() {
      let query = $("td.row2:contains('Size') + td");
      let size = "";
      if (query.length > 0) {
        size = query.text().match(/^[^\(]+/);
        // attachment
        PTService.addButton({
          title: "当前种子大小",
          icon: "attachment",
          label: size
        });
      }
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      return $("table.main h1:first")
        .text()
        .trim();
    }
  }
  new App().init();
})(jQuery, window);
