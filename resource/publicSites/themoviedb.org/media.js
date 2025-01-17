(function ($, window) {
  console.log("themoviedb.org media.js is loaded.");
  class App {
    async init() {
      this.initButtons();
      // 设置当前页面
      PTService.pageApp = this;
    }

    /**
     * 初始化按钮列表
     */
    async initButtons() {
      let IMDbId = await this.getIMDbId();
      if (IMDbId) {
        // 搜索
        PTService.addButton({
          title: "搜索当前电影",
          icon: "search",
          label: "搜索",
          click: (success, error) => {
            PTService.call(
              PTService.action.openOptions,
              `search-torrent/${IMDbId}`
            );
            success();
          }
        });
      }
    }

    /**
     * 获取 IMDb 编号
     */
    async getIMDbId() {
      const paths = location.pathname.split("/");
      try {
        const type = paths[1];
        const id = parseInt(paths[2]);
        // 获取IMDb ID
        const result = await PTService.call(
          PTService.action.getIMDbIdFromTMDB,
          {
            id,
            type
          }
        );

        console.log("getIMDbId", result);

        return result;
      } catch (error) {}

      return "";
    }
  }
  new App().init();
})(jQuery, window);
