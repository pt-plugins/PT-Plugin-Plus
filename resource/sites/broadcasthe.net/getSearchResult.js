(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/auth_form/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
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
      let site = options.site;
      let results = [];
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
        time: -1,
        size: -1,
        seeders: -1,
        leechers: -1,
        completed: -1,
        comments: -1,
        author: -1
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      // 获取字段所在的列
      for (let index = 0; index < header.length; index++) {
        const cell = header.eq(index);

        // 大小
        if (cell.find("a[href*='order_by=size']").length) {
          fieldIndex.size = index;
          continue;
        }

        // 种子数
        if (cell.find("a[href*='order_by=seeders']").length) {
          fieldIndex.seeders = index;
          continue;
        }

        // 下载数
        if (cell.find("a[href*='order_by=leechers']").length) {
          fieldIndex.leechers = index;
          continue;
        }

        // 完成数
        if (cell.find("a[href*='order_by=snatched']").length) {
          fieldIndex.completed = index;
          continue;
        }
      }

      try {
        // 遍历数据行
        for (let index = 1; index < rows.length; index++) {
          const row = rows.eq(index);
          let cells = row.find(">td");

          // 标题
          let title = row.find("[style='float:none;']").first().attr("title");
          
          // 链接
          let link = row.find("[title='View Torrent']").first().attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          // 获取下载链接
          let url = row.find("[title='Download']").first().attr("href");
          if (url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          // 分类
          let category = row.find("a[href*='filter_cat']").children().first().attr("title");

          // 时间
          let timeStrMatch = row.find("div:contains('Added:')").text().match(/Added:(.+)ago/);
          let timeStr = (timeStrMatch && timeStrMatch.length >=2) ? timeStrMatch[1].trim() : "";

          let data = {
            title,
            link,
            url,
            size:
              fieldIndex.size == -1
                ? ""
                : cells.eq(fieldIndex.size).text() || 0,
            time: this.getTime(timeStr),
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
                : cells.eq(fieldIndex.comments).text() || 0,
            site,
            entryName: options.entry.name,
            category
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

      return results;
    }

    getTime(timeStr) {
      let timeRegex = timeStr.match(
        /((\d+).+?(minute|hour|day|week|month|year)s?.*?(\,|and))?.*?(\d+).+?(minute|hour|day|week|month|year)s?/
      );
      let milliseconds = 0;
      if (timeRegex) {
        if (timeRegex[1] == undefined) {
          milliseconds = this.getMilliseconds(timeRegex[5], timeRegex[6]);
        } else {
          milliseconds = this.getMilliseconds(timeRegex[2], timeRegex[3]) + this.getMilliseconds(timeRegex[5], timeRegex[6]);
        }
      }
      console.log(timeRegex);
      let timeStamp = Date.now() - milliseconds;
      let date = new Date(timeStamp);
      return date.toISOString();
    }

    getMilliseconds(num, unit) {
      let milliseconds = 0;
      milliseconds = num*60*1000;
      if(unit == "minute") {return milliseconds;}
      milliseconds = milliseconds*60;
      if(unit == "hour") {return milliseconds;}
      milliseconds = milliseconds*24;
      if(unit == "day") {return milliseconds;}
      milliseconds = milliseconds*7;
      if(unit == "week") {return milliseconds;}
      milliseconds = milliseconds*30/7;
      if(unit == "month") {return milliseconds;}
      milliseconds = milliseconds*12;
      return milliseconds;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
