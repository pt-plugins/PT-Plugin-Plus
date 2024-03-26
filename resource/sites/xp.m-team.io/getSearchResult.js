(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (options.page.message != "SUCCESS") {
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
            tags: this.getTags(group.status.discount),
            entryName: options.entry.name,
            category: this.getCategory(group.category),
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

    getTags(discount) {
      switch (discount)
      {
        case "FREE":
          return [{
            name: "Free",
            color: "blue"
          }];
        case "PERCENT_50":
          return [{
            name: "50%",
            color: "orange"
          }];
        case "PERCENT_70":
          return [{
            name: "70%",
            color: "blue-grey"
          }];
        case "_2X_FREE":
          return [{
            name: "2xFree",
            color: "green"
          }];
        case "_2X_PERCENT_50":
          return [{
            name: "2x50%",
            color: "light-green"
          }];
        default:
          return [];
      }
    }

    getCategory(category) {
      switch (category) {
        case "105":
          return "影剧/综艺";
        case "110":
          return "Music";
        case "115":
          return "AV(有码)";
        case "120":
          return "AV(无码)";
        case "100":
          return "电影";
        case "401":
          return "电影/SD";
        case "419":
          return "电影/HD";
        case "420":
          return "电影/DVDiSo";
        case "421":
          return "电影/BluRay";
        case "439":
          return "电影/Remux";
        case "403":
          return "影剧/综艺/SD";
        case "402":
          return "影剧/综艺/HD";
        case "435":
          return "影剧/综艺/DVDiSo";
        case "438":
          return "影剧/综艺/BD";
        case "404":
          return "纪录教育";
        case "405":
          return "动画";
        case "406":
          return "演唱";
        case "408":
          return "Music(AAC/ALAC)";
        case "434":
          return "Music(无损)";  
        case "409":
          return "Misc(其他)";
        case "407":
          return "运动";
        case "422":
          return "软件";
        case "423":
          return "PC游戏";
        case "427":
          return "电子书";
        case "410":
          return "AV(有码)/HD Censored";
        case "429":
          return "AV(无码)/HD Uncensored";
        case "424":
          return "AV(有码)/SD Censored";
        case "430":
          return "AV(无码)/SD Uncensored";
        case "426":
          return "AV(无码)/DVDiSo Uncensored";
        case "437":
          return "AV(有码)/DVDiSo Censored";
        case "431":
          return "AV(有码)/Blu-Ray Censored";
        case "432":
          return "AV(无码)/Blu-Ray Uncensored";
        case "436":
          return "AV(网站)/0Day";
        case "425":
          return "IV(写真影集)";
        case "433":
          return "IV(写真图集)";
        case "411":
          return "H-游戏";
        case "412":
          return "H-动漫";
        case "413":
          return "H-漫画";
        case "440":
          return "AV(Gay)/HD";
        default:
          return category;
      }
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
})(options);
