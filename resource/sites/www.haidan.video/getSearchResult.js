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
        let items = torrent.find(".torrent_wrap");
        let maintitle = Searcher.getFieldValue(site,torrent,"title");
        let category_link = site.url + site.page + Searcher.getFieldValue(site,torrent,"category_link_parameters");
        let category_name = Searcher.getFieldValue(site,torrent,"category_name");
        for (let j = 0; j < items.length; j++) {
          let item = items.eq(j);
          let field = {
            title: maintitle,
            subTitle: Searcher.getFieldValue(site,item,"subTitle"),
            link: site.url + Searcher.getFieldValue(site,item,"link_path"),
            url: site.url + Searcher.getFieldValue(site,item,"url_path"),
            size: Searcher.getFieldValue(site,item,"size"),
            time: Searcher.getFieldValue(site,item,"time"),
            author: Searcher.getFieldValue(site,item,"author"),
            seeders: Searcher.getFieldValue(site,item,"seeders"),
            leechers: Searcher.getFieldValue(site,item,"leechers"),
            completed: Searcher.getFieldValue(site,item,"completed"),
            //comments: -1,
            site: site,
            tags: Searcher.getRowTags(site,item),
            entryName: options.entry.name,
            category: {
              link: category_link,
              name: category_name,
            },
            progress: Searcher.getFieldValue(site,item,"progress"),
            status: Searcher.getFieldValue(site,item,"status"),
          };
          //CustomTags
          let listtags = item.find("label");
          for (let k = 0; k < listtags.length; k++) {
            let tag = {
              name: listtags.eq(k).find("b").text(),
              title: listtags.eq(k).find("b").text(),
              color: listtags.eq(k).get(0).style["background-color"]
            }
            field.tags.push(tag);
          }

          results.push(field);
        }
      }
      return results;
    }
  }
  let parser = new Parser(options);
  options.results = parser.getResult();
})(options, options.searcher);