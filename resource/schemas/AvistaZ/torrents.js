(function ($, window) {
  // 添加封面模式
  PTService.addButton({
    title: "以封面的方式进行查看",
    icon: "photo",
    label: "封面模式",
    click: (success, error) => {
      // 获取目标表格
      let items = $("div.screen-image");
      let images = [];
      items.each((index, item) => {
        item = $(item);
        let screens = item.data("screens");
        let id = item.data("id");
        console.log(screens)
        let url = (screens.split("|")[0]).replace(".th.", ".");
        let title = $("img", item).attr("alt");
        let thumb = $("img", item).attr("src");
        images.push({
          url,
          key: id,
          thumb,
          title,
          link: `${location.origin}/torrent/${id}`
        });
      })

      // 创建预览
      new album({
        images: images,
        onClose: () => {
          PTService.buttonBar.show();
        }
      });
      success()
      PTService.buttonBar.hide();
    }
  })
})(jQuery, window)