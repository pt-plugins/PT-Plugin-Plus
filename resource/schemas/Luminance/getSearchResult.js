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
      let rows = options.page.find('#torrent_table > tbody > .torrent');
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty;
        return [];
      }
      let results = [];

      try {
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);

          let title_elem = row.find('a[onmouseover*=return]').first();

          let data = {
            category: { name: row.find('td').first().find('div').first().attr('title') },
            title: title_elem.text(),
            link: `${site.url}${title_elem.attr('href')}`,
            url: `${site.url}${row.find('a[href*=download]').first().attr('href')}`,
            comments: row.find('td').eq(3).text(),
            time: row.find('.time').first().attr('title'),
            size: row.find('td').eq(5).text(),
            completed: row.find('td').eq(6).text(),
            seeders: row.find('td').eq(7).text(),
            leechers: row.find('td').eq(8).text(),
            author: row.find('td').eq(9).text(),
            tags: row.find('img[alt=Freeleech]').length ? [{ name: 'Free', color: 'blue' }] : [],
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
