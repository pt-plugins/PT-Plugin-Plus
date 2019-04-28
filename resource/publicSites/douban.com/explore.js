(function ($, window) {
  class App extends window.DoubanCommon {
    lastId = "";
    status = 0;
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
      if (this.status == 1) {
        return;
      }
      this.status = 1;
      let link = $("a[href*='movie.douban.com/subject']", parent);
      let key = "";
      if (link.length > 0) {
        let match = link.attr("href").match(/subject\/(\d+)/);
        if (match && match.length >= 2) {
          let id = match[1];
          key = `douban${id}`;
          if (id != this.lastId) {
            this.lastId = id;
            // 预转换
            PTService.call(PTService.action.getIMDbIdFromDouban, id).catch((error) => {
              console.log(error);
            });
          }
        }
      }
      if (!key) {
        this.status = 0;
        return;
      }
      let buttonId = "pt-plugin-search-button";
      $("#" + buttonId, parent).remove();
      $("<a href='javascript:void(0);' id='" + buttonId + "'/>").html("用 PT 助手搜索").on("click", (event) => {
        this.search(key, $(event.target));
      }).appendTo($(".collect-area", parent));
      this.status = 0;
    }
  };
  (new App()).init();
})(jQuery, window);