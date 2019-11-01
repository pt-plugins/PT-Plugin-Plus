(function($) {
  console.log("this is best-movies.js");
  class App extends window.DoubanCommon {
    /**
     * 初始化按钮列表
     */
    initButtons() {
      let items = $("table.list_movies");
      if (items.length > 0) {
        items.each((index, item) => {
          let $item = $(item);
          let imdbId = $item.attr("id");
          if (imdbId) {
            this.createButton($item.find("tr > td:eq(0)"), imdbId);
          }
        });
      }
    }

    createButton(parent, key) {
      if (!key) {
        return;
      }
      let div = $("<div style='padding: 5px;text-align:center;'/>").appendTo(
        parent
      );
      const className = "gsc-search-button gsc-search-button-v2";
      const styles =
        "font-size: 12px;color: #fff;padding: 5px;margin-right: 5px;";
      $(`<button class='${className}' style='${styles}'/>`)
        .html("助手搜索")
        .attr("title", `按当前默认方案直接搜索 ${key}`)
        .on("click", event => {
          let button = $(event.target);
          this.search(key, button);
        })
        .appendTo(div);

      $(`<button class='${className}' style='${styles}'/>`)
        .html("按方案搜索")
        .attr("title", `按指定方案搜索 ${key}`)
        .on("click", event => {
          this.showPopupMenusForSolutions(event, key);
        })
        .appendTo(div);

      $(`<button class='${className}' style='${styles}'/>`)
        .html("按站点搜索")
        .attr("title", `按指定站点搜索 ${key}`)
        .on("click", event => {
          this.showPopupMenus(event, key);
        })
        .appendTo(div);
    }

    showPopupMenus(event, key) {
      let menus = [];
      let _this = this;

      function addMenu(item) {
        menus.push({
          title: item.title,
          fn: () => {
            _this.search(item.key);
          }
        });
      }

      const options = PTService.options;

      if (options.sites && options.sites.length > 0) {
        // 添加站点
        options.sites.forEach(site => {
          if (site.offline) {
            return;
          }
          addMenu({
            title: `在 ${site.name} - ${site.host} 中搜索`,
            key: `${key}/${site.host}`
          });
        });
      }

      if (menus.length > 0) {
        basicContext.show(menus, event);
        $(".basicContext").css({
          "font-size": "12px",
          left: "-=20px",
          top: "+=10px"
        });
      }
    }

    showPopupMenusForSolutions(event, key) {
      let menus = [];
      let _this = this;

      function addMenu(item) {
        menus.push({
          title: item.title,
          fn: () => {
            _this.search(item.key);
          }
        });
      }

      const solutions = PTService.options.searchSolutions;

      if (solutions && solutions.length > 0) {
        // 添加站点
        solutions.forEach(item => {
          addMenu({
            title: `使用 ${item.name} 搜索`,
            key: `${key}/${item.id}`
          });
        });
      }

      if (menus.length > 0) {
        menus.push({});
        addMenu({
          title: `在 <所有站点> 中搜索`,
          key: `${key}/all`
        });

        basicContext.show(menus, event);
        $(".basicContext").css({
          "font-size": "12px",
          left: "-=20px",
          top: "+=10px"
        });
      }
    }
  }
  new App().init();
})(jQuery);
