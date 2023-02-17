(function($, window) {
  console.log("this is details.js");
  class App extends window.TNodeCommon {
    init() {
      this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }
    // 初始化按钮列表
    initButtons() {
      this.initDetailButtons();
    }
    // 获取下载链接
    getDownloadURL() {
      let url = PTService.getFieldValue("downloadURL") || $("a[href*='/api/torrent/download/']:contains('复制')").attr('href') || $("a[href*='/api/torrent/download/']").attr('href'); 
      if (!url) {
        return "";
      }
      return this.getFullURL(url);
    }
    // 获取当前种子标题
    getTitle() {
      let title = $('label[for="form_item_subtitle"]').parent().next().text() || $('label[for="form_item_title"]').parent().next().text() || '';
      return title;
    }
    // 获取当前种子IMDb Id
    getIMDbId() {
      // TODO
      return null;
    }
  }
  new App().init();
})(jQuery, window);
