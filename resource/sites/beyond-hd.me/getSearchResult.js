(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/\/login/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin;
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
        options.resultSelector || "div.table-torrents > table:first";
      let table = options.page.find(selector);
      // 获取种子列表行
      let rows = table.find("> tbody > tr");
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty;
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
        category: 1,
        progress: 11,
        status: 11
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

        // 发布时间
        if (
          cell.find("a[href*='created_at']").length ||
          cell.find("i.fa-clock").length
        ) {
          fieldIndex.time = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 大小
        if (
          cell.find("a[href*='size']").length ||
          cell.find("i.fa-file").length
        ) {
          fieldIndex.size = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 种子数
        if (
          cell.find("a[href*='seed']").length ||
          cell.find("i.fa-arrow-circle-up").length
        ) {
          fieldIndex.seeders = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 下载数
        if (
          cell.find("a[href*='leech']").length ||
          cell.find("i.fa-arrow-circle-down").length
        ) {
          fieldIndex.leechers = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 完成数
        if (
          cell.find("a[href*='complete']").length ||
          cell.find("i.fa-check-square").length
        ) {
          fieldIndex.completed = index;
          fieldIndex.author =
            index == fieldIndex.author ? -1 : fieldIndex.author;
          continue;
        }

        // 分类
        if (cell.is(".torrents-icon")) {
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

          let title = row.find("a.torrent-name");
          if (title.length == 0) {
            continue;
          }
          let link = title.attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          // 获取下载链接
          let url = row.find("a[href*='/download/']").attr("href");
          if (url.length == 0) {
            continue;
          }

          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          let data = {
            title: title.text().trim(),
            subTitle: this.getSubTitle(title, row).trim(),
            link,
            url: url,
            size:
              cells
                .eq(fieldIndex.size)
                .text()
                .trim() || 0,
            time:
              fieldIndex.time == -1
                ? ""
                : cells
                    .eq(fieldIndex.time)
                    .find("span[title]")
                    .attr("title") ||
                  cells.eq(fieldIndex.time).text().trim() ||
                  "",
            author:
              fieldIndex.author == -1
                ? ""
                : cells.eq(fieldIndex.author).text().trim() || "",
            seeders:
              fieldIndex.seeders == -1
                ? ""
                : cells.eq(fieldIndex.seeders).text().trim() || 0,
            leechers:
              fieldIndex.leechers == -1
                ? ""
                : cells.eq(fieldIndex.leechers).text().trim() || 0,
            completed:
              fieldIndex.completed == -1
                ? ""
                : cells.eq(fieldIndex.completed).text().trim() || 0,
            comments:
              fieldIndex.comments == -1
                ? ""
                : cells.eq(fieldIndex.comments).text().trim() || 0,
            site: site,
            tags: Searcher.getRowTags(site, row),
            entryName: options.entry.name,
            category:
              fieldIndex.category == -1
                ? null
                : this.getCategory(cells.eq(fieldIndex.category)),
            progress: this.getFieldValue(row, cells, fieldIndex, "progress"),
            status: this.getFieldValue(row, cells, fieldIndex, "status")
          };
          results.push(data);
        }
        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents;
        }
      } catch (error) {
        console.log(error);
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
      }

      return results;
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
        name: cell.find("i:first").attr("data-original-title"),
        link: cell.find("a:first").attr("href")
      };
      if (result.name) {
        result.name = result.name.replace(" torrent", "");
      }
      return result;
    }
    
    getFieldValue(row, cells, fieldIndex, fieldName, returnCell) {
      let parent = row;
      let cell = null;
      if (
        cells &&
        fieldIndex &&
        fieldIndex[fieldName] !== undefined &&
        fieldIndex[fieldName] !== -1
      ) {
        cell = cells.eq(fieldIndex[fieldName]);
        parent = cell || row;
      }

      let result = Searcher.getFieldValue(site, parent, fieldName);

      if (!result && cell) {
        if (returnCell) {
          return cell;
        }
        result = cell.text().trim();
      }
      if(result == "")return null;
      return result;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
