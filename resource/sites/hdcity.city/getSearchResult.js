/**
 * @see https://github.com/Rhilip/PT-help/blob/master/docs/js/ptsearch.user.js
 */
(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/login/.test(options.responseText)) {
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
      if (!this.haveData) {
        return [];
      }

      // 按照 Legacy Inverse 种子列表风格解析种子列表
      let site = options.site;
      let results = [];

      // 首先移除搜索表单，因为里面含有我们使用的selector
      options.page.find("form").remove();

      let tr_list = options.page.find("div.text, div.text_alt");
      for (let i = 0; i < tr_list.length; i++) {
        let torrent_data_raw = tr_list.eq(i);

        let _name_tag = torrent_data_raw.find("a.torname");

        // 主标题 应该是英文名吧，被包裹在一个 <span style="color:#777"> 中
        let _title = torrent_data_raw.find("span[style='color:#777']").text();

        // 下载链接
        let download_tag = torrent_data_raw.find("a[href^=download]");
        let url = `${site.url}${download_tag.attr("href")}` + "&https=1";

        // 定位种子大小和优惠tag
        let _size_buff_tag = torrent_data_raw.find(
          "> table > tbody > tr > td:nth-child(7)"
        );
        let _size_tag = _size_buff_tag.find("nobr:nth-child(1)");
        let _buff_tag = _size_buff_tag.find("nobr:nth-child(3)"); // 转交给 this.getTags() 处理

        // 发布时间
        let _date_tag = torrent_data_raw.find(
          " > table > tbody > tr > td:nth-child(8)"
        );
        let _date = _date_tag.text();

        // 做种，评论信息
        let _tag_seeders = torrent_data_raw.find("a[href$='#seeders']");
        let _tag_leechers = torrent_data_raw.find("a[href$='#leechers']");
        let _tag_completed = torrent_data_raw.find(
          "a[href^='viewsnatches']:first"
        );
        let _tag_comments = torrent_data_raw.find("a[href$='#startcomments']");

        let _comments = 0;
        if (_tag_comments) {
          _comments = _tag_comments.text().replace(",", "") || 0;
        }

        let data = {
          title: _title,
          subTitle: _name_tag.text(),
          link: site.url + _name_tag.attr("href"),
          url: url,
          size: _size_tag.text() || 0,
          time: _date,
          // author,  // 该站种子列表无author信息
          seeders: _tag_seeders.text().replace(",", "") || 0,
          leechers: _tag_leechers.text().replace(",", "") || 0,
          completed: _tag_completed.text().replace(",", "") || 0,
          comments: _comments,
          site: site,
          tags: this.getTags(_buff_tag, options.torrentTagSelectors),
          entryName: options.entry.name,
          category: this.getCategory(torrent_data_raw.find("td:first"))
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
        result.name = img.attr("title") || img.attr("alt");
      } else {
        result.name = link.text();
      }
      return result;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
