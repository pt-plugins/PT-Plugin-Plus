(function ($, window) {
  class App {
    init() {
      this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化按钮列表
     */
    initButtons() {

      let IMDbId = this.getIMDbId();
      if (IMDbId) {
        // 搜索
        PTService.addButton({
          title: "搜索当前电影",
          icon: "search",
          label: "搜索",
          click: (success, error) => {
            PTService.call(PTService.action.openOptions, `search-torrent/${IMDbId}`);
            success();
          }
        });

        let recommendButton = $("span.rec a[share-id]");
        if (recommendButton.length > 0) {
          $("<a href='javascript:void(0);' class='lnk-sharing' style='margin-right: 5px;'/>").html("用 PT 助手搜索").on("click", () => {
            PTService.call(PTService.action.openOptions, `search-torrent/${IMDbId}`);
          }).insertBefore(recommendButton);
        }
      }
    }

    /**
     * 获取 IMDb 编号
     */
    getIMDbId() {
      let link = $("a[href*='www.imdb.com/title/']:first");
      if (link.length) {
        return link.text();
      }

      return "";
    }
  };
  (new App()).init();
})(jQuery, window);