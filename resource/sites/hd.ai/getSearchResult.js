
/**
 * hd.ai 搜索结果解析类
 */
(function (options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/login\.php|takelogin\.php|<form action="\?returnto=/.test(options.responseText)) {
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

      let response = JSON.parse(options.responseText);
      if (!response || !response.data || !response.data.items) {
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
      if (!this.haveData) {
        return [];
      }
      let site = options.site;
      let results = [];
      try {
        let response = JSON.parse(options.responseText);
        if (site.url.lastIndexOf("/") != site.url.length - 1) {
          site.url += "/";
        }
        response.data.items.forEach(item => {
          let data = {
            title: item.name,
            subTitle: item.small_descr,
            link: site.url + item.details,
            url: site.url + item.download + (site && site.passkey ? "&passkey=" + site.passkey : ""),
            size: item.size,
            time: item.added,
            author: item._owner,
            seeders: item.seeders,
            leechers: item.leechers,
            completed: item.times_completed,
            comments: item.comments,
            site: site,
            tags: this.getTags(item),
            entryName: options.entry.name,
            category: item.category,
            progress: "",
            status: ""
          };
          results.push(data);
        });
      } catch (error) {
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
        //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }

      return results;
    }

    getTags(item) {
      let tags = [];
      if (item.sp_state === 2) {
        tags.push({
          name: "Free",
          color: "blue",
          title: item.name
        })
      }
      return tags;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
