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
      if (this.getDownloadURL()) {
        this.initDetailButtons();
      }
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let query = $("a[href*='download.php']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      }
      if (!url) {
        return "";
      }

      if (url.substr(0, 2) === '//') { 
        url = `${location.protocol}${url}`;
      } else if (url.substr(0, 1) === "/") {
        url = `${location.origin}${url}`;
      } else if (url.substr(0, 4) !== "http") {
        url = `${location.origin}/${url}`;
      }

      if (url.indexOf("ssl=yes") === -1) {
        url += "&ssl=yes"
      }

      return url;
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      let title = $("span#thread_subject").text();
      let datas = /\"(.*?)\"/.exec(title);
      if (datas && datas.length > 1) {
        return datas[1] || title;
      }
      return title;
    }
  };
  (new App()).init();
})(jQuery, window);