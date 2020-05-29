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

    /**
     * @return {number}
     */
    getSize(size) {
      if (typeof size == "number") {
        return size;
      }
      let _size_raw_match = size.match(
        /\[(\d*\.?\d+)(.*[^TGMK])?([TGMK](B|iB)?)]/i
      );
      if (_size_raw_match) {
        let _size_num = parseFloat(_size_raw_match[1]);
        let _size_type = _size_raw_match[3];
        switch (true) {
          case /Ti?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 40);
          case /Gi?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 30);
          case /Mi?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 20);
          case /Ki?B?/i.test(_size_type):
            return _size_num * Math.pow(2, 10);
          default:
            return _size_num;
        }
      }
      return 0;
    }
  }
  new App().init();
})(jQuery);
