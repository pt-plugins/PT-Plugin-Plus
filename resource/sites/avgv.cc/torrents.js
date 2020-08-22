(function($, window) {
  // 添加封面模式
  PTService.addButton({
    title: PTService.i18n.t("buttons.coverTip"), //"以封面的方式进行查看",
    icon: "photo",
    label: PTService.i18n.t("buttons.cover"), //"封面模式",
    click: (success, error) => {
      // 获取目标表格
      let tables = $("table.torrentname");
      let images = [];
      tables.each((index, item) => {
        let img = $(".torrentimg .list > img", item);
        let url = img.attr("src");
        let href = img.parent().attr("href");
        let title = $("td.embedded", item).text();
        images.push({
          url: url,
          key: href,
          title: title, //img.parent().attr("title"),
          link: href,
        });
      });

      // 创建预览
      new album({
        images: images,
        onClose: () => {
          PTService.buttonBar.show();
        },
      });
      success();
      PTService.buttonBar.hide();
    },
  });
})(jQuery, window);
