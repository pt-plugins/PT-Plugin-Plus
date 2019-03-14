(function ($, window) {
  console.log("this is details.js");
  class App extends window.NexusPHPCommon {
    init() {
      this.initButtons();
      // 设置当前页面
      PTSevrice.pageApp = this;
    }
    /**
     * 初始化按钮列表
     */
    initButtons() {
      this.initDetailButtons();

      let sayThanksButton = $("input#saythanks:not(:disabled)");
      if (sayThanksButton.length) {
        // 说谢谢
        PTSevrice.addButton({
          title: "对当前种子说谢谢",
          icon: "thumb_up",
          label: "感谢发布者",
          key: "sayThanks",
          click: (success, error) => {
            sayThanksButton.click();
            success();
            setTimeout(() => {
              PTSevrice.removeButton("sayThanks")
            }, 1000)
          }
        });
      }
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let query = $("a[href*='passkey'][href*='https']");
      let url = "";
      if (query.length > 0) {
        url = query.attr("href");
      } else {
        query = $("a[href*='passkey']");
        if (query.length > 0) {
          url = query.attr("href");
        }
      }

      if (!url) {
        url = $("a[href*='download'][href*='?id']:first").attr("href") || $("a[href*='download.php?']:first").attr("href");
      }

      // 如果还是没有获取到下载链接地址，则尝试 passkey 来生成下载链接
      if (!url && PTSevrice.site.passkey) {
        let id = location.href.getQueryString("id");
        if (id) {
          // 如果站点没有配置禁用https，则默认添加https链接
          return location.origin + "/download.php?id=" + id + "&passkey=" + PTSevrice.site.passkey + (PTSevrice.site.disableHttps ? "" : "&https=1");
        }
      }

      if (!url) {
        return "";
      }

      if (url.substr(0, 2) === '//') { // 首先尝试适配HUDBT、WHU这样以相对链接开头
        url = `${location.protocol}${url}`;
      } else if (url.substr(0, 1) === "/") {
        url = `${location.origin}${url}`;
      } else if (url.substr(0, 4) !== "http") {
        url = `${location.origin}/${url}`;
      }

      if (url.indexOf("https=1") === -1) {
        url += "&https=1"
      }

      return url;
    }

    /**
     * 获取当前种子标题
     */
    getTitle() {
      let title = $("title").text();
      let datas = /\"(.*?)\"/.exec(title);
      if (datas && datas.length > 1) {
        return datas[1] || title;
      }
      return title;
    }
  };
  (new App()).init();
})(jQuery, window);