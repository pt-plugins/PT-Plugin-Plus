/**
 * @see https://github.com/jesec/flood/tree/master/server/routes/api
 */

(function ($) {
  // Flood
  class Client {
    /**
     * 初始化实例
     * @param {*} options
     * loginName: 登录名
     * loginPwd: 登录密码
     * address: 服务器地址
     */
    init(options) {
      this.options = options;

      // 重写用户给的地址
      let url = PTServiceFilters.parseURL(this.options.address);
      let address = [url.protocol, "://", url.host];
      if (url.port) {
        address.push(`:${url.port}`)
      }
      address.push(url.path);
      if (url.path.substr(-1) !== "/") {
        address.push("/");
      }
      this.options.address = address.join("");


      console.log("Flood.init", this.options.address);
    }

    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      console.log("Flood.call", action, data);
      return new Promise((resolve, reject) => {
        switch (action) {
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data, (result) => {
              if (result.status === "success") {
                resolve(result);
              } else {
                reject(result);
              }
            });
            break;

          // 测试是否可连接
          case "testClientConnectivity":
            this.testClientConnectivity().then(result => {
              resolve(true);
            }).catch((code, msg) => {
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

    authenticate(callback) {
      // run the login first
      let options = this.options;
      $.ajax({
        type: "POST",
        url: options.address + "api/auth/authenticate",
        contentType: 'application/json',
        data: JSON.stringify({
          username: options.loginName,
          password: options.loginPwd,
        }),
        success: function (resultData, textStatus) {
          console.log(resultData);
          if (resultData.success) {
            console.log(resultData.token);
            if (callback && typeof callback === 'function') {
              callback(resultData);
            }
          }
        }
      });
    }

    /**
     * 测试可连接性
     * 接口返回 { isConnected: true } 时说明可连接
     *
     * @see https://github.com/Flood-UI/flood/blob/master/server/routes/client.js#L16-L36
     *
     * @param callback
     */
    testClientConnectivity(callback) {
      let that = this;
      return new Promise((resolve, reject) => {
        this.authenticate(function (authData) {
          $.ajax({
            type: 'GET',
            url: that.options.address + 'api/client/connection-test',  // ping_addr
            timeout: PTBackgroundService.options.connectClientTimeout
          }).done((resultData, textStatus, request) => {
            if (resultData.isConnected) {
              that.isInitialized = true;
              if (callback) {
                callback(resultData);
              }
              resolve();
            }
          }).fail((jqXHR, textStatus, errorThrown) => {
            reject(jqXHR.status, textStatus)
          })
        });
      })
    }

    /**
     * 添加种子链接
     *
     * @see https://github.com/Flood-UI/flood/blob/master/server/routes/client.js#L38-L44
     *
     * @param {*} data
     * @param {*} callback
     */
    addTorrentFromUrl(data, callback) {
      let url = data.url;

      let addTorrentData = {
        destination: data.savePath || '',
        /** isBasePath
         * @see https://github.com/Flood-UI/flood/blob/master/server/models/ClientRequest.js#L143-L149
         * @see https://rtorrent-docs.readthedocs.io/en/latest/cmd-ref.html
         */
        isBasePath: false,
        start: !data.autoStart,
        tag: [],
      }

      // 处理magent链接
      if (url.startsWith('magnet:')) {
        addTorrentData.urls = [url];

        this.addTorrentUrl(addTorrentData, callback);
        return;
      }

      // 种子文件
      PTBackgroundService.requestMessage({
        action: "getTorrentDataFromURL",
        data: url
      })
        .then((result) => {
          var fileReader = new FileReader();

          fileReader.onload = e => {
            var contents = e.target.result;
            var key = "base64,";
            var index = contents.indexOf(key);
            if (index == -1) {
              return;
            }
            var metainfo = contents.substring(index + key.length);
            addTorrentData.files = [metainfo];
            this.addTorrentFile(addTorrentData, callback);
          }
        })
        .catch((result) => {
          callback && callback(result);
        });
    }

    addTorrentUrl(data, callback) {
      this.addTorrent('api/torrents/add-urls', data, callback);
    }

    addTorrentFile(data, callback) {
      this.addTorrent('api/torrents/add-files', data, callback);
    }

    /**
     *
     * @param suffix
     * @param data
     * @param callback
     */
    addTorrent(suffix, data, callback) {
      let options = this.options;
      this.authenticate(function () {
        $.ajax({
          type: "POST",
          url: options.address + suffix,
          timeout: PTBackgroundService.options.connectClientTimeout,
          data: data,
          contentType: false,
          processData: false,
          success: (resultData, textStatus) => {
            if (callback) {
              var result = Object.assign({
                status: "success",
                msg: i18n.t("downloadClient.addURLSuccess", {
                  name: options.name
                })
              }, resultData);
              callback(result);
            }
          },
        })
      })

    }
  }

  // 添加到 window 对象，用于客户页面调用
  window.flood = Client;

})(jQuery, window);
