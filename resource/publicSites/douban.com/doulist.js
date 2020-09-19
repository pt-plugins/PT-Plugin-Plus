(function ($, window) {
  class App extends window.DoubanCommon {
    /**
     * 初始化按钮列表
     */
    initButtons() {
      let items = $(".doulist-subject");
      console.log(items.length);
      if (items.length > 0) {
        items.each((index, item) => {
          let $item = $(item);
          let $title = $item.find(".title a");
          let link = $title.attr("href");
          let match = link.match(/subject\/(\d+)/);
          if (match && match.length >= 2) {
            let title = $title.text().trim();
            let key = "";

            switch (true) {
              // 电影
              case link.indexOf("movie.douban.com") > 0:
                key = `douban${match[1]}`;
                break;

              // 其他
              default:
                key = title;
                break;
            }
            this.createButton($item.find(".post"), key, title);
          }
        });
      }
    }

    createButton(parent, key, title) {
      if (!key) {
        return;
      }
      let label = "PT 助手搜索";
      parent.css({
        "max-height": "unset"
      });
      let div = $("<div style='padding: 5px;'/>")
        .attr("title", `搜索 ${title}`)
        .appendTo(parent);
      $("<a href='javascript:void(0);' class='lnk-sharing'/>")
        .html(label)
        .on("click", event => {
          let button = $(event.target);
          this.search(key, button);
        })
        .appendTo(div);
    }
  }
  new App().init();
})(jQuery, window);
