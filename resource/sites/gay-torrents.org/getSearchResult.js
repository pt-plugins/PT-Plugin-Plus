(function (options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/Login/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }
      options.isLogged = true;
      this.haveData = true;
    }

    getResult() {
      if (!this.haveData) {
        return [];
      }
      let site = options.site;
      let selector = options.resultSelector;
      let table = options.page.find(selector);
      let rows = table.find('> div.torrent');
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return [];
      }
      let results = [];

      try {
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);

          let title_elem = row.find('.torrent_link').first();
          if (title_elem.length == 0) {
            continue;
          }

          let comments = row.find('.downloadInfo > a:first-of-type').first().text().split(' ')[0]

          let data = {
            title: title_elem.text(),
            link: `${site.url}${title_elem.attr('href')}`,
            url: `${site.url}${row.find('.downloadLink').first().attr('href')}&secure=1`,
            size: row.find('.size').first().text(),
            time: row.find('.date').first().text().replace(/on\s*(\d{2}:\d{2}(?::\d{2})?)\s*(\d{1,2})-(\w{3,4})-(\d{4,})/, '$4 $3 $2 $1'),
            author: row.find('.uploader > span').first().text(),
            seeders: row.find('.downloadPeers > div:first-child > a').first().text(),
            leechers: row.find('.downloadPeers > div:last-child > a').first().text(),
            completed: row.find('.downloadTimes').first().text().split(' ')[0],
            comments: comments ? comments : 0,
            site: site,
            tags: this.getTags(row, options.torrentTagSelectors),
            entryName: options.entry.name,
            category: options.searcher.getCategoryById(
              site,
              options.url,
              row.find('.categoryNew > a').first().attr('href').split('=')[1]
            )
          };
          results.push(data);
        }
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

    getTags(row, selectors) {
      let tags = [];
      if (selectors && selectors.length > 0) {
        selectors.forEach((item) => {
          if (item.selector) {
            let result = row.find(item.selector);
            if (result.length) {
              tags.push({
                name: item.name,
                color: item.color,
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
})(options, Searcher);
