/**
 * @see https://github.com/transmission/transmission/blob/master/extras/rpc-spec.txt
 */
(function ($, window) {
  const XHEADER = "X-Transmission-Session-Id";
  class Transmission {
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
        let url = PTServiceFilters.parseURL(this.options.address);

        let address = [
          url.protocol,
          "://",
          url.host
        ];
        if (url.port) {
          address.push(`:${url.port}`)
        }

        address.push(url.path);
        if (url.path.substr(-1) != "/") {
          address.push("/");
        }

        address.push("transmission/rpc");

        this.options.address = address.join("");
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
          // 从指定的URL添加种子
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data.url, data.savePath, data.autoStart, (result) => {
              resolve(result);
            }, data.upLoadLimit);
            break;

            // 获取可用空间
          case "getFreeSpace":
            this.getFreeSpace(data.path, (result) => {
              resolve(result);
            });

            break;

            // 测试是否可连接
          case "testClientConnectivity":
            this.sessionStats().then(result => {
              resolve(result.result == "success");
            }).catch(result => {
              reject(result);
            })
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
      return new Promise((resolve, reject) => {
        var data = {
          method: "",
          arguments: {},
          tag: ""
        };
        let result = {};

        $.extend(data, options);

        this.sendRequest({
          type: "POST",
          url: this.options.address,
          dataType: 'json',
          data: JSON.stringify(data),
          timeout: PTBackgroundService.options.connectClientTimeout,
          headers: this.headers
        }, (resultData) => {
          if (callback) {
            callback(resultData, tags);
          }
          resolve(resultData);
        }, (request, event, page) => {
          switch (request.status) {
            case 0:
              result = {
                status: "error",
                code: request.status,
                msg: i18n.t("downloadClient.serverIsUnavailable") //"服务器不可用或网络错误"
              };
              reject && reject(result)
              break;

            case 401:
              result = {
                status: "error",
                code: request.status,
                msg: i18n.t("downloadClient.permissionDenied") //"身份验证失败"
              };
              reject && reject(result)
              break;

            default:
              result = {
                status: "error",
                code: request.status,
                msg: event || i18n.t("downloadClient.unknownError") //"未知错误"
              };
              reject && reject(result)
              break;

          }
        });
      });
    }

    /**
     * 发送请求
     * @param {*} options
     * @param {*} success
     * @param {*} error
     */
    sendRequest(options, success, error) {
      $.ajax(options).done((resultData, textStatus) => {
        success && success(resultData, textStatus);
      }).fail((request, event, page) => {
        switch (request.status) {
          case 409:
            this.sessionId = request.getResponseHeader(XHEADER);
            this.headers[XHEADER] = this.sessionId;
            options.headers = this.headers;
            this.sendRequest(options, success, error);
            break;

          default:
            error && error(request, event, page);
            break;
        }

      });
    }

    sessionStats() {
      return this.exec({
        method: "session-stats"
      });
    }

    /**
     * 添加种子
     * @param string url 需要添加的地址
     * @param string savePath 保存目录，如果不指定则以服务器配置为准
     * @param bool autoStart 是否自动开始
     * @param function callback 回调
     */
    addTorrentFromUrl(url, savePath, autoStart, callback, uploadLimit = 0) {
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

      if (uploadLimit && uploadLimit > 0) {
        options.arguments["uploadLimit"] = uploadLimit;
      }

      // 磁性连接
      if (url.startsWith('magnet:')) {
        options.arguments["filename"] = url;
        this.addTorrent(options, callback)
      } else {
        PTBackgroundService.requestMessage({
            action: "getTorrentDataFromURL",
            data: url
          })
          .then((result) => {
            var fileReader = new FileReader();

            fileReader.onload = (e) => {
              var contents = e.target.result;
              var key = "base64,";
              var index = contents.indexOf(key);
              if (index == -1) {
                return;
              }
              var metainfo = contents.substring(index + key.length);

              delete options.arguments["filename"];
              options.arguments["metainfo"] = metainfo;

              this.addTorrent(options, callback);
            }
            fileReader.readAsDataURL(result);
          })
          .catch((result) => {
            callback && callback(result);
          });
      }
    }

    /**
     * 添加种子
     * @param {*} options
     * @param {*} callback
     */
    addTorrent(options, callback) {
      this.exec(options).then((data) => {
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
              callback(data.result || data);
            }
            break;

        }
      }).catch((result) => {
        callback && callback(result);
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
      }).then((result) => {
        callback && callback(result);
      }).catch((result) => {
        callback && callback(result);
      });
    }
  }

  // 添加到 window 对象，用于客户页面调用
  window.transmission = Transmission;
})(jQuery, window)
