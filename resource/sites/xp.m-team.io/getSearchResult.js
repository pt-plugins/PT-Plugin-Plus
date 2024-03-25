(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
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
      let groups = options.page.data.data;
      if (groups.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
        return [];
      }
      let results = [];
      try {
        groups.forEach(group => {
          let data = {
            title: group.name,
            subTitle: group.smallDescr,
            link: `${site.url}/detail/${group.id}`,
            url: `${site.url}/api/torrent/genDlToken?id=${group.id}`,
            size: Number(group.size),
            time: group.createdDate,
            author: "",
            seeders: group.status.seeders,
            leechers: group.status.leechers,
            completed: group.status.timesCompleted,
            comments: group.status.comments,
            site: site,
            tags: [],
            entryName: options.entry.name,
            category: group.category,
            imdbId: (group.imdb) ? group.imdb.split("/").pop() : null ,
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
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
})(options);
