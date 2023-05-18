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
      this.initDetailButtons();
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let url = PTService.getFieldValue("downloadURL");
      if (!url) {
        let query = $("a[href*='/download/']:first");
        if (query.length == 0) {
          query = $("a[href*='/download_check/']");
          if (query.length > 0) {
            url = query.attr("href").replace("/download_check/", "/download/");
          }
        } else {
          url = query.attr("href");
        }
      }

      return this.getFullURL(url);
    }
    
    /**
     * 获取当前种子IMDb Id
     */
    getIMDbId() {
      try
      {
        let imdbId = PTService.getFieldValue("imdbId");
        console.log(imdbId);
        if (imdbId)
          return imdbId;
        else {
          const link = $("a[href*='www.imdb.com/title/']:first");
          if (link.length > 0) {
            let match = link.attr("href").match(/(tt\d+)/);

            if (match && match.length >= 2)
              return imdbId = match[1];

          }
        }
      } catch {
      }
      return null;
    }
  }
  new App().init();
})(jQuery, window);
