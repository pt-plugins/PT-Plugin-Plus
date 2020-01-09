(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/login\.php/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (/No torrents here/.test(options.responseText)) {
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
      let rows = options.page.find(options.resultSelector);

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        title: 2,
        // 时间
        time: 6,
        // 大小
        size: 7,
        // 上传人数
        seeders: 9,
        // 下载人数
        leechers: 10,
        // 完成人数
        completed: 11,
        // 评论人数
        comments: 3,
        // 发布人
        author: 8,
        category: 0
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      // 遍历数据行
      for (let index = 2; index < rows.length; index += 2) {
        const row = rows.eq(index);
        let cells = row.find(">td");

        let title = cells.eq(fieldIndex.title).find("a[href*='details.php']");
        if (title.length == 0) {
          continue;
        }
        let link = title.attr("href");
        if (link && link.substr(0, 4) !== "http") {
          link = `${site.url}${link}`;
        }

        let url = row.find("a[href*='download.php']").attr("href");
        if (url && url.substr(0, 4) !== "http") {
          url = `${site.url}${url}`;
        }

        let dateString = cells
          .eq(fieldIndex.time)
          .text()
          .replace("  ", " ");
        let dayStringArray = dateString.split(" ")[1].split("/");
        let time = dateString.split(" ")[0];

        let data = {
          title: title.text(),
          subTitle: "",
          link,
          url: url,
          size: cells.eq(fieldIndex.size).html() || 0,
          time: `${dayStringArray[2]}-${dayStringArray[1]}-${dayStringArray[0]} ${time}`,
          author: cells.eq(fieldIndex.author).text() || "",
          seeders: cells.eq(fieldIndex.seeders).text() || 0,
          leechers: cells.eq(fieldIndex.leechers).text() || 0,
          completed: cells.eq(fieldIndex.completed).text() || 0,
          comments: cells.eq(fieldIndex.comments).text() || 0,
          site: site,
          entryName: options.entry.name,
          category: this.getCategory(cells.eq(fieldIndex.category)),
          tags: Searcher.getRowTags(site, row),
          progress: Searcher.getFieldValue(site, row, "progress"),
          status: Searcher.getFieldValue(site, row, "status")
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
      if (result.link && result.link.substr(0, 4) !== "http") {
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
