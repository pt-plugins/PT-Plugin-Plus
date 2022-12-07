if (!"".getQueryString) {
  String.prototype.getQueryString = function(name, split) {
    if (split == undefined) split = "&";
    var reg = new RegExp(
        "(^|" + split + "|\\?)" + name + "=([^" + split + "]*)(" + split + "|$)"
      ),
      r;
    if ((r = this.match(reg))) return decodeURI(r[2]);
    return null;
  };
}

(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/login\.php/.test(options.responseText)) {
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
      let site = options.site;
      let results = [];
      // 获取种子列表行
      let rows = options.page.find(options.resultSelector);
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return results;
      }

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        time: 1,
        size: 2,
        seeders: 3,
        leechers: 4,
        completed: 5,
        comments: 6,
        author: 7,
        category: 8,
        title: 0
      };

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      try {
        // 遍历数据行
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);
          let timeStrMatch = row.find("div.torrent-h3 > span").text().split("-")[0].replace('Il y a','');
          let timeStr = timeStrMatch.trim();
          let cells = [];
          cells[2] = row.find("div.torrent-h3 > span").text().split("-")[1].trim().replace('o','B');
          cells[3] = row.find("div.seeders").text().replace('Seeders','').trim();
          cells[4] = row.find("div.leechers").text().replace('Leechers','').trim();
          cells[5] = row.find("div.completed").text().replace('Complétés','').trim();
          cells[6] = row.find("div.comments").text().replace('Commentaires','').trim();
          cells[7] = row.find("div.uploader a.username").text().trim();
          cells[8] = row.find("div.category img").attr("title");
          cells[9] = row.find("div.completed").text().replace('Complétés','').trim();
          let title = row.find("div.torrent-h3 h3 a");
          if (title.length == 0) {
            continue;
          }

          let link = title.attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          // 获取下载链接
          let url = row.find("a[href*='/torrents/download/']:first").attr("href");
          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          let data = {
            title: title.text(),
            subTitle: "",
            link,
            url,
            size: cells[fieldIndex.size] || 0,
            time: this.getTime(timeStr),
            author:
              fieldIndex.author == -1
                ? ""
                : cells[fieldIndex.author] || "",
            seeders:
              fieldIndex.seeders == -1
                ? ""
                : cells[fieldIndex.seeders] || 0,
            leechers:
              fieldIndex.leechers == -1
                ? ""
                : cells[fieldIndex.leechers] || 0,
            completed:
              fieldIndex.completed == -1
                ? ""
                : cells[fieldIndex.completed] || 0,
            comments:
              fieldIndex.comments == -1
                ? ""
                : cells[fieldIndex.comments] || 0,
            site: site,
            entryName: options.entry.name,
            category:
              fieldIndex.category == -1
                ? ""
                : cells[fieldIndex.category] || "",
            tags: this.getTags(row, options.torrentTagSelectors)
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
        /((\d+).+?(Minute|Heure|Jour|Moi|Année)s?.*?(\,|and))?.*?(\d+).+?(Minute|Heure|Jour|Moi|Année)s?/
      );
      let milliseconds = 0;
      if (timeRegex) {
        if (timeRegex[1] == undefined) {
          milliseconds = this.getMilliseconds(timeRegex[5], timeRegex[6]);
        } else {
          milliseconds = this.getMilliseconds(timeRegex[2], timeRegex[3]) + this.getMilliseconds(timeRegex[5], timeRegex[6]);
        }
      }
      let timeStamp = Date.now() - milliseconds;
      let date = new Date(timeStamp);
      return date.toISOString();
    }

    getMilliseconds(num, unit) {
      let milliseconds = 0;
      milliseconds = num*60*1000;
      if(unit == "Minute") {return milliseconds;}
      milliseconds = milliseconds*60;
      if(unit == "Heure") {return milliseconds;}
      milliseconds = milliseconds*24;
      if(unit == "Jour") {return milliseconds;}
      milliseconds = milliseconds*30;
      if(unit == "Moi") {return milliseconds;}
      milliseconds = milliseconds*12;
      return milliseconds;
    }

    /**
     * 获取标签
     * @param {*} row
     * @param {*} selectors
     * @return array
     */
    getTags(row, selectors) {
      let tags = [];
      if (selectors && selectors.length > 0) {
        // 使用 some 避免错误的背景类名返回多个标签
        selectors.some(item => {
          if (item.selector) {
            let result = row.find(item.selector);
            if (result.length) {
              tags.push({
                name: "Free",
                color: "blue"
              });
              return true;
            }
          }
        });
      }
      return tags;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
