(function(options, User) {
  class Parser {
    constructor(options, dataURL) {
      this.options = options;
      this.dataURL = dataURL;
      this.body = null;
      this.rawData = "";
      this.pageInfo = {
        count: 0,
        current: 0,
        size: 100
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
      this.getPageInfo();

      let datas = this.rawData.aaData;
      let results = {
        seeding: 0,
        seedingSize: 0
      };
      if (datas) {
        datas.forEach(item => {
          // item[7] 是否已完成
          // item[8] 活动状态
          if (item[7] >= 1 && item[8] == "Yes") {
            results.seeding++;
            results.seedingSize += item[1].replace('<span class=\"torrent_name2\">',"").replace('</span>',"").sizeToNumber();
          }
        });
      }

      this.result.seeding += results.seeding;
      this.result.seedingSize += results.seedingSize;

      this.pageInfo.current++;
      // 是否已到最后一页
      if (this.pageInfo.current < this.pageInfo.count) {
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

      this.pageInfo.count = Math.ceil(
        this.rawData.iTotalRecords / this.pageInfo.size
      );
    }

    /**
     * 加载当前页内容
     */
    load() {
      let url = this.dataURL;
      let postData = this.options.rule.requestData;
      postData.iDisplayLength = this.pageInfo.size;
      postData.sEcho++;
      postData.iDisplayStart = this.pageInfo.current * postData.iDisplayLength;

      $.ajax({
        url,
        method: "POST",
        dataType: "JSON",
        data: postData,
        headers: {
          "x-requested-with": "XMLHttpRequest"
        }
      })
        .done(result => {
          this.rawData = result;
          if (this.rawData.iTotalRecords) {
            this.parse();
          } else {
            this.done();
          }
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
