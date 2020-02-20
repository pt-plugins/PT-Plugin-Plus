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

(function(options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/auth_form/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return;
      }

      options.isLogged = true;

      if (
        /没有种子|Your search did not match anything|用准确的关键字重试/.test(
          options.responseText
        )
      ) {
        options.status = ESearchResultParseStatus.noTorrents; //`[${options.site.name}]没有搜索到相关的种子`;
        return;
      }

      this.haveData = true;
    }

    /**
     * 获取搜索结果
     */
    getResult() {
      let site = options.site;
      let results = [];
      // 获取种子列表行
      let rows = options.page.find(
        options.resultSelector || "table.torrent_table:first > tbody > tr"
      );
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return results;
      }
      let moviename = "";
      let movienames = {};
      let categories = {};
      let groupid;
        let torrentinforows = options.page.find("tr.torrent, tr.group");
        for(let index = 0; index < torrentinforows.length; index++){
          let torrentinforow = torrentinforows.eq(index);
          let torrentinfo = torrentinforow.find("td.center.cats_col").first();
          let torrenttitle = torrentinforow.find("a[title='View Torrent'][href ^='torrents.php?id=']").first();

          groupid = torrenttitle.attr("href").getQueryString("id");
          movienames[groupid] = torrenttitle.parent().text().replace(/[\r\n]/g,"").replace(/Bookmark.*/g,"").trim();
          if(!movienames[groupid] || new RegExp("\t[DL	| RP]\t").test(movienames[groupid])){
            movienames[groupid] = torrenttitle.parent().text().replace(/[\r\n]/g,"").replace(/\t+/g,"\t").replace("\t[DL	| RP]\t","").split('\t')[0];
          }
          categories[groupid] = torrentinfo.find("div").first().attr("class").split(" ")[0].replace("cats_","");
        }
      

      // 用于定位每个字段所列的位置
      let fieldIndex = {
          time: 1,
          size: 3,
          seeders: 5,
          leechers: 6,
          completed: 4,
          comments: -1,
          author: 2
        };
 

      if (site.url.lastIndexOf("/") != site.url.length - 1) {
        site.url += "/";
      }

      try {
        // 遍历数据行
        for (let index = 1; index < rows.length; index++) {
          const row = rows.eq(index);
          let cells = row.find(">td");

          let title = row.find("a[href*='torrents.php?id=']").first();
          if (title.length == 0) {
            continue;
          }
          let subTitle = row.find("div.torrent_info").first();

          // 获取下载链接
          let url = row.find("a[href*='torrents.php?action=download']").first();                        
          if (url.length == 0) {
            continue;
          }

          url = url.attr("href");
          let torrentid = url.getQueryString("id");
          let link = title.attr("href");
          if (link && link.substr(0, 4) !== "http") {
            link = `${site.url}${link}`;
          }

          if (url.substr(0, 4) !== "http") {
            url = `${site.url}${url}`;
          }

          let time = "";
            groupid = title.attr("href").getQueryString("id");
            time =
            fieldIndex.time == -1
              ? ""
              : cells
                  .eq(fieldIndex.time)
                  .find("span[title],time[title]")
                  .attr("title") ||
                cells.eq(fieldIndex.time).text() ||
                "";
          

          if (time) {
            time += ":00";
          }
          let data = {
            title: title.text(),
            subTitle: subTitle.text(),
            link,
            url: url,
            size: cells.eq(fieldIndex.size).html() || 0,
            time: time,
            author:
              fieldIndex.author == -1
                ? ""
                : cells.eq(fieldIndex.author).text() || "",
            seeders:
              fieldIndex.seeders == -1
                ? ""
                : cells.eq(fieldIndex.seeders).text() || 0,
            leechers:
              fieldIndex.leechers == -1
                ? ""
                : cells.eq(fieldIndex.leechers).text() || 0,
            completed:
              fieldIndex.completed == -1
                ? ""
                : cells.eq(fieldIndex.completed).text() || 0,
            comments:
              fieldIndex.comments == -1
                ? ""
                : cells.eq(fieldIndex.comments).text() || 0,
            site: site,
            entryName: options.entry.name,
            tags: this.getTags(row, options.torrentTagSelectors),
            category: categories[groupid],
            status: Searcher.getFieldValue(site, cells, "status"),
            progress: Searcher.getFieldValue(site, cells, "progress")
          };
          results.push(data);
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

    /**
     * 获取标签
     * @param {*} row
     * @param {*} selectors
     * @return array
     */
    getTags(row, selectors) {
      let tags = [];
      if (selectors && selectors.length > 0) {
        selectors.forEach(item => {
          if (item.selector) {
            let result = row.find(item.selector);
            if (result.length) {
              tags.push({
                name: item.name,
                color: item.color
              });
            }
          }
        });
      }
      return tags;
    }


  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
