if (!"".getQueryString) {
  String.prototype.getQueryString = function (name, split) {
    if (split == undefined) split = "&";
    var reg = new RegExp(
      "(^|" + split + "|\\?)" + name + "=([^" + split + "]*)(" + split + "|$)"
    ),
      r;
    if ((r = this.match(reg))) return decodeURI(r[2]);
    return null;
  };
}

(function (options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/loginform/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }
      options.isLogged = true;

      if (/File slips through fingers/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        return;
      }
      this.haveData = true;
    }

    /**
     * Get search results.
     */
    getResult() {
      let site = options.site;
      let results = [];

      // Get groups. Each group has one title and several torrents.
      let groups = options.page.find(options.resultSelector);
      if (groups.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return results;
      }

      try {
        for (let ig = 0; ig < groups.length; ig++) {
          // Get group info.
          let group = groups.eq(ig);
          let groupTitle = group.find(".group_title").find("strong:first").text();
          if (groupTitle.length == 0) {
            continue;
          }
          let category = group.find("span.cat:first").text();

          // Get torrent info.
          let torrents = group.find(".torrent_group:first").find("tr.torrent");
          for (let i = 0; i < torrents.length; i++) {
            let t = torrents.eq(i);
            let subTitle = t.find(".torrent_properties:first").find("a:last").text();
            let dlLink = site.url + t.find(".download_link:first").find("a:first").attr("href");
            let torrentURL = site.url + t.find(".torrent_properties:first").find("a:last").attr("href");
            let size = t.find(".torrent_size:first").text();
            let snatched = t.find(".torrent_snatched:first").text();
            let seeders = t.find(".torrent_seeders:first").text();
            let leechers = t.find(".torrent_leechers:first").text();

            // Basic validations.
            if (dlLink.length == 0) {
              console.log("[%s] Invalid torrent link for \"%s\": %s", site.name, groupTitle, dlLink);
              continue;
            }

            let data = {
              title: groupTitle,
              subTitle: subTitle,
              link: torrentURL, // Note: link means the torrent page.
              url: dlLink, // Note: url means the download link.
              size: size,
              time: "",
              author: "",
              seeders: seeders,
              leechers: leechers,
              completed: snatched,
              comments: "",
              site: site,
              entryName: options.entry.name, // TODO: support specifying entry name.
              category: category,
            };
            results.push(data);
          }
        }
        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        }
      } catch (error) {
        console.error(error);
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack; //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }
      return results;
    }

  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options);
