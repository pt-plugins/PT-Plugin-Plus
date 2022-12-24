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
      this.authkey = "";
      this.passkey = "";
    }

    start() {
      this.getAuthKey()
        .then(() => {
          options.resolve(this.getResult());
        })
        .catch(() => {
          options.reject({
            success: false,
            msg: options.searcher.getErrorMessage(
              options.site,
              ESearchResultParseStatus.parseError,
              options.errorMsg
            ),
            data: {
              site: options.site,
              isLogged: options.isLogged
            }
          });
        });
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
      let authkey = this.authkey;
      let passkey = this.passkey;
      //console.log("groups.length", groups.length);
      try {
        groups.forEach(group => {
          if (group.hasOwnProperty("torrents")) {
            let torrents = group.torrents;
            torrents.forEach(torrent => {
              let data = {
                title:
                  (group.artist ? group.artist + " - " : "") +
                  group.groupName +
                  " / " +
                  group.groupYear +
                  " / " +
                  torrent.media +
                  (group.releaseType ? " / " + group.releaseType : "") + 
                  (torrent.format ? " / " + torrent.format : " / " + torrent.codec) + 
                  (torrent.encoding ? " / " + torrent.encoding : " / " + torrent.resolution),
                  
                subTitle:
                  (torrent.container ? torrent.container: "") + 
                  (torrent.hasLog ? `Log(${torrent.logScore})` : "") +
                  (torrent.hasCue ? " / Cue" : "") +
                  (torrent.remastered ? ` / Remaster / ${torrent.remasterYear} / ${torrent.remasterTitle}` : "") +
                  (torrent.scene ? " / Scene" : ""),
                link: `${site.url}torrents.php?id=${group.groupId}&torrentid=${torrent.torrentId}`,
                url: `${site.url}torrents.php?action=download&id=${torrent.torrentId}&authkey=${authkey}&torrent_pass=${passkey}`,
                size: parseFloat(torrent.size),
                time: torrent.time,
                seeders: torrent.seeders,
                leechers: torrent.leechers,
                completed: torrent.snatches,
                site: site,
                tags: (torrent.isFreeleech || torrent.isPersonalFreeleech) ? [{name: "Free",color: "blue"}] : torrent.isNeutralLeech ? [{name: "Neutral",color: "purple"}] : [],
                entryName: options.entry.name,
                category: group.releaseType,
                imdbId: group.imdbId,
              };
              results.push(data);
            });
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
              category: group.category,
              imdbId: group.imdbId,
            };
            results.push(data);
          }
        });
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

    /**
     * 获取 AuthKey ，用于组合完整的下载链接
     */
    getAuthKey() {
      const url = (options.site.activeURL + "/ajax.php?action=index")
        .replace("://", "****")
        .replace(/\/\//g, "/")
        .replace("****", "://");

      return new Promise((resolve, reject) => {
        $.get(url)
          .done(result => {
            if (result && result.status === "success" && result.response) {
              this.authkey = result.response.authkey;
              this.passkey = result.response.passkey;
              resolve();
            } else {
              reject();
            }
          })
          .fail(() => {
            reject();
          });
      });
    }
  }

  let parser = new Parser(options);
  parser.start();
})(options);
