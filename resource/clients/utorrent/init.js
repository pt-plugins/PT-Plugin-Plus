(function ($, window) {
  class uTorrent {
    /**
     * 初始化实例
     * @param {*} options
     * loginName: 登录名
     * loginPwd: 登录密码
     * url: 服务器地址
     */
    init(options) {
      this.options = options;
      this.headers = [];
      this.token = "";
      if (options.loginName && options.loginPwd) {
        this.headers["Authorization"] =
          "Basic " +
          new Base64().encode(options.loginName + ":" + options.loginPwd);
      }

      if (this.options.address.indexOf("gui") == -1) {
        let url = PTSevriceFilters.parseURL(this.options.address);
        this.options.address = `${url.protocol}://${url.host}:${url.port}/gui/`;
      }
      console.log("uTorrent.init", this.options.address);
    }

    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      console.log("uTorrent.call", action, data);
      return new Promise((resolve, reject) => {
        switch (action) {
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data.url, result => {
              resolve(result);
            });
            break;

            // 测试是否可连接
          case "testClientConnectivity":
            this.getSessionId()
              .then(result => {
                resolve(result != "");
              })
              .catch(result => {
                reject(result);
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
      return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: this.options.address + "token.html?t=",
            headers: this.headers,
            timeout: PTBackgroundService.options.connectClientTimeout
          })
          .done(resultData => {
            console.log(resultData);
            this.token = $(resultData).html();
            this.isInitialized = true;
            if (callback) {
              callback(this.token);
            }
            resolve(this.token);
          })
          .fail((jqXHR, textStatus) => {
            let result = {
              status: "error",
              code: jqXHR.status,
              msg: "未知错误"
            };
            switch (jqXHR.status) {
              case 401:
                result.msg = "身份验证失败";
                break;
            }
            reject(result);
          });
      });
    }

    /**
     * 调用指定的RPC
     * @param {*} options
     * @param {*} callback
     * @param {*} tags
     */
    exec(options, callback, tags) {
      if (!this.token) {
        this.getSessionId().then(() => {
          this.exec(options, callback, tags);
        }).catch((result) => {
          callback && callback(result);
        });
        return;
      }
      var data = {};

      $.extend(data, options);

      var settings = {
        type: "GET",
        url: this.options.address + "?token=" + this.token,
        dataType: "json",
        data: data,
        timeout: PTBackgroundService.options.connectClientTimeout,
        success: (resultData, textStatus) => {
          if (callback) {
            callback(resultData, tags);
          }
        },
        error: (request, event, page) => {
          console.log(request);
          this.getSessionId().then(() => {
            this.exec(options, callback, tags);
          }).catch((result) => {
            callback && callback(result);
          });
        },
        headers: this.headers
      };
      $.ajax(settings);
    }

    // 添加种子
    addTorrentFromUrl(url, callback) {
      // 磁性连接（代码来自原版WEBUI）
      if (url.match(/^[0-9a-f]{40}$/i)) {
        url = "magnet:?xt=urn:btih:" + url;
      }
      this.exec({
          action: "add-url",
          s: url
        },
        resultData => {
          if (callback) {
            var result = {
              status: "",
              msg: ""
            };
            if (resultData.build) {
              result.status = "success";
              result.msg = "URL已添加至 µTorrent 。";
            }
            callback(result);
          }
          console.log(resultData);
        }
      );
    }
  }

  // 添加到 window 对象，用于客户页面调用
  window.utorrent = uTorrent;
})(jQuery, window);