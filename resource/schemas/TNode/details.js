(function($, window) {
  console.log("this is details.js");
  class App extends window.TNodeCommon {
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
      let url = PTService.getFieldValue("downloadURL") || $("a[href*='/api/torrent/download/']").attr('href');
      if (!url) {
        return "";
      }
      // 如果链接地址中不包含passkey，且站点已配置 passkey 信息
      // 则尝试 passkey 来生成下载链接
      if (PTService.site.passkey && !(url + "").includes(PTService.site.passkey)) {
        if (url) {
          url = url + (url.endsWith('/') ? '' : '/') + PTService.site.passkey
        }
      }

      return this.getFullURL(url);
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      let title = $('label[for="form_item_subtitle"]').parent().next().text() || $('label[for="form_item_title"]').parent().next().text() || '';
      return subtitle || title;
    }
    
    /**
     * 获取当前种子IMDb Id
     */
    getIMDbId() {
      // TODO
      return null;
    }
  }
  new App().init();
})(jQuery, window);
