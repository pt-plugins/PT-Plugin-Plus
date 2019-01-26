if (!"".getQueryString) {
  String.prototype.getQueryString = function (name, split) {
    if (split == undefined) split = "&";
    var reg = new RegExp(
        "(^|" + split + "|\\?)" + name + "=([^" + split + "]*)(" + split + "|$)"
      ),
      r;
    if ((r = this.match(reg))) return decodeURI(r[2]);
    return null;
  };
}

(function (options) {

  class Parser {
    constructor() {
      this.haveData = false;
      if (/auth_form/.test(options.responseText)) {
        options.errorMsg = `[${options.site.name}]需要登录后再搜索`;
        return;
      }
      if (/没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(options.responseText)) {
        options.errorMsg = `[${options.site.name}]没有搜索到相关的种子`;
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
      let rows = options.page.find(options.resultSelector);
      if (rows.length == 0) {
        options.errorMsg = `[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return results;
      }
      // 获取表头
      let header = rows.eq(0).find("th,td");

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        time: -1,
        size: -1,
        seeders: -1,
        leechers: -1,
        completed: -1,
        comments: -1,
        author: -1,
        category: 1
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      // 获取字段所在的列
      for (let index = 0; index < header.length; index++) {
        const cell = header.eq(index);

        // 发布时间
        if (cell.find("a[href*='order_by=s3']").length) {
          fieldIndex.time = index;
          continue;
        }

        // 大小
        if (cell.find("a[href*='order_by=s4']").length) {
          fieldIndex.size = index;
          continue;
        }

        // 种子数
        if (cell.find("a[href*='order_by=s6']").length) {
          fieldIndex.seeders = index;
          continue;
        }

        // 下载数
        if (cell.find("a[href*='order_by=s7']").length) {
          fieldIndex.leechers = index;
          continue;
        }

        // 完成数
        if (cell.find("a[href*='order_by=s5']").length) {
          fieldIndex.completed = index;
          continue;
        }
      }

      try {
        rows = rows.filter("tr.torrent_redline");
        // 遍历数据行
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);
          let cells = row.find(">td");

          let title = row.find("a[href*='torrents.php?id=']").first();
          if (title.length == 0) {
            continue;
          }

          let link = title.attr("href");
          if (link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          // 获取下载链接
          let url = row.find("a[href*='torrents.php?action=download'][title='Download']").first();

          if (url.length == 0) {
            continue;
          }

          url = url.attr("href");

          if (url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          title = title.parent()
          title.find(">span, div.tags").remove();
          let time = fieldIndex.time == -1 ? "" : cells.eq(fieldIndex.time).attr("title") || cells.eq(fieldIndex.time).text() || "";
          if (time) {
            time += ":00";
          }

          let data = {
            title: title.text(),
            link,
            url: url,
            size: cells.eq(fieldIndex.size).html() || 0,
            time: time,
            author: fieldIndex.author == -1 ? "" : cells.eq(fieldIndex.author).text() || "",
            seeders: fieldIndex.seeders == -1 ? "" : cells.eq(fieldIndex.seeders).text() || 0,
            leechers: fieldIndex.leechers == -1 ? "" : cells.eq(fieldIndex.leechers).text() || 0,
            completed: fieldIndex.completed == -1 ? "" : cells.eq(fieldIndex.completed).text() || 0,
            comments: fieldIndex.comments == -1 ? "" : cells.eq(fieldIndex.comments).text() || 0,
            site: site,
            category: fieldIndex.category == -1 ? null : this.getCategory(cells.eq(fieldIndex.category))
          };
          results.push(data);
        }
      } catch (error) {
        console.error(error)
        options.errorMsg = `[${options.site.name}]获取种子信息出错: ${error.message}`;
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

      if (img.length) {
        result.name = img.attr("title");
      } else {
        result.name = link.text();
      }
      return result;
    }
  }

  let parser = new Parser(options)
  options.results = parser.getResult()
  console.log(options.results);
})(options)