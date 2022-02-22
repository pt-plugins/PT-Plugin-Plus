(function (options, Searcher) {
  class Parser {
    constructor() {
      this.haveData = false;
      if (/\/login/.test(options.responseText)) {
        options.status = ESearchResultParseStatus.needLogin;
        return;
      }

      // Logging in is required.
      options.isLogged = true;
      this.haveData = true;
    }

    /**
     * Getting the search results.
     */
    getResult() {
      if (!this.haveData) {
        return [];
      }
      let site = options.site;
      site.searchEntryConfig = options.entry
      let selector = "#torrent-list-table";
      let table = options.page.find(selector);
      let rows = table.find("> tbody > tr");
      if (rows.length == 0) {
        options.status = ESearchResultParseStatus.torrentTableIsEmpty;
        return [];
      }

      let results = [];
      try {
        // For each torrent in the table.
        for (let index = 0; index < rows.length; index++) {
          const row = rows.eq(index);

          // Torrent title.
          const title = row.find(".torrent-listings-overview > .torrent-listings-name").text();
          const subTitle = "";
          // Time uploaded.
          const time = row.find(".torrent-listings-age").text();
          // File size.
          const size = row.find(".torrent-listings-size").text();
          // Number of seeders.
          const seeders = row.find(".torrent-listings-seeders").text().trim();
          // Number of leechers.
          const leechers = row.find(".torrent-listings-leechers").text().trim();
          // Number of downloads.
          const completed = row.find(".torrent-listings-completed").text().trim();
          // Number of comments.
          const comments = row.find(".torrent-listings-overview > .torrent-listings-comments").text().trim();
          // Uploader.
          const author = row.find(".torrent-listings-uploader").text();
          // Category
          const categoryURL = row.find(".torrent-listings-format > a").attr('href');
          const category = this.getCategory(
            categoryURL == null ? -1 :
              parseInt(categoryURL.substr(categoryURL.lastIndexOf("/") + 1)));
          // Download link to the torrent.
          const link = row.find(".torrent-listings-download > a").attr('href');
          // Link to the detail page.
          const url = row.find(".torrent-listings-overview > .torrent-listings-name").attr('href');

          // Adding to the results.
          results.push({
            title,
            subTitle,
            link,
            url,
            size,
            time,
            author,
            seeders,
            leechers,
            completed,
            comments,
            site,
            tags: Searcher.getRowTags(site, row), // TODO: better tags.
            entryName: options.entry.name,
            category,
            progress: null, // TODO: add support.
            status: null, // TODO: add support.
          });
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

    /**
     * Get the Cateogry Names.
     * @param {*} categoryKey The category ID from URL.
     */
    getCategory(categoryKey) {
      // List of cateogories: https://aither.cc/categories.
      const categoryMap = {
        1: "Movie",
        2: "TV",
        3: "Music",
        4: "Games",
        6: "XXX",
        9: "Sport",
        10: "Software & Apps",
        11: "Ebooks & Magazines",
        14: "Audiobooks",
        15: "Education",
      }
      return categoryKey in categoryMap ? categoryMap[categoryKey] : null;
    }
  }

  let parser = new Parser(options);
  options.results = parser.getResult();
  console.log(options.results);
})(options, options.searcher);
