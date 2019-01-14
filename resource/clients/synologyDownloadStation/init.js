/**
 * @see https://global.download.synology.com/download/Document/DeveloperGuide/Synology_Download_Station_Web_API.pdf
 */
(function ($, window) {
  class Client {

    init(options) {
      this.options = options;
      this.sessionId = "";
      this.version = 2;
      if (this.options.address.substr(-1) == "/") {
        this.options.address = this.options.address.substr(0, this.options.address.length - 1);
      }
    }

    /**
     * 获取 SID
     */
    getSessionId() {
      return new Promise((resolve, reject) => {
        let url = `${this.options.address}/webapi/auth.cgi?api=SYNO.API.Auth&version=${this.version}&method=login&account=${this.options.loginName}&passwd=${this.options.loginPwd}&session=DownloadStation&format=sid`;
        $.ajax({
          url,
          timeout: PTBackgroundService.options.connectClientTimeout,
          dataType: "json"
        }).done((result) => {
          console.log(result)
          if (result && result.success) {
            this.sessionId = result.data.sid;
            resolve(this.sessionId)
          } else {
            reject({
              status: "error",
              code: result.error.code,
              msg: "身份验证失败"
            })
          }
          /**
            400 No such account or incorrect password
            401 Account disabled
            402 Permission denied
            403 2-step verification code required
            404 Failed to authenticate 2-step verification code
           */

        }).fail(() => {
          reject()
        })
      })
    }

    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      console.log("synologyDownloadStation.call", action, data);
      return new Promise((resolve, reject) => {
        switch (action) {
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data, (result) => {
              if (result && result.success) {
                resolve(result);
              } else {
                reject(result)
              }
            });
            break;

            // 测试是否可连接
          case "testClientConnectivity":
            this.getSessionId().then(result => {
              resolve(result != "");
            }).catch(result => {
              reject(result);
            })
            break;
        }
      });
    }

    /**
     * 添加种子链接
     * @param {*} options 
     * @param {*} callback 
     */
    addTorrentFromUrl(options, callback) {
      if (!this.sessionId) {
        this.getSessionId().then((result) => {
          if (result) {
            this.addTorrentFromUrl(options, callback)
          } else {
            callback({
              status: "error",
              msg: "服务器连接失败"
            })
          }
        }).catch((result) => {
          callback(result)
        })
        return;
      }
      let path = [`${this.options.address}/webapi/DownloadStation/task.cgi?api=SYNO.DownloadStation.Task`,
        `version=${this.version}`,
        `method=create`,
        `_sid=${this.sessionId}`,
        `uri=` + encodeURIComponent(options.url),
        `destination=` + encodeURIComponent(options.savePath)
      ];
      $.ajax({
        url: path.join("&"),
        timeout: PTBackgroundService.options.connectClientTimeout,
        dataType: "json"
      }).done((result) => {
        console.log(result)
        callback(result)
      }).fail(() => {
        callback({
          status: "error",
          msg: "服务器连接失败"
        })
      })
    }
  }
  // 添加到 window 对象，用于客户页面调用
  window.synologyDownloadStation = Client;
})(jQuery, window)