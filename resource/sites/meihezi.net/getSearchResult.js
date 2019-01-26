/**
 * @see https://github.com/Rhilip/PT-help/blob/master/docs/js/ptsearch.user.js
 */
(function (options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/takelogin\.php/.test(options.responseText)) {
        options.errorMsg = `[${options.site.name}]需要登录后再搜索`;
        return;
      }
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

      let time_regex = /(\d{4}-\d{2}-\d{2}[^\d]+?\d{2}:\d{2}:\d{2})/;
      let time_regen_replace = /-(\d{2})[^\d]+?(\d{2}):/;
      let site = options.site;
      let results = [];

      // 继承自蚂蚁的使用大量colspan,rowspan的表格处理
      let tr_list = options.page.find(".torrents > tbody > tr:gt(1)"); // 前两行都是表题栏，不要
      for (let i = 0; i < tr_list.length; i += 2) { // 每两行数据组成一个种子资源的完整信息
        let torrent_data_raw_1 = tr_list.eq(i);
        let torrent_data_raw_2 = tr_list.eq(i + 1);
        let _tag_name = torrent_data_raw_1.find("a[href$='hit=1']");

        // 确定日期tag，因用户在站点设置中配置及站点优惠信息的情况的存在，此处dom结构会有不同
        // 此外多数站点对于 seeders, leechers, completed 没有额外的定位信息，故要依赖于正确的日期tag
        let _tag_date, _date;
        _tag_date = torrent_data_raw_2.find("span").filter(function () {
          return time_regex.test($(this).attr("title"));
        }).last().parent("td");
        if (/[分时天月年]/.test(_tag_date.text())) {
          _date = _tag_date.children("span").attr("title");
        } else {
          _tag_date = torrent_data_raw_2.find("td").filter(function () {
            return time_regex.test($(this).text());
          }).last();
          _date = _tag_date.text().match(time_regex)[1].replace(/-(\d{2}) ?(\d{2}):/, "-$1 $2:");
        }

        let _tag_size = _tag_date.next("td");
        let _tag_seeders = torrent_data_raw_1.find("a[href$='#seeders']");
        let _tag_leechers = torrent_data_raw_1.find("a[href$='#leechers']");
        let _tag_completed = torrent_data_raw_1.find("a[href^='viewsnatches.php']");

        // table_append({
        //   "site": site,
        //   "name": _tag_name.attr("title") || _tag_name.text(),
        //   "link": "http://hdstreet.club/" + _tag_name.attr("href"),
        //   "pubdate": Date.parse(_date),
        //   "size": FileSizetoLength(_tag_size.text()),
        //   "seeders": _tag_seeders.text().replace(',', '') || 0,
        //   "leechers": _tag_leechers.text().replace(',', '') || 0,
        //   "completed": _tag_completed.text().replace(',', '') || 0
        // });

        let link = site.url + _tag_name.attr("href");
        let id = link.getQueryString("id");
        let url = `${site.url}download.php?id=${id}` + (site.passkey ? "&passkey=" + site.passkey : "") + "&https=1";
        let author = torrent_data_raw_1.find("td:last").text();

        let data = {
          title: _tag_name.attr("title") || _tag_name.text(),
          subTitle: this.getSubTitle(_tag_name),
          link: site.url + _tag_name.attr("href"),
          url: url,
          size: _tag_size.text() || 0,
          time: _date,
          author,
          seeders: _tag_seeders.text().replace(',', '') || 0,
          leechers: _tag_leechers.text().replace(',', '') || 0,
          completed: _tag_completed.text().replace(',', '') || 0,
          comments: _tag_date.prev("td").text().replace(',', '') || 0,
          site: site,
          tags: this.getTags(torrent_data_raw_1, options.torrentTagSelectors),
          entryName: options.entry.name,
          category: this.getCategory(torrent_data_raw_1.find("td:first"))
        };
        results.push(data);
      }

      return results;
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
        selectors.forEach(item => {
          if (item.selector) {
            let result = row.find(item.selector)
            if (result.length) {
              tags.push({
                name: item.name,
                color: item.color
              });
            }
          }
        });
      }
      return tags;
    }

    /**
     * 获取副标题
     * @param {*} title 
     * @param {*} row 
     */
    getSubTitle(title, row) {
      let subTitle = title.parent().html().split("<br>");
      if (subTitle && subTitle.length > 1) {
        subTitle = $("<span>").html(subTitle[subTitle.length - 1]).text();
      } else {
        subTitle = "";
      }

      return subTitle || "";
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

      if (img.length) {
        result.name = img.attr("title");
      } else {
        result.name = link.text();
      }
      return result;
    }
  }


  let parser = new Parser(options)
  options.results = parser.getResult()
  console.log(options.results);

})(options)