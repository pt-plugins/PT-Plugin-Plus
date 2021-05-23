(function ($, window) {
  class App extends window.DoubanCommon {
    /**
     * 初始化按钮列表
     */
    initButtons() {
      let key = this.getIMDbId() || this.getTitle();
      if (key) {
        // 搜索
        PTService.addButton({
          title: "搜索当前电影",
          icon: "search",
          label: "搜索",
          click: (success, error) => {
            this.search(key);
            success();
          }
        });

        let recommendButton = $("span.rec a[share-id]");
        if (recommendButton.length > 0) {
          $("<a href='javascript:void(0);' class='lnk-sharing' style='margin-right: 5px;'/>").html("用 PT 助手搜索").on("click", (event) => {
            this.search(key, $(event.target));
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

      // 尝试从文本中获取
      link = $("#info").text().match(/IMDb: (tt\d+)/);

      if (link) {
        return link[1];
      }

      return "";
    }

    getTitle() {
      return document.title.replace(" (豆瓣)", "");
    }
  };
  (new App()).init();
})(jQuery, window);