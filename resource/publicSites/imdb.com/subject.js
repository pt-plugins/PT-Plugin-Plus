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
      }
    }

    /**
     * 获取 IMDb 编号
     */
    getIMDbId() {
      let link = location.pathname.match(/title\/(tt\d+)/);
      if (link.length > 1) {
        return link[1];
      }

      return "";
    }


  };
  (new App()).init();
})(jQuery, window);