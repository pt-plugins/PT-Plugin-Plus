(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/\/User is not authorized/.test(options.responseText)) {
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
      // 获取种子列表行
      let rows = options.page.rows;
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有找到相关的种子`;
        return [];
      }
      let results = [];

      try {
        // 遍历数据行
        for (let index = 0; index < rows.length; index++) {
          let row = rows[index];
          let detail = row.resource_detail_info;

          let data = {
            title: detail.custom_title || detail.title,
            subTitle: detail.custom_subtitle || detail.subtitle,
            link: `${site.url}torrents/${row._id}`,
            url: `${site.url}api/torrents/download/${row._id}`,
            size: row.torrent_size,
            time: row.createdat,
            author: row.user.displayName || "",
            seeders: row.torrent_seeds,
            leechers: row.torrent_leechers,
            completed: row.torrent_finished,
            comments: 0,
            site: site,
            tags: null,
            entryName: options.entry.name,
            category: row.torrent_type
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
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
