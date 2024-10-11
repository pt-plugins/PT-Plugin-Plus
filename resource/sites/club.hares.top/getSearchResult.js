(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (options.page.msg != "success") {
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
      let groups = options.page.data;
      if (groups.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
        return [];
      }
      let results = [];
      try {
        groups.forEach(group => {
          let data = {
            title: group.name,
            subTitle: group.small_descr,
            link: `${site.url}/view.php?id=${group.id}`,
            url: `${site.url}/${$(group.download).attr('href')}`,
            size: group.size.replace(/<br \/>/g, ' '),
            time: group.addTime.parseTime(),
            author: $(group.owner).text(),
            seeders: $(group.seeders).text(),
            leechers: $(group.leechers).text(),
            completed: $(group.times_completed).text(),
            site: site,
            tags: this.getTags(group.tags),
            entryName: options.entry.name,
            category: this.getCategory(group.catImg),
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
      let $spans = $(discount).filter('span'); 
      let tags = [];

      $spans.each(function() {
        let name = $(this).attr('title'); 
        let color = $(this).css('background-color');
        tags.push({
            name: name,
            color: color
        });
      });
      return tags;
    
    }

    getCategory(category) {
      let match = category.match(/cat=(\d+)/);
      if (match) {
        let categoryId = match[1]; 
        console.log(categoryId); 
        switch (categoryId) {
          case "401":
            return "电影";
          case "402":
            return "电视剧";
          case "403":
            return "综艺";
          case "404":
            return "纪录片";
          case "405":
            return "动漫";
          case "406":
            return "音乐视频";
          case "407":
            return "体育";
          case "409":
            return "演唱会";
          case "416":
            return "现场视频";
          case "415":
            return "其他";
        }
      } 
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
})(options);
