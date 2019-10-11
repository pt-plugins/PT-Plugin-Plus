(function($) {
  console.log("this is torrent.js");
  class App extends window.NexusPHPCommon {
    init() {
      // super();
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

      // 添加封面模式
      PTService.addButton({
        title: PTService.i18n.t("buttons.coverTip"), //"以封面的方式进行查看",
        icon: "photo",
        label: PTService.i18n.t("buttons.cover"), //"封面模式",
        click: (success, error) => {
          // 获取目标表格
          let items = $(
            "table.mainblockcontenttt a[href*='details.php?id='][onmouseover]"
          );
          let images = [];
          items.each((index, item) => {
            let text = $(item).attr("onmouseover");
            let query = text.match(/(.+)(img src=\\\')([^\']+)\\\'/);
            if (query && query.length > 3) {
              let url = location.origin + "/" + query[3];
              let href = $(item).attr("href");
              let title = $(item).text();
              images.push({
                url: url,
                key: href,
                title: title,
                link: href
              });
            }
          });
          success();
          if (images.length > 0) {
            // 创建预览
            new album({
              images: images,
              onClose: () => {
                PTService.buttonBar.show();
              }
            });
            PTService.buttonBar.hide();
          }
        }
      });
    }

    /**
     * 获取下载链接
     */
    getDownloadURLs() {
      let links = $("table.mainblockcontenttt:first")
        .find("a[href*='download.php']")
        .toArray();
      let siteURL = PTService.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (links.length == 0) {
        return this.t("getDownloadURLsFailed"); //"获取下载链接失败，未能正确定位到链接";
      }

      let urls = $.map(links, item => {
        let link = $(item).attr("href");
        if (link && link.substr(0, 4) != "http") {
          link = siteURL + link;
        }
        return link;
      });

      return urls;
    }

    /**
     * 确认大小是否超限
     */
    confirmWhenExceedSize() {
      return this.confirmSize(
        $("table.mainblockcontenttt:first").find(
          "td:contains('MiB'),td:contains('GiB'),td:contains('TiB')"
        )
      );
    }
  }
  new App().init();
})(jQuery);
