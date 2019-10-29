(function(options) {
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
        options.resultSelector || "table[id='browse'] > tbody > tr[style*='padding-top:0px']"
      );
      let time_regex = /([A-Za-z]{3})\s(\d+)\s'(\d{2})/;
      // 用于定位每个字段所列的位置
      let fieldIndex = {
        //title
        title: 1,
        //downloadlink
        downloadlink: 1,
        // 时间
        time: 8,
        // 大小
        size: 10,
        // 上传人数
        seeders: 12,
        // 下载人数
        leechers: 13,
        // 完成人数
        completed: 11,
        // 评论人数
        comments: 6,
        // 发布人
        author: 7,
        category: 0
      };

      if (site.url.substr(-1) == "/") {
        site.url = site.url.substr(0, site.url.length - 1);
      }

      // 遍历数据行
      for (let index = 1; index < rows.length; index++) {
        const row = rows.eq(index);
        let cells = row.find(">td");
        let title = cells.eq(fieldIndex.title).find("a[href*='details.php?id=']").first();
        if (title.length == 0) {
          continue;
        }
        let titleStrings = title.text();
        let link = title.attr("href");
        if (link && link.substr(0, 4) !== "http") {
          link = `${site.url}/${link}`;
        }
        let url = "";
        url = cells.eq(fieldIndex.downloadlink).find("a[href*='/down.php/']").first().attr("href");
          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}/${url}`;
          }

        if (!url) {
          continue;
        }
        let time = cells.eq(fieldIndex.time).text().match(time_regex)[1];
        if(RegExp.$1 == "Jan") {
          time = "20"+RegExp.$3+"-01-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Feb") {
          time = "20"+RegExp.$3+"-02-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Mar") {
          time = "20"+RegExp.$3+"-03-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Apr") {
          time = "20"+RegExp.$3+"-04-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "May") {
          time = "20"+RegExp.$3+"-05-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Jun") {
          time = "20"+RegExp.$3+"-06-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Jul") {
          time = "20"+RegExp.$3+"-07-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Aug") {
          time = "20"+RegExp.$3+"-08-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Sep") {
          time = "20"+RegExp.$3+"-09-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Oct") {
          time = "20"+RegExp.$3+"-10-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Nov") {
          time = "20"+RegExp.$3+"-11-"+RegExp.$2+" 00:00";
        }
        if(RegExp.$1 == "Dec") {
          time = "20"+RegExp.$3+"-12-"+RegExp.$2+" 00:00";
        }
        let data = {
          title: titleStrings,
          link: link,
          url: url,
          size: cells.eq(fieldIndex.size).text() || 0,
          time: time,
          author: cells.eq(fieldIndex.author).text() || "",
          seeders:
            cells
              .eq(fieldIndex.seeders)
              .text(),
          leechers:
            cells
              .eq(fieldIndex.leechers)
              .text(),
          completed: cells.eq(fieldIndex.completed).text().match(/(\d+)/)[0] || 0,
          comments: cells.eq(fieldIndex.comments).find("a[href*='#startcomments']").text() || 0,
          site: site,
          entryName: options.entry.name,
          category: this.getCategory(cells.eq(fieldIndex.category)),
          tags: this.getTags(row, options.torrentTagSelectors)
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

      result.name = img.attr("title").match(/[^::]+/)[0];
      return result;
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
                name: item.name,
                color: item.color
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
