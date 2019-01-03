// https://global.download.synology.com/download/Document/DeveloperGuide/Synology_Download_Station_Web_API.pdf
(function ($, window) {
  class Client {

    init(options) {
      this.options = options;
      this.sessionId = "";
      this.version = 2;
    }

    /**
     * 获取 SID
     */
    getSessionId() {
      return new Promise((resolve, reject) => {
        let url = `${this.options.address}/webapi/auth.cgi?api=SYNO.API.Auth&version=${this.version}&method=login&account=${this.options.loginName}&passwd=${this.options.loginPwd}&session=DownloadStation&format=sid`;
        $.getJSON(url).then((result) => {
          console.log(result)
          if (result && result.success) {
            this.sessionId = result.data.sid;
          }
          resolve()
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
        }
      });
    }

    exec() {

    }

    /**
     * 添加种子链接
     * @param {*} options 
     * @param {*} callback 
     */
    addTorrentFromUrl(options, callback) {
      if (!this.sessionId) {
        this.getSessionId().then(() => {
          this.addTorrentFromUrl(options, callback)
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
      $.getJSON(path.join("&")).then((result) => {
        console.log(result)
        callback(result)
      })
    }
  }
  // 添加到 window 对象，用于客户页面调用
  window.synologyDownloadStation = Client;
})(jQuery, window)