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
      let url = PTService.getFieldValue("downloadURL");

      return this.getFullURL(url);
    }

    /**
     * 获取种子大小
     */
    showTorrentSize() {
      let size = $("div#size > div:eq(1) > span");
      // eslint-disable-next-line no-irregular-whitespace
      size = size.text().match(/([\d.]+[  ]?[ZEPTGMK]?i?B)/);
      size = (size && size.length > 1) ? size[1] : 0;

      if (size) {
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
      return $(".TorrentTitle").text();
    }
  }

  new App().init();
})(jQuery, window);
