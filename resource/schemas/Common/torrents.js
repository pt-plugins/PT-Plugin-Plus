(function($) {
  console.log("this is torrent.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons();
      this.initFreeSpaceButton();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化按钮列表
     */
    initButtons() {
      this.initListButtons();
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

    /**
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(PTService.getFieldValue("confirmSize"));
    }
  }
  new App().init();
})(jQuery);
