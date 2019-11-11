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
        current: 1
      };
      this.result = {
        seedingSize: 0,
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

      let results = {
        seedingSize: 0
      };

      let status = this.body
      .find("table.table > tbody > tr")
      .find(">td[class*='text-']");

      let torrentsize = this.body.find("table.table > tbody > tr span[title='File Size']");
      
      for (let index = 0; index < status.length; index++){
        let status_i = status.eq(index).text();
        let torrentsize_i = torrentsize.eq(index).text().replace(/\"+|\n+|\s+/g,'');
        if (status_i == "seed") {
          results.seedingSize += torrentsize_i.sizeToNumber();
        }
      }
      this.result.seedingSize += results.seedingSize;

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
        .find("a[href*='/active']:contains('›'):last")
        .parent().prev().find("a[href*='/active']")
        .attr("href");

      if (infos) {
        this.pageInfo.count = parseInt(infos.getQueryString("page"));
      } else {
        this.pageInfo.count = 2;
      }
    }

    /**
     * 加载当前页内容
     */
    load() {
      let url = this.dataURL;
      if (this.pageInfo.current > 1) {
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
