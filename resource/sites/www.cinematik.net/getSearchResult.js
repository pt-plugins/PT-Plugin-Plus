(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/takelogin\.php/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (
        /没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(
          options.responseText
        )
      ) {
        options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        return;
      }

      this.haveData = true;
    }

    /**
     * 获取搜索结果
     */
    getResult() {
      let site = options.site;
      let results = [];
      // 获取种子列表行
      let rows = options.page.find(
        options.resultSelector || "table[border='1']:last > tbody > tr"
      );
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return results;
      }
      // 获取表头
      let header = rows.eq(0).find("th,td");

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        time: 10,
        size: 6,
        seeders: 8,
        leechers: 9,
        completed: 7,
        comments: -1,
        author: -1,
        category: 0,
        title: 1
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      try {
        // 遍历数据行
        for (let index = 1; index < rows.length; index++) {
          const row = rows.eq(index);
          let cells = row.find(">td");

          let title = row.find("a[href*='details.php?id=']").first();
          if (title.length == 0) {
            continue;
          }

          let link = title.attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          let id = link.getQueryString("id");

          // 获取下载链接
          let url = `${site.url}download.php?id=${id}`;

          let time =
            fieldIndex.time == -1
              ? ""
              : cells
                  .eq(fieldIndex.time)
                  .find("div.addedtor")
                  .text() || "";

          let data = {
            title: title.text(),
            subTitle: "",
            link,
            url: url,
            size: cells.eq(fieldIndex.size).html() || 0,
            time: time,
            author:
              fieldIndex.author == -1
                ? ""
                : cells.eq(fieldIndex.author).text() || "",
            seeders:
              fieldIndex.seeders == -1
                ? ""
                : cells.eq(fieldIndex.seeders).text() || 0,
            leechers:
              fieldIndex.leechers == -1
                ? ""
                : cells.eq(fieldIndex.leechers).text() || 0,
            completed:
              fieldIndex.completed == -1
                ? ""
                : cells.eq(fieldIndex.completed).text() || 0,
            comments:
              fieldIndex.comments == -1
                ? ""
                : cells.eq(fieldIndex.comments).text() || 0,
            site: site,
            entryName: options.entry.name,
            category: this.getCategory(cells.eq(fieldIndex.category)),
            tags: options.searcher.getRowTags(site, row)
          };
          results.push(data);
        }
        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        }
      } catch (error) {
        console.error(error);
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack; //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
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
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
