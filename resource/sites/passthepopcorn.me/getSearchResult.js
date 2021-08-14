if (!"".getQueryString) {
  String.prototype.getQueryString = function(name, split) {
    if (split == undefined) split = "&";
    var reg = new RegExp(
        "(^|" + split + "|\\?)" + name + "=([^" + split + "]*)(" + split + "|$)"
      ),
      r;
    if ((r = this.match(reg))) return decodeURI(r[2]);
    return null;
  };
}

(function(options) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/auth_form/.test(options.responseText)) {
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
      // 获取种子列表行
      let Movies = options.page.Movies;
      if (Movies.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
        return [];
      }
      let results = [];
      let authkey = options.page.AuthKey;
      let passkey = options.page.PassKey;
      console.log("Movies.length", Movies.length);
      //console.log("Movies", Movies.text());
      try {
        // 遍历数据行
        for (let index = 0; index < Movies.length; index++) {
          let row = Movies[index];
          let torrent = row.Torrents[0];
          let data = {
            id: `${torrent.Id}`,
            title:
              row.Title +
              "[" +
              row.Year +
              "]" +
              "-" +
              torrent.Codec +
              "/" +
              torrent.Container +
              "/" +
              torrent.Source +
              "/" +
              torrent.Resolution,
            subTitle: torrent.ReleaseName,
            link: `${site.url}torrents.php?id=${row.GroupId}&torrentid=${
              torrent.Id
            }`,
            url: `${site.url}torrents.php?action=download&id=${
              torrent.Id
            }&authkey=${authkey}&torrent_pass=${passkey}`,
            size: parseFloat(torrent.Size),
            time: torrent.UploadTime,
            author: "",
            seeders: torrent.Seeders,
            leechers: torrent.Leechers,
            completed: torrent.Snatched,
            comments: 0,
            site: site,
            tags: null,
            entryName: options.entry.name,
            category: "Movie"
          };
          results.push(data);
        }
        console.log("results.length", results.length);
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
  console.log(options.results);
})(options);
