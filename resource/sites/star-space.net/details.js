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
      let url = $("a[href*='download.php?tid=']:first")[0].href;
      return url;
    }

    showTorrentSize() {
      let htmlContent = $('td.nowrap:contains("属性") + td, td.nowrap:contains("Attitude") + td')[0].innerHTML;

      let regex = /体积\s*<span class="tag">(.*?)<\/span>/;

      let match = regex.exec(htmlContent);

      if (match) {
          let size = match[1];
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
      let query = $('td.nowrap:contains("标题") + td, td.nowrap:contains("Title") + td')
      if(query && query.length > 0){
        return query[0].textContent;
      }
    }

    /**
     * 获取当前种子IMDb Id
     */
    getIMDbId() {
      let imdbId = null
      try {
        imdbId = $('td.nowrap:contains("IMDB") + td');
        if (imdbId && imdbId.length > 0) {
          let match = imdbId[0].textContent.match(/(tt\d+)/)
          if (match && match.length >= 2) {
            imdbId = match[1];
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
