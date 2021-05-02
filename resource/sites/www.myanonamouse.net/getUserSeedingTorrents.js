(function (options, User) {
  class Parser {
    constructor(options) {
      this.options = options;
      this.body = null;
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
     * 加载当前做种数据
     */
    load() {
      const types = [
        "seedUnsat",
        "seedHnr",
        "sSat",
        "upAct"
      ]
      let doneCount = 0
      for (const type of types) {
        User.getCookie(options.site, "mam_id").then(mamId => {
          $.getJSON("https://cdn.myanonamouse.net/json/loadUserDetailsTorrents.php", {
            uid: options.userInfo.id,
            iteration: 0,
            type: type,
            cacheTime: Math.round(Date.now() / 1000),
            mam_id: decodeURIComponent(mamId)
          }).done(data => {
            doneCount++
            data.rows.forEach(item => {
              this.result.seeding += 1;
              this.result.seedingSize += item.size.sizeToNumber()
            })

            if (doneCount === types.length-1) {
              this.done();
            }
          }).fail(error => {
            console.log(error);
            this.done();
          })
        }).catch(err => {
          console.log(err);
          this.done();
        });
      }
    }
  }

  new Parser(options);
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
