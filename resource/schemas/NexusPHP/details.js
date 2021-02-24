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
     * 通过尝试分析 href 获取真正下载链接
     */

    _getDownloadUrlByPossibleHrefs() {
      const possibleHrefs = [
        // pthome
        "a[href*='downhash'][href*='https']",
        // hdchina
        "a[href*='hash'][href*='https']",
        // misc
        "a[href*='passkey'][href*='https']",
        "a[href*='passkey']"
      ];

      for (const href of possibleHrefs) {
        const query = $(href);
        if (query.length) {
          return query.attr("href");
        }
      }
      return null;
    }


    /**
     * 获取下载链接
     */
    getDownloadURL() {
      let url = PTService.getFieldValue("downloadURL");
      if (!url) {

        url = this._getDownloadUrlByPossibleHrefs();

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

      return this.getFullURL(url);
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
