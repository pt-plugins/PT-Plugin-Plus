(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/loginSection/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (/对不起，没有您搜索的相关结果/.test(options.responseText)) {
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
      let site = options.site;
      let selector = options.resultSelector;
      let rows = options.page.find(selector);
      let results = [];

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      try {
        // 遍历数据行
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);
          let id = row.attr("id").replace("dl_torrent_", "");
          let url = `${site.url}download.php?id=${id}`;
          let link = `${site.url}details.php?id=${id}`;

          let data = {
            id,
            title: row.find(".title_chs").text(),
            subTitle: row.find(".title_eng").text(),
            link,
            url,
            size: row.find(".torrent_size").text(),
            time: this.getTime(row.find(".torrent_added")),
            author: "",
            seeders: this.getTorrentCount(
              row
                .find(".torrent_count.strong")
                .eq(0)
                .text()
            ),
            leechers: this.getTorrentCount(
              row
                .find(".torrent_count.strong")
                .eq(1)
                .text()
            ),
            completed: -1,
            comments: 0,
            site: site,
            tags: Searcher.getRowTags(site, row),
            entryName: options.entry.name,
            category: null
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

    getTorrentCount(text) {
      return text == "---" ? 0 : text;
    }

    /**
     * 获取时间
     * @param {*} el
     */
    getTime(el) {
      let time = $("<span>")
        .html(el.html().replace("<br>", " "))
        .text();
      return time || "";
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
