(function($, window) {
  console.log("this is detail.js");
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
      let query = $("div.download a[href*='torrent.php?action=download&id=']");
      let url = "";
      console.log(query);
      if (query.length > 0) {
        url = query.attr("href");
      }

      if (!url) {
        return "";
      }
      console.log('初始化下载链接',url);
      return `${location.origin}/${url}`;
    }

    showTorrentSize() {
      let query = $("div.dt:contains('Méret') + td");
      let size = "";
      console.log('抓到种子大小：',query.text());
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
      return $("div.torrent_reszletek_cim:first")
        .text()        
        .trim();
    }
  }
  new App().init();
})(jQuery, window);
