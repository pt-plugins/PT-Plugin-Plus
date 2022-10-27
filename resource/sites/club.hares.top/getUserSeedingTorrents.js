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

    parse(result) {
      var jsonObject= JSON.parse(result);

      let results = new User.InfoParser(User.service);
      if (results) {
        this.result.seeding = jsonObject.count;
        this.result.seedingSize = jsonObject.size.sizeToNumber();
      }
      
      this.options.resolve(this.result);
    }

    load() {
        $.ajax({
          url: this.dataURL,
          headers: {
              Accept: "application/json, text/javascript, */*; q=0.01"
          },
          type: "get",
          success: (data)=>{
            this.parse(data);
          }
      })
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
