(function (options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      this.categories = {};
      if (/login\.php/.test(options.responseText)) {
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
      let rows = table.find('> tbody > tr');
      if (rows.length <= 1) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty; //`[${options.site.name}]没有定位到种子列表，或没有相关的种子`;
        return [];
      }
      let results = [];
      
      try {
        for (let index = 1; index < rows.length; index++) {
          const row = rows.eq(index);

          let title_elem = row.find('.torrent_title > .torrent_title').first();
          if (title_elem.length == 0) {
            continue;
          }

          let time = row.find('.tadded').first().text()
          let peers = row.find('.hidden-xs.hidden-sm.biggerfont').first().text().match(/[\d,]+/g)
          let comments = row.find('.tcomments').first().text().split(/\s/)[0];
          let category = options.searcher.getCategoryById(
            site,
            options.url,
            row.find('.browsemaincat > a').first().attr('href').split('=')[1]
            )
          let tags = []
          if (row.find('.infocol > div[onmouseover] > font[color=yellow]').length > 0) {
            tags.push({ name: 'Free', color: 'blue' })
          }
          if (title_elem.text().startsWith('♺')) {
            tags.push({ name: 'Bumped', color: 'grey' })
          }

          let data = {
            title: title_elem.text().replace(/^♺ /g, ''),
            link: `${site.url}${title_elem.attr("href")}`,
            url: `${site.url}${row.find('.index').first().attr('href')}`,
            size: row.find('.tsize').first().text(),
            time: `${time.match(/\d{4}-\d{2}-\d{2}/g)[0]} ${time.match(/\d{2}:\d{2}:\d{2}/g)[0]}`,
            author: '(Anonymous)',
            seeders: peers[1],
            leechers: peers[2],
            completed: peers[0],
            comments: comments ? comments : 0,
            site: site,
            tags: tags,
            entryName: options.entry.name,
            category: category.id ? category : { id: "-1", "name": "Porn" },
            status: options.searcher.getFieldValue(site, row, "status")
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
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, Searcher);
