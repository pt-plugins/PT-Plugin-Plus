/**
 * NexusPHP 默认搜索结果解析类
 */
(function (options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/takelogin\.php|<form action="\?returnto=/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (
        /没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(
          options.responseText
        )
      ) {
        options.status = ESearchResultParseStatus.noTorrents; // `[${options.site.name}]没有搜索到相关的种子`;
        return;
      }

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
      let site = options.site;
      let site_url_help = PTServiceFilters.parseURL(site.url);
      let selector = options.resultSelector || ".torrent-table-for-spider";
      let table = options.page.find(selector);
      // 获取种子列表行
      let rows = table.find("> .torrent-table-sub-info");
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return [];
      }
      let results = [];

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      try {
        // 遍历数据行
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);
          let title = row.find(".torrent-info-text-name");
          if (title.length == 0) {
            continue;
          }
          let link = title.attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          // 获取下载链接
          let url = row.find(".torrent-manage a[href^='download.php?id=']").attr("href");
          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          if (!url) {
            continue;
          }

          url = url +
            (site && site.passkey ? "&passkey=" + site.passkey : "");

          let data = {
            title: title.text(),
            subTitle: row.find('.torrent-info-text-small_name').text() || "",
            link,
            url,
            size: row.find('.torrent-info-text-size').text() || 0,
            time: row.find('.torrent-info-text-added > span').attr('title') || "",
            author: row.find('.torrent-info-text-author').text() || "",
            seeders: row.find('.torrent-info-text-seeders').text().trim() || 0,
            leechers: row.find('.torrent-info-text-leechers').text().trim() || 0,
            completed: row.find('.torrent-info-text-finished').text().trim() || 0,
            comments: 0, // 暂无评论数
            site: site,
            tags: Searcher.getRowTags(this.site, row),
            entryName: options.entry.name,
            category: this.getCategory(row),
            progress: Searcher.getFieldValue(this.site, row, "progress"),
            status: Searcher.getFieldValue(this.site, row, "status"),
            imdbId: this.getIMDbId(row)
          };

          results.push(data);
        }
      } catch (error) {
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
        //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }

      return results;
    }

    /**
     * 获取IMDbId
     * @param {*} row
     */
    getIMDbId(row)
    {
      let imdbId = Searcher.getFieldValue(this.site, row, "imdbId");
      if (imdbId) {
        return imdbId;
      }

      try {
        let link = row.find("a[href*='imdb.com/title/tt']").first().attr("href");
        if (link)
        {
          imdbId = link.match(/(tt\d+)/);
          if (imdbId)
            return imdbId[0];
        }
      } catch (error){
        console.log(error)
        return null;
      }
      return null;
    }

    /**
     * 获取分类
     * @param {*} row 当前行
     */
    getCategory(row) {
      let result = {
        name: "",
        link: ""
      };
      let link = row.find("> .torrent-cat > a");
      let img = link.find("img:first");

      if (link.length) {
        result.link = link.attr("href");
        if (result.link.substr(0, 4) !== "http") {
          result.link = options.site.url + result.link;
        }
      }

      if (img.length) {
        result.name = img.attr("alt");
      } else {
        result.name = link.text();
      }
      return result;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
