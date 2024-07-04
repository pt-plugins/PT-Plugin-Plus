(function(options, User) {
  class Parser {
    static MAX_RETRIES = 2;
    static RETRY_DELAY_MS = 8000;

    constructor(options, dataURL) {
      this.options = options;
      this.dataURL = dataURL;
      this.body = null;
      this.rawData = "";
      this.pageInfo = {
        count: 0,
        current: 0,
      };
      this.result = {
        seeding: 0,
        seedingSize: 0,
      };
      this.load();
    }

    /**
     * 完成
     */
    done() {
      this.result.messageCount = this.getUnReadMessageCount();
      console.log(`[mt] getUserSeedingTorrents done`, this.result);
      this.options.resolve(this.result);
    }

    /**
     * 解析内容
     */
    parse() {
      this.getPageInfo();

      let datas = this.rawData.data.data;
      let results = {
        seeding: 0,
        seedingSize: 0,
      };
      if (datas) {
        datas.forEach((item) => {
          results.seeding++;
          results.seedingSize += Number(item.torrent.size);
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

      this.pageInfo.count = Number(this.rawData.data.totalPages);
    }

    /**
     * 加载当前页内容
     */
    load() {
      let url = this.dataURL;
      let postData = this.options.rule.requestData;
      postData.pageNumber = this.pageInfo.current + 1;

      function makeRequest(retryCount = 0) {
        setTimeout(() => {
          $.ajax({
            url,
            method: "POST",
            dataType: "JSON",
            data: JSON.stringify(postData),
            contentType: "application/json",
            headers: this.options.rule.headers,
          })
            .done((result) => {
              try {
                this.rawData = result;
                if (this.rawData.data.data.length > 0) {
                  this.parse();
                } else {
                  this.done();
                }
              } catch (error) {
                console.error("[mt] Error processing result:", error);
                if (retryCount < Parser.MAX_RETRIES) {
                  makeRequest.call(this, retryCount + 1);
                } else {
                  this.done();
                }
              }
            })
            .fail(() => {
              this.done();
            });
        }, Parser.RETRY_DELAY_MS);
      }

      // Call the function for the first time
      makeRequest.call(this);
    }

    /**
     * 获取未读消息数量, 包括站内信和系统通知
     * 这是两个接口, 直接写 config.json 是无法实现的. 在这里加点魔法
     */
    getUnReadMessageCount() {
      return this.getMailBoxCnt() + this.getSystemNoticeCnt();
    }

    /**
     * 获取站内信未读数量
     */
    getMailBoxCnt() {
      return this.getNotifyCnt(resolveURL(activeURL, "/api/msg/statistic"));
    }

    /**
     * 获取系统通知未读数量
     */
    getSystemNoticeCnt() {
      return this.getNotifyCnt(
        resolveURL(activeURL, "/api/msg/notify/statistic")
      );
    }

    getNotifyCnt(url) {
      const res = $.ajax(url, {
        method: "POST",
        data: {},
        headers: this.options.rule.headers,
        async: false,
      });
      return parseInt(res.responseJSON.data.unMake) || 0;
    }
  }

  function resolveURL(from, to) {
    const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
    if (resolvedUrl.protocol === 'resolve:') {
      // `from` is a relative URL.
      const { pathname, search, hash } = resolvedUrl;
      return pathname + search + hash;
    }
    return resolvedUrl.toString();
  }
  let activeURL = PPF.getSiteActiveUrl(site);
  console.log(`[mt] getUserSeedingTorrents`, options, User);

  let dataURL = resolveURL(activeURL, options.rule.page);

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
