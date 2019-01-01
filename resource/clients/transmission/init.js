(function ($, window) {
  class Transmission {
    // headers = [];
    // options = {};

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
      if (options.loginName && options.loginPwd) {
        this.headers["Authorization"] = "Basic " + (new Base64()).encode(options.loginName + ":" + options.loginPwd);
      }

      if (this.options.address.indexOf("rpc") == -1) {
        let url = PTSevriceFilters.parseURL(this.options.address);
        this.options.address = `${url.protocol}://${url.host}:${url.port}/transmission/rpc`;
      }
      console.log("transmission.init", this.options.address);
    }

    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      console.log("transmission.call", action, data);
      return new Promise((resolve, reject) => {
        switch (action) {
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data.url, data.savePath, data.autoStart, (result) => {
              resolve(result);
            });
            break;

          case "getFreeSpace":
            this.getFreeSpace(data.path, (result) => {
              resolve(result);
            });

            break;
        }
      });
    }

    /**
     * 调用指定的RPC
     * @param {*} options 
     * @param {*} callback 
     * @param {*} tags 
     */
    exec(options, callback, tags) {
      var data = {
        method: "",
        arguments: {},
        tag: ""
      };

      $.extend(data, options);

      var settings = {
        type: "POST",
        url: this.options.address,
        dataType: 'json',
        data: JSON.stringify(data),
        success: (resultData, textStatus) => {
          if (callback) {
            callback(resultData, tags);
          }
        },
        error: (request, event, page) => {
          var SessionId = "";
          if (request.status === 409 && (SessionId = request.getResponseHeader('X-Transmission-Session-Id'))) {
            this.SessionId = SessionId;
            this.headers["X-Transmission-Session-Id"] = SessionId;
            settings.headers = this.headers;
            $.ajax(settings);
          } else {
            if (this.on.postError) {
              this.on.postError(request);
            }
          }
        },
        headers: this.headers
      };
      $.ajax(settings);
    }

    /**
     * 添加种子
     * @param string url 需要添加的地址
     * @param string savePath 保存目录，如果不指定则以服务器配置为准
     * @param bool autoStart 是否自动开始
     * @param function callback 回调
     */
    addTorrentFromUrl(url, savePath, autoStart, callback) {
      // 磁性连接（代码来自原版WEBUI）
      if (url.match(/^[0-9a-f]{40}$/i)) {
        url = 'magnet:?xt=urn:btih:' + url;
      }
      var options = {
        method: "torrent-add",
        arguments: {
          filename: url,
          paused: (!autoStart)
        }
      };

      if (savePath) {
        options.arguments["download-dir"] = savePath;
      }
      this.exec(options, (data) => {
        switch (data.result) {
          // 添加成功
          case "success":
            if (callback) {
              if (data.arguments["torrent-added"]) {
                callback(data.arguments["torrent-added"]);
              }
              // 重复的种子
              else if (data.arguments["torrent-duplicate"]) {
                callback({
                  status: "duplicate",
                  torrent: data.arguments["torrent-duplicate"]
                });
              }
            }
            break;

            // 重复的种子
          case "duplicate torrent":
          default:
            if (callback) {
              callback(data.result);
            }
            break;

        }
      });
    }

    /**
     * 獲取指定目錄的大小
     * @param string path 需要获取的目录地址
     * @param function callback 回调
     */
    getFreeSpace(path, callback) {
      this.exec({
        method: "free-space",
        arguments: {
          "path": path
        }
      }, function (result) {
        if (callback)
          callback(result);
      });
    }
  }

  // 添加到 window 对象，用于客户页面调用
  window.transmission = Transmission;
})(jQuery, window)