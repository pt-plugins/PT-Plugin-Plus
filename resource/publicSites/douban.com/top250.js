(function ($, window) {
  class App extends window.DoubanCommon {
    /**
     * 初始化按钮列表
     */
    initButtons() {
      let items = $("a[href*='movie.douban.com/subject'] img");
      if (items.length > 0) {
        items.each((index, item) => {
          let $item = $(item);
          this.createButton($item.parent(), $item.attr("alt"));
        });
      }
    }

    createButton(parent, key) {
      if (!key) {
        return;
      }
      let title = "用 PT 助手搜索";
      let div = $("<div style='padding: 5px;margin-left: 20px;'/>").attr("title", `搜索 ${key}`).appendTo(parent);
      $("<a href='javascript:void(0);' class='lnk-sharing'/>").html(title).on("click", (event) => {
        let match = parent.attr("href").match(/subject\/(\d+)/);
        if (match && match.length >= 2) {
          key = `douban${match[1]}`;
        }
        let button = $(event.target);
        this.search(key, button);
      }).appendTo(div);
    }
  };
  (new App()).init();
})(jQuery, window);