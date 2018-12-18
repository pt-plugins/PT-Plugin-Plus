(function ($) {
  //Deluge
  // id:1,method:auth.login,params:[url,null]
  // 380 web.download_torrent_from_url
  // 2 core.add_torrent_url
  class Deluge {
    /**
     * 初始化实例
     * @param {*} options 
     * loginName: 登录名
     * loginPwd: 登录密码
     * url: 服务器地址
     */
    init(options) {
      this.options = options;
      this.requestCount = -1;

      if (this.options.address.indexOf("/json") == -1) {
        let url = PTService.filters.parseURL(this.options.address);
        this.options.address = `${url.protocol}://${url.host}:${url.port}/json`;
      }
      console.log("Deluge.init", this.options.address);
    }

    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      console.log("Deluge.call", action, data);
      return new Promise((resolve, reject) => {
        switch (action) {
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data.url, (result) => {
              resolve(result);
            });
            break;
        }
      });
    }

    /**
     * 获取Session
     * @param {*} callback 
     */
    getSessionId(callback) {

      var data = {
        id: (++this.requestCount),
        method: "auth.login",
        params: [this.options.loginPwd]
      };

      var settings = {
        type: "POST",
        url: this.options.address,
        dataType: 'json',
        data: JSON.stringify(data),
        processData: false,
        success: (resultData, textStatus) => {
          this.isInitialized = true;
          if (callback) {
            callback(resultData);
          }
        }
      };
      $.ajax(settings);
    }

    /**
     * 调用指定的RPC
     * @param {*} options 
     * @param {*} callback 
     * @param {*} tags 
     */
    exec(options, callback, tags) {
      var data = {
        id: (++this.requestCount)
      };

      $.extend(data, options);

      var settings = {
        type: "POST",
        url: this.options.address,
        data: JSON.stringify(data),
        processData: false,
        success: (resultData, textStatus) => {
          if (callback) {
            callback(resultData, tags);
          }
        },
        error: (request, event, page) => {
          console.log(request);
          this.getSessionId(() => {
            this.exec(options, callback, tags);
          });
        }
      };
      $.ajax(settings);
    }

    /**
     * 添加种子链接
     * @param {*} url 
     * @param {*} callback 
     */
    addTorrentFromUrl(url, callback) {
      // 磁性连接（代码来自原版WEBUI）
      if (url.match(/^[0-9a-f]{40}$/i)) {
        url = 'magnet:?xt=urn:btih:' + url;
      }
      this.exec({
        method: "core.add_torrent_url",
        params: [url, null]
      }, (resultData) => {
        if (callback) {
          var result = {
            status: "",
            msg: ""
          }
          if (!resultData.error && resultData.result) {
            result.status = "success";
            result.msg = "URL已添加至 Deluge 。";
          }
          callback(result);
        }
        console.log(resultData);
      });
    }
  }

  window.deluge = Deluge;

})(jQuery, window)