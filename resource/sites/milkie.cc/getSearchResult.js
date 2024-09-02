(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (!options.page.hits) {
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
      let groups = options.page.torrents;
      if (groups.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
        return [];
      }
      let results = [];
      try {
        groups.forEach(group => {
          let data = {
            title: group.releaseName,
            link: `${site.url}/browse/${group.id}`,
            url: `${site.url}/api/v1/torrents/${group.id}/torrent?key=${encodeURIComponent(site.passkey)}`,
            size: group.size,
            time: Date(group.createdAt),
            seeders: group.seeders,
            leechers: group.leechers,
            completed: group.downloaded,
            site: options.site,
            tags: null,
            entryName: options.entry.name,
            category: this.getCategory(group.category),
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

    getCategory(category) {
      switch (category)
      {
        case 1:
          return "电影";
        case 2:
          return "电视剧";
        case 3:
          return "音乐";
        case 4:
          return "游戏";
        case 5:
          return "电子书";
        case 6:
          return "软件";
        case 7:
          return "成人";
        default:
          return category;
      }
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
})(options);
