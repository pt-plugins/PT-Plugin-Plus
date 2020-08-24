(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/\/doLogin/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }
      options.isLogged = true;

      if (/Nothing found/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.noTorrents;
        return;
      }
      this.haveData = true;
    }

    /**
     * 获取搜索结果
     */
    getResult() {
      if (!this.haveData) {
        return [];
      }

      let results = [];
      let site = options.site;
      // 获取种子列表行
      let rows = options.page.find(
        options.resultSelector || "table#torrent-list:last > tbody > tr:not(:eq(0))"
      );

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        // 时间
        time: 4,
        // 大小
        size: 5,
        // 上传人数
        seeders: 7,
        // 下载人数
        leechers: 8,
        // 完成人数
        completed: 6,
        // 标题
        name: 2,
        // 发布人
        author: 9,
        //配置
        category: 0
      };

      if (site.url.substr(-1) == "/") {
        site.url = site.url.substr(0, site.url.length - 1);
      }
      // 遍历数据行
      for (let index = 0; index < rows.length; index++) {
        const row = rows.eq(index);
        let cells = row.find(">td");

        let title = cells.eq(fieldIndex.name).find("b > a");
        if (title.length == 0) {
          continue;
        }

        let titleStrings = title.html().split("::");
        let link = title.attr("href");
        if (link && link.substr(0, 4) !== "http") {
          link = `${site.url}/${link}`;
        }
        let url = row.find("a[href*='download.php']").attr("href");
        if (url && url.substr(0, 4) !== "http") {
          url = `${site.url}/${url}`;
        }
        if (!url) {
          continue;
        }

        let subTitle = "";
        if (titleStrings.length > 0) {
          subTitle = $("<span>")
            .html(titleStrings[1])
            .text();
        }

        let time =
          cells
            .eq(fieldIndex.time)
            .text()
            .replace(/([a-zA-Z]+)/g, "$1 ")
            .replace(/^\s+|\s+$/g, "") + ".";
        let data = {
          title: $("<span>")
            .html(titleStrings[0])
            .text(),
          subTitle: subTitle || "",
          link,
          url: url,
          size: cells.eq(fieldIndex.size).html() || 0,
          time: time || "",
          author: cells.eq(fieldIndex.author).text() || "",
          seeders:
            cells
              .eq(fieldIndex.seeders)
              .text()
              .split("/")[0] || 0,
          leechers:
            cells
              .eq(fieldIndex.leechers)
              .text()
              .split("/")[1] || 0,
          completed: cells.eq(fieldIndex.completed).text() || 0,
          comments: cells.eq(fieldIndex.comments).text() || 0,
          site: site,
          entryName: options.entry.name,
          category: this.getCategory(cells.eq(fieldIndex.category)),
          tags: Searcher.getRowTags(site, row)
        };
        results.push(data);
      }

      if (results.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
      }

      return results;
    }

    /**
     * 获取分类
     * @param {*} cell 当前列
     */
    getCategory(cell) {
      let result = {
        name: "",
        link: ""
      };
      let link = cell.find("a:first");
      result.link = link.attr("href");
      let id = result.link.match(/cat=(\d+)/)[1];
      if (result.link.substr(0, 4) !== "http") {
        result.link = options.site.url + result.link;
      }
      result.name = this.getCategoryName(id);
      return result;
    }

    getCategoryName(id) {
      if ($.isEmptyObject(this.categories)) {
        let cells = options.page
          .find("table.bottom > tbody > tr")
          .eq(1)
          .find("td");
        cells.each((i, dom) => {
          let id = $(dom)
            .find("input")
            .attr("id");
          id = id.replace("c", "");
          let name = $(dom)
            .find("a")
            .text();
          if (id) {
            this.categories[id] = name;
          }
        });
      }
      return this.categories ? this.categories[id] : "";
    }
  }
  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
