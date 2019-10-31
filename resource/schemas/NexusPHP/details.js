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

      let sayThanksButton = $("input#saythanks:not(:disabled)");
      if (sayThanksButton.length) {
        // 说谢谢
        PTService.addButton({
          title: this.t("buttons.sayThanksTip"), // "对当前种子说谢谢",
          icon: "thumb_up",
          label: this.t("buttons.sayThanks"), //"感谢发布者",
          key: "sayThanks",
          click: (success, error) => {
            sayThanksButton.click();
            success();
            setTimeout(() => {
              PTService.removeButton("sayThanks");
            }, 1000);
          }
        });
      }
    }

    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let url = PTService.getFieldValue("downloadURL");
      if (!url) {
        let query = $("a[href*='passkey'][href*='https']");
        if (query.length > 0) {
          url = query.attr("href");
        } else {
          query = $("a[href*='passkey']");
          if (query.length > 0) {
            url = query.attr("href");
          }
        }

        if (!url) {
          url =
            $("td.rowfollow:contains('&passkey='):last").text() ||
            $("a[href*='download'][href*='?id']:first").attr("href") ||
            $("a[href*='download.php?']:first").attr("href");
        }

        // 如果链接地址中不包含passkey，且站点已配置 passkey 信息
        // 则尝试 passkey 来生成下载链接
        if (!(url + "").getQueryString("passkey") && PTService.site.passkey) {
          let id = location.href.getQueryString("id");
          if (id) {
            // 如果站点没有配置禁用https，则默认添加https链接
            return (
              location.origin +
              "/download.php?id=" +
              id +
              "&passkey=" +
              PTService.site.passkey +
              (PTService.site.disableHttps ? "" : "&https=1")
            );
          }
        }

        if (!url) {
          return "";
        }
      }

      url = this.getFullURL(url);

      if (url.indexOf("https=1") === -1) {
        url += "&https=1";
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
  }
  new App().init();
})(jQuery, window);
