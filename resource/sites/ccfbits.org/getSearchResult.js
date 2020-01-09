(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/loginform/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (/没有找到匹配种子/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
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
        "table.mainouter > tbody > tr:eq(1) > td > table:last > tbody > tr"
      );
      const time_regex = /(\d{4}-\d{2}-\d{2}[^\d]+?\d{2}:\d{2}:\d{2})/;
      const time_regen_replace = /-(\d{2})[^\d]+?(\d{2}):/;
      const size_regex = /[\d.]+ [MGT]B/;

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        time: 4, // 时间
        seeders: 7, // 上传人数
        leechers: 8, // 下载人数
        author: 9, // 发布人
        category: 0
      };

      if (site.url.substr(-1) === "/") {
        site.url = site.url.substr(0, site.url.length - 1);
      }

      // 遍历数据行
      for (let index = 1; index < rows.length; index++) {
        const row = rows.eq(index);
        let cells = row.find(">td");

        // 主副标题从cells.eq(1)中获取
        let _title_cell = cells.eq(1);
        let _title = _title_cell.find("> table > tbody > tr");
        if (_title.length != 2) {
          continue;
        }
        let main_title_cell = _title.eq(0).find('a[href^="details.php"]');
        let title = main_title_cell.attr("title").trim();

        let sub_title_cell = _title.eq(1).find("td:eq(0)");
        let sub_title = sub_title_cell.text().trim();

        let link = main_title_cell.attr("href");
        if (link && link.substr(0, 4) !== "http") {
          if (link.substr(0, 1) == "/") {
            link = `${site.url}${link}`;
          } else {
            link = `${site.url}/${link}`;
          }
        }

        let url_cell = cells.eq(2).find('a[href^="download.php"]');
        let url = url_cell.attr("href");

        if (url && url.substr(0, 4) !== "http") {
          if (url.substr(0, 1) == "/") {
            url = `${site.url}${url}`;
          } else {
            url = `${site.url}/${url}`;
          }
        }

        if (!url) {
          continue;
        }

        let size_completed_cell = cells.eq(6);
        let _size = (size_completed_cell.text().match(size_regex) || [0])[0];
        let _completed = (size_completed_cell.text().match(/(\d+) 次/) || [
          0,
          0
        ])[1];

        let comments_cell = cells.eq(3);
        let _comments = (comments_cell.text().match(/(\d+) 评论/) || [0, 0])[1];

        let data = {
          title: title,
          subTitle: sub_title,
          link,
          url: url,
          size: _size,
          time:
            cells
              .eq(fieldIndex.time)
              .html()
              .match(time_regex)[1]
              .replace(time_regen_replace, "-$1 $2:") ||
            cells.eq(fieldIndex.time).text(),
          author: cells.eq(fieldIndex.author).text() || "",
          seeders: cells.eq(fieldIndex.seeders).text() || 0,
          leechers: cells.eq(fieldIndex.leechers).text() || 0,
          completed: _completed,
          comments: _comments,
          site: site,
          entryName: options.entry.name,
          category: this.getCategory(cells.eq(fieldIndex.category)),
          tags: Searcher.getRowTags(site, row)
        };
        results.push(data);
      }

      if (results.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
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
})(options, options.searcher);
