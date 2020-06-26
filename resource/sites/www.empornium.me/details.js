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
    
    getDownloadURLs() {
      let links = PTService.getFieldValue("downloadURLs");

      if (links.length == 0) {
        //  "获取下载链接失败，未能正确定位到链接";
        return this.t("getDownloadURLsFailed");
      }
      if (typeof(links[0])!="string"){
        let urls = $.map(links, item => {
          let url = $(item).attr("href");
          return this.getFullURL(url);
        });
        return urls;
      }
      return links
    }
    getDownloadURL() {
      let url = PTService.getFieldValue("downloadURL");

      return this.getFullURL(url);
    }

    /**
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(PTService.getFieldValue("confirmSize"));
    }
    /**
     * 获取当前种子标题
     */
    getTitle() {
      return PTService.getFieldValue("title") || $("title").text();
    }
  }
  new App().init();
})(jQuery, window);
