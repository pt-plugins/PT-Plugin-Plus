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
        uploads: 0,
        uploadsSize: 0
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

      let datas = this.rawData.data.data;
      let results = {
        uploads: 0,
        uploadsSize: 0
      };
      if (datas) {
        datas.forEach(item => {
          results.uploads++;
          results.uploadsSize += item[0].size;
        });
      }

      this.result.uploads += results.uploads;
      this.result.uploadsSize += results.uploadsSize;

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

      this.pageInfo.count = this.rawData.data.totalPages;
    }

    /**
     * 加载当前页内容
     */
    load() {
      let url = this.dataURL;
      let postData = this.options.rule.requestData;
      postData.pageNumber = this.pageInfo.current + 1;

      $.ajax({
        url,
        method: "POST",
        dataType: "JSON",
        data: JSON.stringify(postData),
        contentType: "application/json"
      })
        .done(result => {
          this.rawData = result;
          if (this.rawData.data.data.length > 0) {
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
