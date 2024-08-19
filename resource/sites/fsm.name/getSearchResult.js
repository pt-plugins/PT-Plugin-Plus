(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (options.page.msg != "获取种子列表") {
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }
      options.isLogged = true;
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
      let groups = options.page.data.list;
      if (groups.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
        return [];
      }
      let results = [];
      try {
        groups.forEach(group => {
          let data = {
            title: group.title,
            subTitle: group.tags,
            link: `${site.url}/Torrents/details?tid=${group.tid}`,
            url: `${site.url}/api/Torrents/download?tid=${group.tid}&passkey=${site.passkey}`,
            size: Number(group.fileRawSize),
            time: Date(group.createdTs),
            seeders: group.peers.upload,
            leechers: group.peers.download,
            completed: group.finish,
            site: options.site,
            tags: this.getTags(group.status.class),
            entryName: options.entry.name,
            category: group.type.name,
            comments: '--',
          };
          results.push(data);
        });
        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents;
        }
      } catch (error) {
        console.log(error);
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
      }
      return results;
    }

    getTags(discount) {
      switch (discount)
      {
        case "2xfree":
          return [{
            name: "2xFree",
            color: "green"
          }];
        case "free":
          return [{
            name: "Free",
            color: "blue"
          }];
        default:
          return [];
      }
    }

    getCategory(category) {
      switch (category) {
        case "1":
          return "日本AV";
        case "2":
          return "国产视频";
        case "3":
          return "写真";
        case "4":
          return "黄油";
        case "5":
          return "里番";
        case "6":
          return "黄色漫画";
        case "7":
          return "欧美视频";
        case "8":
          return "其他";
        default:
          return category;
      }
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
})(options);
