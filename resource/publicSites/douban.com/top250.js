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
      let items = $("a[href*='movie.douban.com/subject'] img");
      console.log(items);
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
      let div = $("<div style='padding: 5px;margin-left: 20px;'/>").attr("title", `搜索 ${key}`).appendTo(parent);
      $("<a href='javascript:void(0);' class='lnk-sharing'/>").html("用 PT 助手搜索").on("click", () => {
        PTService.call(PTService.action.openOptions, `search-torrent/${key}`);
      }).appendTo(div);
    }

  };
  (new App()).init();
})(jQuery, window);