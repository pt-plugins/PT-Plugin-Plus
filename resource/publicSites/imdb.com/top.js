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
      let items = $("td.titleColumn a");
      console.log(items);
      if (items.length > 0) {
        items.each((index, item) => {
          let $item = $(item);
          let title = $item.text();
          let link = item.href.match(/title\/(tt\d+)/);
          if (link.length > 1) {
            this.createButton($item.parent(), link[1], title);
          }
        });
      }
    }

    createButton(parent, key, title) {
      if (!key) {
        return;
      }
      let div = $("<div style='text-align:right;'/>").attr("title", `搜索 ${title}`).appendTo(parent);
      $("<a href='javascript:void(0);'/>").html("用 PT 助手搜索").on("click", () => {
        PTService.call(PTService.action.openOptions, `search-torrent/${key}`);
      }).appendTo(div);
    }

  };
  (new App()).init();
})(jQuery, window);