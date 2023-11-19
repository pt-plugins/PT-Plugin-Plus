(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/auth_form/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }
      options.isLogged = true;
      if (
        /没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(
          options.responseText
        )
      ) {
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
        options.resultSelector || "table.torrent_table:last > tbody > tr"
      );
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return results;
      }
      // 获取表头
      let header = rows.eq(0).find("th,td");

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        time: 3,
        size: 4,
        seeders: 6,
        leechers: 7,
        completed: 5
        // comments: 3,
        // author: 9
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      try {
        // 遍历数据行
        for (let index = 1; index < rows.length; index++) {
          const row = rows.eq(index);
          let cells = row.find(">td");

          let title = row.find("a[href*='torrents.php?id=']").first();
          if (title.length == 0) {
            continue;
          }

          let subTitle = row.find("div.torrent_info").first();

          // 获取下载链接
          let url = row
            .find("a[href*='torrents.php?action=download'][title*='Download']")
            .first();

          if (url.length == 0) {
            continue;
          }
          let id = url.attr('href').match(/id=(\d+)&/)[1];
          url = url.attr("href");

          if (url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          let link = title.attr("href");
          link = `${link}&torrentid=${id}`;
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          let time =
            fieldIndex.time == -1
              ? ""
              : cells
                  .eq(fieldIndex.time)
                  .find("span[title],time[title]")
                  .attr("title") ||
                cells.eq(fieldIndex.time).text() ||
                "";
          // if (time) {
          //   time += ":00";
          // }

          let data = {
            id,
            title: title.text() + ' / ' + subTitle.text(),
            // subTitle: subTitle.text(),
            link,
            url: url,
            size: cells.eq(fieldIndex.size).html() || 0,
            time: time,
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
            tags: this.getTags(row),
            status: subTitle.text().includes("Seeding") ? 2 : null,
            progress: subTitle.text().includes("Seeding") ? 100 : null,
            site: site,
            entryName: options.entry.name
            // category: this.getCategory(cells.find("a[href*='filter_cat']"))
          };
          results.push(data);
        }
        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        }
      } catch (error) {
        console.error(error);
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack; //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }
      console.log(results);
      return results;
    }
    getTags(row){
      var query = row.find("strong:contains('Freeleech'), strong:contains('2x'), strong:contains('%')");
      var BASE_TAG_COLORS = {
        // 免费下载
        Free: "blue",
        // 免费下载 + 2x 上传
        "2xFree": "green",  
        // 2x 上传
        "2xUp": "lime",
        // 2x 上传 + 50% 下载
        "2x50%": "light-green",
        // 25% 下载
        "25%": "purple",
        // 30% 下载
        "30%": "indigo",
        // 35% 下载
        "35%": "indigo darken-3",
        // 50% 下载
        "50%": "orange",
        // 70% 下载
        "70%": "blue-grey",
        // 75% 下载
        "75%": "lime darken-3",
        // 仅 VIP 可下载
        VIP: "orange darken-2",
        // 禁止转载
        "⛔️": "deep-orange darken-1"
      };
      if(query.length > 0) {
          query = query.text().replace(' ','').replace('↓','').replace('Freeleech','Free');
          if (query.indexOf("!"))
            query = query.substring(0,query.indexOf("!"));
          var result = [{
            name: query,
            color: BASE_TAG_COLORS[query]
          }]
          return result;
      }
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  // console.log(options.results);
})(options, Searcher);
