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
      let query = $("a[href*='download.php']:first");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
        if (url.substr(0, 4) != "http") {
          url = PTService.site.url + url;
        }
      }

      return url;
    }

    showTorrentSize() {
      let size = PTService.filters.formatSize(PTService.getFieldValue("size"));
      PTService.addButton({
       title: "当前种子大小",
        icon: "attachment",
        label: size
      });
    }
    /**
     * 获取当前种子标题
     */
    getTitle() {
      return $("a[href*='download.php']:first").text().trim();
    }
  };
  (new App()).init();
})(jQuery, window);