(function(options, Searcher) {
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
        options.resultSelector ||
          "div.visitedlinks:last > div[class=torrentrow]"
      );
      let time_regex = /(\d{2}:\d{2}:\d{2}[^\d]+?\d{2}\/\d{2}\/\d{4})/;
      let time_regen_replace1 = /(\d{2}:\d{2}:\d{2})[^\d]+?(\d{2}\/\d{2}\/\d{4})/;
      let time_regen_replace2 = /(\d{2})\/(\d{2})\/(\d{4})/;

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        //title
        title: 1,
        //downloadlink
        downloadlink: 3,
        // 时间
        time: 5,
        // 大小
        size: 6,
        // 上传人数
        seeders: 8,
        // 下载人数
        leechers: 9,
        // 完成人数
        completed: 7,
        // 评论人数
        comments: 4,
        // 发布人
        author: 10,
        category: 0
      };

      if (site.url.substr(-1) == "/") {
        site.url = site.url.substr(0, site.url.length - 1);
      }

      // 遍历数据行
      for (let index = 0; index < rows.length; index++) {
        const row = rows.eq(index);
        let cells = row.find(">div");
        let titleStrings = cells
          .eq(fieldIndex.title)
          .find("a")
          .attr("title");
        let title = cells
          .eq(fieldIndex.title)
          .find("a")
          .first();
        if (title.length == 0) {
          continue;
        }
        let link = title.attr("href");
        if (link && link.substr(0, 4) !== "http") {
          link = `${site.url}/${link}`;
        }
        let id = link.getQueryString("id");
        let url = "";
        if (site.passkey && id) {
          url = `https://${site.host}/download.php?id=${id}&passkey=${site.passkey}`;
        } else {
          url = cells
            .eq(fieldIndex.downloadlink)
            .find("a")
            .first()
            .attr("href");
          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}/${url}`;
          }
        }

        if (!url) {
          continue;
        }
        let subTitle = "";
        let data = {
          title: $("<span>")
            .html(titleStrings)
            .text(),
          subTitle: subTitle || "",
          link,
          url: url,
          size: cells.eq(fieldIndex.size).text() || 0,
          time: cells
            .eq(fieldIndex.time)
            .html()
            .replace("<br>", " ")
            .match(time_regex)[1]
            .replace(time_regen_replace1, "$2 $1")
            .replace(time_regen_replace2, "$3-$2-$1"),
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
