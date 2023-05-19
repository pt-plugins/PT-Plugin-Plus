/**
 * @see https://github.com/qbittorrent/qBittorrent/wiki/Web-API-Documentation
 */
(function($) {
  //qBittorrent
  class Client {
    /**
     * 初始化实例
     * @param {*} options
     * loginName: 登录名
     * loginPwd: 登录密码
     * url: 服务器地址
     */
    init(options) {
      this.options = options;
      this.headers = {};
      this.sessionId = "";

      if (this.options.address.substr(-1) == "/") {
        this.options.address = this.options.address.substr(
          0,
          this.options.address.length - 1
        );
      }

      console.log("qBittorrent.init", this.options.address);
    }

    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      console.log("qBittorrent.call", action, data);
      return new Promise((resolve, reject) => {
        switch (action) {
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data, result => {
              if (result.status === "success") {
                resolve(result);
              } else {
                reject(result);
              }
            });
            break;

          // 测试是否可连接
          case "testClientConnectivity":
            this.getSessionId()
              .then(result => {
                resolve(true);
              })
              .catch((code, msg) => {
                reject({
                  status: "error",
                  code,
                  msg
                });
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
        var data = {
          username: this.options.loginName,
          password: this.options.loginPwd
        };

        // qb 需要禁用『启用跨站请求伪造保护』
        var settings = {
          type: "POST",
          url: this.options.address + "/api/v2/auth/login",
          data: data,
          timeout: PTBackgroundService.options.connectClientTimeout
        };
        $.ajax(settings)
          .done((resultData, textStatus, request) => {
            this.isInitialized = true;
            if (callback) {
              callback(resultData);
            }
            resolve();
            console.log(this.sessionId);
          })
          .fail((jqXHR, textStatus, errorThrown) => {
            reject(jqXHR.status, textStatus);
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
      var settings = {
        type: "POST",
        processData: false,
        contentType: false,
        method: "POST",
        url: this.options.address + options.method,
        data: options.params,
        timeout: PTBackgroundService.options.connectClientTimeout,
        success: (resultData, textStatus) => {
          if (callback) {
            callback(resultData, tags);
          }
        },
        error: (jqXHR, textStatus, errorThrown) => {
          switch (jqXHR.status) {
            // Unsupported Media Type
            case 415:
              callback({
                status: "error",
                code: jqXHR.status,
                msg: i18n.t("downloadClient.unsupportedMediaType") //"种子文件有误"
              });
              return;

            default:
              break;
          }
          console.log(jqXHR);
          this.getSessionId()
            .then(() => {
              this.exec(options, callback, tags);
            })
            .catch((code, msg) => {
              callback({
                status: "error",
                code,
                msg:
                  msg || code === 0
                    ? i18n.t("downloadClient.serverIsUnavailable")
                    : i18n.t("downloadClient.unknownError") //"服务器不可用或网络错误" : "未知错误"
              });
            });
        }
      };
      $.ajax(settings);
    }

    /**
     * 添加种子链接
     * @param {*} data
     * @param {*} callback
     */
    addTorrentFromUrl(data, callback) {
      let formData = new FormData();

      if (data.savePath) {
        formData.append("savepath", data.savePath);
        // 禁用自动管理种子
        formData.append("autoTMM", false);
      }

      if (data.autoStart != undefined) {
        formData.append("paused", !data.autoStart);
      }

      if (data.imdbId != undefined) {
        formData.append("tags", data.imdbId);
      }

      if (data.upLoadLimit && data.upLoadLimit > 0) {
        formData.append("upLimit", data.upLoadLimit * 1024);
      }

      let url = data.url;

      // 磁性连接
      if (url.startsWith('magnet:')) {
        formData.append('urls', url);
        this.addTorrent(formData, callback);
      } else {
        PTBackgroundService.requestMessage({
          action: "getTorrentDataFromURL",
          data: url
        })
          .then(result => {
            formData.append("torrents", result, "file.torrent");
            this.addTorrent(formData, callback);
          })
          .catch(result => {
            callback && callback(result);
          });
      }
    }

    addTorrent(params, callback) {
      this.exec(
        {
          method: "/api/v2/torrents/add",
          params: params
        },
        resultData => {
          if (callback) {
            var result = Object.assign(
              {
                status: "",
                msg: ""
              },
              resultData
            );
            if (
              (!resultData.error && resultData.result) ||
              resultData == "Ok."
            ) {
              result.status = "success";
              result.msg = i18n.t("downloadClient.addURLSuccess", {
                name: this.options.name
              }); //"URL已添加至 qBittorrent 。";
            }
            callback(result);
          }
          console.log(resultData);
        }
      );
    }
  }

  window.qbittorrent = Client;
})(jQuery, window);
