(function (options) {
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
      let groups = options.page.response.results;
      if (groups.length == 0) {
        options.status = ESearchResultParseStatus.noTorrents;
        return [];
      }
      let results = [];
      let authkey = options.page.AuthKey;
      let passkey = options.page.PassKey;
      console.log("groups.length", groups.length);
      try {
        groups.forEach(group => {
          if (group.hasOwnProperty("torrents")) {
            let torrents = group.torrents;
            torrents.forEach(torrent => {
              let data = {
                title: group.artist +
                  " - " +
                  group.groupName +
                  " [" +
                  group.groupYear +
                  "] [" +
                  group.releaseType +
                  "]",
                subTitle: torrent.format +
                  " / " +
                  torrent.encoding +
                  " / " +
                  torrent.media +
                  (torrent.hasLog ? ` / Log(${torrent.logScore})` : "") +
                  (torrent.hasCue ? " / Cue" : "") +
                  (torrent.remastered ? ` / ${torrent.remasterYear}` : "") +
                  (torrent.scene ? " / Scene" : "") +
                  ((torrent.isFreeleech || torrent.isNeutralLeech || torrent.isPersonalFreeleech) ? " / Freeleech" : ""),
                link: `${site.url}torrents.php?id=${group.groupId}&torrentid=${torrent.torrentId}`,
                url: `${site.url}torrents.php?action=download&id=${torrent.torrentId}&authkey=${authkey}&torrent_pass=${passkey}`,
                size: parseFloat(torrent.size),
                time: torrent.time,
                author: "",
                seeders: torrent.seeders,
                leechers: torrent.leechers,
                completed: torrent.snatches,
                comments: 0,
                site: site,
                tags: group.tags,
                entryName: options.entry.name,
                category: group.releaseType
              }
              results.push(data);
            })
          } else {
            let data = {
              title: group.groupName,
              link: `${site.url}torrents.php?id=${group.groupId}&torrentid=${group.torrentId}`,
              url: `${site.url}torrents.php?action=download&id=${group.torrentId}&authkey=${authkey}&torrent_pass=${passkey}`,
              size: parseFloat(group.size),
              time: group.groupTime,
              author: "",
              seeders: group.seeders,
              leechers: group.leechers,
              completed: group.snatches,
              comments: 0,
              site: site,
              tags: group.tags,
              entryName: options.entry.name,
              category: group.category
            }
            results.push(data);
          }
        })
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
