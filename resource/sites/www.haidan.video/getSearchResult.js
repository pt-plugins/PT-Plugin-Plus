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
      if (!this.haveData) return [];
      let site = options.site;
      let torrents = options.page.find(".group_content");
      let results = [];
      for (let i = 0; i < torrents.length; i++) {
        let torrent = torrents.eq(i);
        let items = torrent.find(".torrent_item");
        let pre_title = torrent.find(".video_name_str").text();
        for (let j = 0; j < items.length; j++) {
          let field = {
            title: -1,
            subTitle: -1,
            link: -1,
            url: -1,
            size: -1,
            time: -1,
            author: -1,
            seeders: -1,
            leechers: -1,
            completed: -1,
            //comments: -1,
            site: site,
            tags: [],
            entryName: options.entry.name,
            //category: "当前分类信息，如果指定，则需要一个对象 {name: '分类名称', link: '分类连接地址(可选)'}"
          };
          let item = items.eq(j);
          field.title = pre_title + "(" + (j + 1).toString() + ")";
          field.subTitle = item.find(".torrent_name_col a").text();
          field.link = site.url + item.find(".torrent_name_col a").attr("href");
          field.seeders = item.find(".seeder_col").text();
          field.leechers = item.find(".leecher_col").text();
          field.completed = item.find(".snatched_col").text();
          field.subTitle = item.find(".torrent_name_col a").text();
          field.size = item.find(".video_size").text();
          field.author = item.find(".username-center a b").text();
          field.url = site.url + item.find(".fa-download").parent().attr("href");
          field.time = item.find(".time_col span[title]").text();
          field.tags = Searcher.getRowTags(site, item);
          let listtags = item.find("label");
          for (let k = 0; k < listtags.length; k++) {
            let tag = {
              name: listtags.eq(k).find("b").text(),
              title: listtags.eq(k).find("b").text(),
              color: listtags.eq(k).get(0).style["background-color"]
            }
            field.tags.push(tag);
          }
          //field.category = item.find(".img_blurry a").attr("href");
          results.push(field);
        }
      }
      return results;
    }
  }
  let parser = new Parser(options);
  options.results = parser.getResult();
})(options, options.searcher);