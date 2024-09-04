(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (!options.page) {
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
      let groups = options.page;
      if (groups.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
        return [];
      }
      let results = [];
      try {
        groups.forEach(group => {
          let data = {
            title: group.name,
            link: `${site.url}/torrent/${group.id}/${group.name}`,
            url: `${site.url}/api/v1/torrents/download/${group.id}`,
            size: group.size,
            time: Date(group.added),
            seeders: group.seeders,
            leechers: group.leechers,
            completed: '--',
            site: options.site,
            tags: this.isFree(group.frileech),
            entryName: options.entry.name,
            category: null,
            comments: group.comments,
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

    isFree(frileech) {
      let tags = [];
      if (frileech == 1) {
        tags.push({
          name: "Free",
          color: "blue"
        });
      }

      return tags;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
})(options);
