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
      let rows = options.page.find('table.browse > tbody > tr');
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty;
        return [];
      }
      let results = [];

      try {
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);

          let data = {
            category: { "name": row.find('td').find('img').attr('alt') },
            title: row.find('td').eq(1).find('a').text(),
            link: `${site.url}${row.find('td').eq(1).find('a').attr('href')}`,
            url: `${site.url}${row.find('td').eq(4).find('a').attr('href')}`,
            comments: row.find('td').eq(5).find('div').eq(1).text(),
            size: row.find('td').eq(6).find('div').eq(0).text(),
            completed: row.find('td').eq(7).find('div').eq(0).text(),
            seeders: row.find('td').eq(7).find('div').eq(1).text(),
            leechers: row.find('td').eq(7).find('div').eq(2).text(),
            author: row.find('td').eq(8).find('span').text(),
            time: row.find('td').eq(8).find('div').text(),
            progress: row.find('td').eq(9).text().search('-') == -1 ? row.find('td').eq(9).text() : null,
            status: row.find('td').eq(9).find('.has-text-green').length ? 2 : row.find('td').eq(9).find('.has-has-text-red').length ? 3 : null,
            tags: row.attr('class').search('free') != -1 ? [{ name: 'Free', color: 'blue' }] : [],
            site: site,
            entryName: options.entry.name
          };
          results.push(data);
        }
        if (results.length == 0) {
          options.status = ESearchResultParseStatus.noTorrents;
        }
      } catch (error) {
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
      }
      return results;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, Searcher);
