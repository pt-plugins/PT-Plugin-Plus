(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/\/login/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      this.haveData = true;
    }

    /**
     * 获取搜索结果
     */
    getResult() {
      if (!this.haveData) {
        return [];
      }
      let site = options.site;
      let selector =
        options.resultSelector || "div.table-responsive > table:first";
      let table = options.page.find(selector);
      // 获取种子列表行
      let rows = table.find("> tbody > tr");
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return [];
      }
      let results = [];
      // 获取表头
      let header = table.find("> thead > tr > th");
      let beginRowIndex = 0;
      if (header.length == 0) {
        beginRowIndex = 1;
        header = rows.eq(0).find("th,td");
      }

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        // 发布时间
        time: -1,
        // 大小
        size: -1,
        // 上传数量
        seeders: -1,
        // 下载数量
        leechers: -1,
        // 完成数量
        completed: -1,
        // 评论数量
        comments: -1,
        // 发布人
        author: header.length - 1,
        // 分类
        category: 0
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      // 获取字段所在的列
      for (let index = 0; index < header.length; index++) {
        let cell = header.eq(index);
        let text = cell.text();

        // 评论数
        if (cell.find("a[href*='comments']").length) {
          fieldIndex.comments = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 大小
        if (cell.find("a[href*='size']").length) {
          fieldIndex.size = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 种子数
        if (cell.find("a[href*='seeders']").length) {
          fieldIndex.seeders = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 下载数
        if (cell.find("a[href*='leechers']").length) {
          fieldIndex.leechers = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 完成数
        if (cell.find("a[href*='complete']").length) {
          fieldIndex.completed = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 分类
        if (text == "Type") {
          fieldIndex.category = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }
      }

      try {
        // 遍历数据行
        for (let index = beginRowIndex; index < rows.length; index++) {
          const row = rows.eq(index);
          let cells = row.find(">td");

          let title = row.find(
            "a[href*='details.php']:not([href*='startcomments']):first"
          );
          if (title.length == 0) {
            title = row.find("a[href*='/t/']:first");
          }
          if (title.length == 0) {
            continue;
          }
          let link = title.attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          // 获取下载链接
          let url = row.find("a[href*='/download.php']").attr("href");

          if (url.length == 0) {
            continue;
          }

          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          let data = {
            title: title.text(),
            subTitle: "",
            link,
            url: url,
            size:
              cells
                .eq(fieldIndex.size)
                .text()
                .trim() || 0,
            time: this.getTime(row),
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
                : cells.eq(fieldIndex.comments).text().replace("Go to comments","") || 0,
            site: site,
            tags: Searcher.getRowTags(site, row),
            entryName: options.entry.name,
            category:
              fieldIndex.category == -1
                ? null
                : this.getCategory(cells.eq(fieldIndex.category))
          };
          results.push(data);
        }

        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        }
      } catch (error) {
        console.log(error);
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack; //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }

      return results;
    }

    getTime(row) {
      let text = row.find("td.al div.sub").text();
      if (text) {
        if (text.indexOf("|") > 0) {
	        text=text.split("|")[1];
	        if (text.indexOf("by") > 0) {
              return text.split("|")[0].trim();
          }
        }
      }
      return text;
    }

    /**
     * 获取副标题
     * @param {*} title
     * @param {*} row
     */
    getSubTitle(title, row) {
      return "";
    }

    /**
     * 获取分类
     * @param {*} cell 当前列
     */
    getCategory(cell) {
      let result = {
        name: cell.find("img:first").attr("alt"),
        link: ""
      };
      return result;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
