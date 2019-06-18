(function($, window) {
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
      // // 添加封面模式
      // PTService.addButton({
      //   title: "以封面的方式进行查看",
      //   icon: "photo",
      //   label: "封面模式",
      //   click: (success, error) => {
      //     // 获取目标表格
      //     let items = $("div.screen-image");
      //     let images = [];
      //     items.each((index, item) => {
      //       item = $(item);
      //       let screens = item.data("screens");
      //       let id = item.data("id");
      //       console.log(screens)
      //       let url = (screens.split("|")[0]).replace(".th.", ".");
      //       let title = $("img", item).attr("alt");
      //       let thumb = $("img", item).attr("src");
      //       images.push({
      //         url,
      //         key: id,
      //         thumb,
      //         title,
      //         link: `${location.origin}/torrent/${id}`
      //       });
      //     })

      //     // 创建预览
      //     new album({
      //       images: images,
      //       onClose: () => {
      //         PTService.buttonBar.show();
      //       }
      //     });
      //     success()
      //     PTService.buttonBar.hide();
      //   }
      // })
    }

    /**
     * 获取下载链接
     */
    getDownloadURLs() {
      let links = $("a[href*='/download/torrent/']").toArray();
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
        $("table#torrents:first, table#torrentTable:first").find(
          "td:contains('MiB'),td:contains('GiB'),td:contains('TiB')"
        )
      );
    }
  }
  new App().init();
})(jQuery, window);
