/** 
 * @typedef {object} TNodeSearchResult
 * @property {number} status
 * @property {object} data
 * @property {object[]} data.torrents
 * @property {number} data.torrents.id
 * @property {string} data.torrents.title
 * @property {string} data.torrents.subtitle
 * @property {number} data.torrents.size
 * @property {string} data.torrents.uploader_id
 * @property {number} data.torrents.upload_time
 * @property {number} data.torrents.seeding
 * @property {number} data.torrents.leeching
 * @property {number} data.torrents.complete
 * @property {number} data.torrents.anonymous
 * @property {number} data.torrents.pinned
 * @property {number} data.torrents.is_official
 * @property {number} data.torrents.category
 * @property {number[]} data.torrents.tags
 * @property {string} data.torrents.douban
 * @property {null} data.torrents.imdb
 * @property {object} data.torrents.user
 * @property {boolean} data.torrents.user.anonymous
 * @property {number} data.torrents.uploadRate
 * @property {number} data.torrents.downloadRate
 * @property {number} data.total
 */

/**
 * @typedef {object} TagOrCategory
 * @property {number} id
 * @property {string} name
 * @property {number} display_id
 */

/**
 * TNode 默认搜索结果解析类
 */
(function (options, Searcher) {
  class Parser {
    /**
     * @param {Site} site
     * @param {TagOrCategory[]} tagsAndCategories
     */
    constructor(site, tagsAndCategories = []) {
      this.site = site
      /**
       * @type Record<number, string>
       */
      this.tags_map = {}
      for (const item of tagsAndCategories) {
        this.tags_map[item.id] = {
          color: '#22a2c3',
          ...item,
        }
      }
    }
    /**
     * 获取搜索结果
     * @param {TNodeSearchResult} response
     */
    getResult(response) {
      if (response.status === 401) {
        options.status = ESearchResultParseStatus.needLogin; //`[${options.site.name}]需要登录后再搜索`;
        return [];
      }
      options.isLogged = true;
      if (response.data.total === 0 || response.data.torrents.length === 0) {
        options.status = ESearchResultParseStatus.noTorrents; // `[${options.site.name}]没有搜索到相关的种子`;
        return [];
      }
      /**
       * @type {SearchResultItem[]}
       */
      const results = []
      const host = site.url.endsWith('/') ? site.url.slice(0, -1) : site.url;
      
      try {
        for (const torrent of response.data.torrents) {
          const link = host + '/torrent/info/' + torrent.id;
          let url = host + '/api/torrent/download/'  + torrent.id;
          if (site.passkey) {
            url += '/' + site.passkey;
          }
          const tags = (torrent.tags || []).map(x => this.tags_map[x]);
          const category = torrent.category ? this.tags_map[torrent.category] : undefined;
          results.push({
            title: torrent.title,
            subTitle: torrent.subtitle,
            link,
            url,
            site: this.site,
            size: torrent.size,
            time: torrent.upload_time,
            author: torrent.anonymous ? undefined: torrent.user.username,
            seeders: torrent.seeding,
            leechers: torrent.leeching,
            completed: torrent.complete,
            comments: undefined,
            tags,
            category,
            progress: undefined,
            status: undefined,
            imdbId: undefined,
            entryName: '全部',
          });
        }
      } catch (error) {
        options.status = ESearchResultParseStatus.parseError;
        options.errorMsg = error.stack;
        //`[${options.site.name}]获取种子信息出错: ${error.stack}`;
      }

      return results;
    }

  }
  let site = options.site;
  let tagsAndCategories = site.user && site.user.tagsAndCategories || [];
  let parser = new Parser(site, tagsAndCategories);
  options.results = parser.getResult(options.page);
  console.log(options.results);
})(options, options.searcher);
