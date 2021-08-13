(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/loginSection/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (/对不起，没有您搜索的相关结果/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        return;
      }

      this.haveData = true;
      this.peeringInfo = {seeding:[], leeching:[]}
    }

    /**
     * 获取搜索结果
     */
    getResult() {
      if (!this.haveData) {
        return [];
      }
      let site = options.site;
      let selector = options.resultSelector;
      let rows = options.page.find(selector);
      let results = [];

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      try {
        // 遍历数据行
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);
          let id = row.attr("id").replace("dl_torrent_", "");
          let url = `${site.url}download.php?id=${id}`;
          let link = `${site.url}details.php?id=${id}`;
          let progress;
          let status;

          for (let i = 0; i < this.peeringInfo.seeding.length; i++) {
            let seedingInfo = this.peeringInfo.seeding[i]
            if (seedingInfo.torrentid == id) {
              progress = 100;
              status = 2;
              break
            }
          }

          if (!status) {
            for (let i = 0; i < this.peeringInfo.leeching.length; i++) {
              let leechingInfo = this.peeringInfo.leeching[i]
              if (leechingInfo.torrentid == id) {
                progress = leechingInfo.completePercent;
                status = 1;
                break
              }
            }
          }

          let data = {
            title: row.find(".title_chs").text(),
            subTitle: row.find(".title_eng").text(),
            link,
            url,
            size: row.find(".torrent_size").text(),
            time: this.getTime(row.find(".torrent_added")),
            author: "",
            seeders: this.getTorrentCount(
              row
                .find(".torrent_count.strong")
                .eq(0)
                .text()
            ),
            leechers: this.getTorrentCount(
              row
                .find(".torrent_count.strong")
                .eq(1)
                .text()
            ),
            completed: -1,
            comments: 0,
            site: site,
            tags: Searcher.getRowTags(site, row),
            entryName: options.entry.name,
            category: null,
            progress,
            status,
          };
          results.push(data);
        }

        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        }
      } catch (error) {
        console.log(error);
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack; //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }

      return results;
    }

    getTorrentCount(text) {
      return text == "---" ? 0 : text;
    }

    /**
     * 获取时间
     * @param {*} el
     */
    getTime(el) {
      let time = $("<span>")
        .html(el.html().replace("<br>", " "))
        .text();
      return time || "";
    }

    /**
     * ajax 获取做种信息
     */
    getPeeringInfo() {
      let site = options.site;
      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }
      let url = site.url + "api.php?action=getAllPeeringInfo"

      return new Promise((resolve, reject) => {
        $.ajax({url, dataType:'json'}).done(data => {
          this.peeringInfo = data;
          resolve();
        }).fail(() => {
          reject();
        })
      })
    }

    start() {
      this.getPeeringInfo().then(() => {
        options.resolve(this.getResult());
      }).catch(() => {
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
  }

  let parser = new Parser(options);
  parser.start();
})(options, options.searcher);
