/**
 * 通用搜索解析脚本
 */
(function (options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      // 判断是否已登录
      if (
        options.entry.loggedRegex &&
        !new RegExp(options.entry.loggedRegex, "").test(options.responseText)
      ) {
        // 需要登录后再搜索
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }

      options.isLogged = true;

      this.haveData = true;
      this.site = options.site;
    }

    /**
     * 获取搜索结果
     */
    getResult() {
      if (!this.haveData) {
        return [];
      }
      let selector = options.resultSelector;
      let dataRowSelector = options.entry.dataRowSelector || "> tbody > tr";
      selector = selector.replace(dataRowSelector, "");
      // 获取数据表格
      let table = options.page.find(selector);
      // 获取种子列表行
      let rows = table.find(dataRowSelector);
      if (rows.length === 0) {
        // 没有定位到种子列表，或没有相关的种子
        options.status = ESearchResultParseStatus.torrentTableIsEmpty;
        return [];
      }
      let results = [];
      let beginRowIndex = options.entry.firstDataRowIndex || 0;

      try {
        // 遍历数据行
        for (let index = beginRowIndex; index < rows.length; index++) {
          const row = rows.eq(index);

          let torrentId = row.attr("id");
          // 跳过无种子ID的行
          if (!torrentId) {
            continue;
          } else {
            torrentId = torrentId.match(/tdr-(\d+)/)[1];
          }

          // 下载链接，无法下载的VIP种子置为ONLY_FOR_VIP
          let url = row.find(".directDownload").attr("href");
          if (!url) {
            url = "ONLY_FOR_VIP"
          }

          // 解析种子大小
          let size = row.find("> td:eq(4)").text().split("[")[1].replace("]", "");

          // 解析发布时间和发布者
          let addedAndUploader = row.find("> td:eq(5)").text().split("[");
          let time = addedAndUploader[0];
          let author = addedAndUploader[1].replace("]", "");

          // 做种/下载/完成
          let seedLeechSnatched = row.find("> td:eq(6) > p");
          let seeders = parseInt(seedLeechSnatched.eq(0).text());
          let leechers = parseInt(seedLeechSnatched.eq(1).text());
          let completed = parseInt(seedLeechSnatched.eq(2).text());

          let data = {
            title: row.find(".torTitle").text(),
            subTitle: row.find(".torRowDesc").text(),
            link: this.getFullURL(`/t/${torrentId}`),
            url: this.getFullURL(url),
            size: size || 0,
            time: time,
            author: author,
            seeders: seeders,
            leechers: leechers,
            completed: completed,
            comments: row.find(" >td:eq(2)").text().match(/(\d+) comments/)[1],
            site: this.site,
            tags: Searcher.getRowTags(this.site, row),
            entryName: options.entry.name
          };
          results.push(data);
        }
      } catch (error) {
        // 获取种子信息出错
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
      }

      // 没有搜索到相关的种子
      if (results.length === 0 && !options.errorMsg) {
        options.status = ESearchResultParseStatus.noTorrents;
      }

      return results;
    }

    /**
     * 获取完整的URL地址
     * @param {string} url
     */
    getFullURL(url) {
      let URL = PTServiceFilters.parseURL(this.site.url);
      if (url.substr(0, 2) === "//") {
        url = `${URL.protocol}${url}`;
      } else if (url.substr(0, 1) === "/") {
        url = `${URL.origin}${url}`;
      } else if (url.substr(0, 4) !== "http") {
        url = `${URL.origin}/${url}`;
      }
      return url;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
