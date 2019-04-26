(function ($, window) {
  class App extends window.DoubanCommon {
    /**
     * 初始化按钮列表
     */
    initButtons() {
      // 检测DOM变化
      $(".detail-pop").bind('DOMNodeInserted', (e) => {
        this.createButton($(e.target))
      })
    }

    createButton(parent) {
      let link = $("a[href*='movie.douban.com/subject']", parent);
      let key = "";
      if (link.length > 0) {
        let match = link.attr("href").match(/subject\/(\d+)/);
        if (match && match.length >= 2) {
          key = `douban${match[1]}`;
        }
      }
      if (!key) {
        return;
      }
      let id = "pt-plugin-search-button";
      $("#" + id, parent).remove();
      $("<a href='javascript:void(0);' id='" + id + "'/>").html("用 PT 助手搜索").on("click", (event) => {
        this.search(key, $(event.target));
      }).appendTo($(".collect-area", parent));
    }
  };
  (new App()).init();
})(jQuery, window);