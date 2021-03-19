(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/takelogin\.php/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }

      options.isLogged = true;

      if (
        /没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(
          options.responseText
        )
      ) {
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
        options.resultSelector || "table[id='torrenttable']:last > tbody > tr"
      );
      // 用于定位每个字段所列的位置
      let fieldIndex = {
        //title
        title: 1,
        //downloadlink
        downloadlink: 3,
        // 时间
        time: 6,
        // 大小
        size: 7,
        // 上传人数
        seeders: 9,
        // 下载人数
        leechers: 10,
        // 完成人数
        completed: 8,
        // 评论人数
        comments: 5,
        // 发布人
        author: 11,
        category: 0
      };

      if (site.url.substr(-1) == "/") {
        site.url = site.url.substr(0, site.url.length - 1);
      }

      // 遍历数据行
      for (let index = 1; index < rows.length; index++) {
        const row = rows.eq(index);
        let cells = row.find(">td");
        let title = cells.eq(fieldIndex.title).find("a[href*='details.php?id=']").first();
        if (title.length == 0) {
          continue;
        }
        let titleStrings = title.text();
        let link = title.attr("href");
        if (link && link.substr(0, 4) !== "http") {
          link = `${site.url}/${link}`;
        }
        let url = "";
        url = cells.eq(fieldIndex.downloadlink).find("a[href*='/download.php']").first().attr("href");
          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}/${url}`;
          }

        if (!url) {
          continue;
        }
        let time = cells.eq(fieldIndex.time).text();
        let data = {
          title: titleStrings,
          link: link,
          url: url,
          size: cells.eq(fieldIndex.size).text() || 0,
          time: time,
          author: cells.eq(fieldIndex.author).text() || "",
          seeders:
            cells
              .eq(fieldIndex.seeders)
              .text(),
          leechers:
            cells
              .eq(fieldIndex.leechers)
              .text(),
          completed: cells.eq(fieldIndex.completed).text(),
          comments: cells.eq(fieldIndex.comments).find("a[href*='#startcomments']").text() || 0,
          site: site,
          entryName: options.entry.name,
          category: this.getCategory(cells.eq(fieldIndex.category)),
          tags: this.getTags(row, options.torrentTagSelectors)
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
      let img = link.find("img:first");

      result.link = link.attr("href");
      if (result.link.substr(0, 4) !== "http") {
        result.link = options.site.url + result.link;
      }

      result.name = img.attr("alt");
      return result;
    }

    /**
     * 获取标签
     * @param {*} row
     * @param {*} selectors
     * @return array
     */
    getTags(row, selectors) {
      let tags = [];
      if (selectors && selectors.length > 0) {
        // 使用 some 避免错误的背景类名返回多个标签
        selectors.some(item => {
          if (item.selector) {
            let result = row.find(item.selector);
            if (result.length) {
              tags.push({
                name: item.name,
                color: item.color
              });
              return true;
            }
          }
        });
      }
      return tags;
    }
  }
  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
