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
      let url = PTService.getFieldValue("downloadURL");

      return this.getFullURL(url);
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
      return PTService.getFieldValue("title") || $("title").text();
    }

    /**
     * 获取当前种子IMDb Id
     */
    getIMDbId() {
      let url = window.location.href
      let imdbId = null
      try {
        imdbId = PTService.getFieldValue('imdbId')
        if (!imdbId) {
          const link = $('a[href*=\'www.imdb.com/title/\']:first');
          if (link.length > 0) {
            let match = link.attr('href').match(/(tt\d+)/)
            if (match && match.length >= 2) {
              imdbId = match[1];
            }
          }
        }
      } catch (e) {
        console.log(`${url} 获取IMDb Id 失败`, e)
      }
      console.log(imdbId)
      return imdbId
    }
  }

  new App().init();
})(jQuery, window);
