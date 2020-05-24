/**
 * @see https://github.com/Rhilip/PT-help/blob/master/docs/js/ptsearch.user.js
 */
(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/login|未登录/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (/找到0条结果/.test(options.responseText)) {
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

      let site = options.site;
      let results = [];

      const time_regex = /(\d{4}-\d{2}-\d{2}[^\d]+?\d{2}:\d{2}:\d{2})/;

      // 以下解析方法修改自 ： https://github.com/Rhilip/PT-help/blob/master/docs/js/ptsearch.user.js#L216_L241
      let tr_list = options.page.find("#torrents_table > tbody > tr:gt(0)");
      for (let i = 0; i < tr_list.length; i++) {
        let torrent_data_raw = tr_list.eq(i);

        // 标题信息
        let _title_tag = torrent_data_raw.find("a[href*='hit']:eq(0)");
        let _title = _title_tag.attr("title") || _title_tag.text();

        let _sub_title_tag = _title_tag.siblings("span");
        let _sub_title = _sub_title_tag
          ? _sub_title_tag.attr("title") || _sub_title_tag.text()
          : "";

        // 下载链接 （该站搜索页点击下载按钮是一个JavaScript事件）
        let details_tag = torrent_data_raw.find('a[href^="details"]');
        let details_link = details_tag.attr("href");
        let _download_url =
          site.url +
          details_link.replace("details", "download") +
          "&trackerssl=1";

        // 定位种子大小，做种和优惠tag
        let _size_peer_block = torrent_data_raw.find(
          ".rowfollow.vcenter.nowrap"
        );
        let _size_tag = _size_peer_block.find("center");
        let _seeders_tag = _size_peer_block.find("span.badge").eq(0);
        let _leechers_tag = _size_peer_block.find("span.badge").eq(1);
        let _completed_tag = torrent_data_raw.find(
          "a[href^='viewsnatches.php?id=']"
        );
        let _buff_tag = _title_tag.parent("td.embedded"); // 转交给 this.getTags() 处理

        // 发布时间
        let _date_tag = torrent_data_raw.find("div.small").filter(function() {
          return time_regex.test(
            $(this).html()
          );
        });
        let _date = ((_date_tag.html().match(time_regex) || ["", "0000-00-00 00:00:00"] )[1]).trim();

        // 做种，评论信息
        let _tag_comments = torrent_data_raw.find("a[href$='#startcomments']");

        let _comments = 0;
        if (_tag_comments) {
          _comments =
            _tag_comments
              .text()
              .trim()
              .replace(",", "") || 0;
        }

        let _category = torrent_data_raw
          .find("div.category_text")
          .text()
          .trim();

        let data = {
          title: _title,
          subTitle: _sub_title,
          link: site.url + _title_tag.attr("href"),
          url: _download_url,
          size: _size_tag.text() || 0,
          time: _date,
          // author,  // 该站种子列表无author信息
          seeders: _seeders_tag.text().replace(",", "") || 0,
          leechers: _leechers_tag.text().replace(",", "") || 0,
          completed: _completed_tag
            ? _completed_tag.text().replace(",", "")
            : 0,
          comments: _comments,
          site: site,
          tags: this.getTags(_buff_tag, options.torrentTagSelectors),
          entryName: options.entry.name,
          category: _category
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
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
