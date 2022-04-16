if ("".getQueryString === undefined) {
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

(function(options, User) {
  class Parser {
    constructor(options, dataURL) {
      this.options = options;
      this.dataURL = dataURL;
      this.body = null;
      this.rawData = "";
      this.pageInfo = {
        count: 0,
        current: 0
      };
      this.result = {
        seeding: 0,
        seedingSize: 0
      };
      this.load();
    }

    /**
     * 完成
     */
    done() {
      this.options.resolve(this.result);
    }

    /**
     * 解析内容
     */
    parse() {
      const doc = new DOMParser().parseFromString(this.rawData, "text/html");
      // 构造 jQuery 对象
      this.body = $(doc).find("body");

      this.getPageInfo();

      let results = new User.InfoParser(User.service).getResult(
        this.body,
        this.options.rule
      );

      if (results) {
        this.result.seeding += results.seeding;
        this.result.seedingSize += results.seedingSize;
      }

      // 是否已到最后一页
      if (this.pageInfo.current < this.pageInfo.count) {
        this.pageInfo.current++;
        this.load();
      } else {
        this.done();
      }
    }

    /**
     * 获取页面相关内容
     */
    getPageInfo() {
      if (this.pageInfo.count > 0) {
        return;
      }
      // 获取最大页码
      const infos = this.body
        .find("table.torrents > tbody > tr:eq(0) td:eq(1)")
        .text();
      if (infos) {
        this.pageInfo.count = parseInt(infos.split('/')[1] / 50);
      } else {
        this.pageInfo.count = 0;
      }
    }

    /**
     * 加载当前页内容
     */
    load() {
      let url = this.dataURL;
      if (this.pageInfo.current > 0) {
        url += "&page=" + this.pageInfo.current;
      }
      $.get(url)
        .done(result => {
          this.rawData = result;
          this.parse();
        })
        .fail(() => {
          this.done();
        });
    }
  }

  let dataURL = options.site.activeURL + options.rule.page;
  dataURL = dataURL
    .replace("$user.id$", options.userInfo.id)
    .replace("$user.name$", options.userInfo.name)
    .replace("://", "****")
    .replace(/\/\//g, "/")
    .replace("****", "://");

  new Parser(options, dataURL);
})(_options, _self);
/**
 * 
  _options 表示当前参数 
  {
    site,
    rule,
    userInfo,
    resolve,
    reject
  }

  _self 表示 User(/src/background/user.ts) 类实例 
 */