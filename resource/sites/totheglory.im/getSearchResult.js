(function (options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/takelogin\.php/.test(options.responseText)) {
        options.errorMsg = `[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (/没有种子|No [Tt]orrents?|Your search did not match anything|用准确的关键字重试/.test(options.responseText)) {
        options.errorMsg = `[${options.site.name}]没有搜索到相关的种子`;
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
      let rows = options.page.find(options.resultSelector || "table#torrent_table:last > tbody > tr");
      let time_regex = /(\d{4}-\d{2}-\d{2}[^\d]+?\d{2}:\d{2}:\d{2})/;
      let time_regen_replace = /-(\d{2})[^\d]+?(\d{2}):/;

      // 用于定位每个字段所列的位置
      let fieldIndex = {
        // 时间
        time: 4,
        // 大小
        size: 6,
        // 上传人数
        seeders: 8,
        // 下载人数
        leechers: 8,
        // 完成人数
        completed: 7,
        // 评论人数
        comments: 3,
        // 发布人
        author: 9,
        category: 0
      };

      if (site.url.substr(-1) == "/") {
        site.url = site.url.substr(0, site.url.length - 1);
      }

      // 遍历数据行
      for (let index = 1; index < rows.length; index++) {
        const row = rows.eq(index);
        let cells = row.find(">td");

        let title = row.find("div.name_left > a");
        if (title.length == 0) {
          continue;
        }
        let titleStrings = title.html().split("<br>");
        let link = title.attr("href");
        if (link && link.substr(0, 4) !== "http") {
          link = `${site.url}${link}`;
        }

        let values = link.split("/");
        let id = values[values.length - 2];
        let url = "";

        if (site.passkey && id) {
          // 格式：vvvid|||passkeyzz
          let key = (new Base64).encode("vvv" + id + "|||" + site.passkey + "zz");
          url = `https://${site.host}/rssdd.php?par=${key}&ssl=yes`;
        } else {
          url = row.find("a.dl_a").attr("href");
          if (url && url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }
        }

        if (!url) {
          continue;
        }

        let subTitle = "";
        if (titleStrings.length > 0) {
          subTitle = $("<span>").html(titleStrings[1]).text();
        }

        let data = {
          title: $("<span>").html(titleStrings[0]).text(),
          subTitle: subTitle || "",
          link,
          url: url,
          size: cells.eq(fieldIndex.size).html() || 0,
          time: cells.eq(fieldIndex.time).html().match(time_regex)[1].replace(time_regen_replace, "-$1 $2:") || cells.eq(fieldIndex.time).text(),
          author: cells.eq(fieldIndex.author).text() || "",
          seeders: cells.eq(fieldIndex.seeders).text().split("/")[0] || 0,
          leechers: cells.eq(fieldIndex.leechers).text().split("/")[1] || 0,
          completed: cells.eq(fieldIndex.completed).text() || 0,
          comments: cells.eq(fieldIndex.comments).text() || 0,
          site: site,
          entryName: options.entry.name,
          category: this.getCategory(cells.eq(fieldIndex.category)),
          tags: this.getTags(row, options.torrentTagSelectors)
        };
        results.push(data);
      }

      if (results.length == 0) {
        options.errorMsg = `[${options.site.name}]没有搜索到相关的种子`;
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
            let result = row.find(item.selector)
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
  let parser = new Parser(options)
  options.results = parser.getResult()
  console.log(options.results);
})(options)
