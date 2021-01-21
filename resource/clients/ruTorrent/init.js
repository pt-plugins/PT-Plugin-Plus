/**
 * @see https://github.com/Novik/ruTorrent/blob/master/php/addtorrent.php
 * @see https://github.com/Rhilip/PT-Plugin/blob/master/src/script/client.js#L477_L543
 *
 */

(function($) {
  // ruTorrent
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
        address.push(`:${url.port}`);
      }
      address.push(url.path);
      if (url.path.substr(-1) !== "/") {
        address.push("/");
      }
      this.options.address = address.join("");

      console.log("ruTorrent.init", this.options.address);
    }

    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      console.log("ruTorrent.call", action, data);
      return new Promise((resolve, reject) => {
        switch (action) {
          case "addTorrentFromURL":
            this.addTorrentFromUrl(data, result => {
              if (result.result === "Success") {
                resolve(result);
              } else {
                reject(result);
              }
            });
            break;

          // 测试是否可连接
          case "testClientConnectivity":
            this.testClientConnectivity()
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
     * 测试可连接性
     * 鉴于ruTorrent没有相关方法，则考虑请求 `/php/getsettings.php` 页面，如果返回json格式的信息
     * 则说明可连接
     *
     * @see https://github.com/Novik/ruTorrent/blob/master/php/getsettings.php
     *
     * @param callback
     */
    testClientConnectivity(callback) {
      return new Promise((resolve, reject) => {
        $.ajax({
          type: "GET",
          url: this.options.address + "php/getsettings.php", // ping_addr
          username: this.options.loginName,
          password: this.options.loginPwd,
          timeout: PTBackgroundService.options.connectClientTimeout
        })
          .done((resultData, textStatus, request) => {
            this.isInitialized = true;
            if (callback) {
              callback(resultData);
            }
            resolve();
          })
          .fail((jqXHR, textStatus, errorThrown) => {
            reject(jqXHR.status, textStatus);
          });
      });
    }

    /**
     * 添加种子链接
     * @param {*} data
     * @param {*} callback
     */
    addTorrentFromUrl(data, callback) {
      let url = data.url;

      // 磁性连接
      if (url.startsWith("magnet:")) {
        this.addTorrent(
          {
            dir_edit: data.savePath,
            paused: !data.autoStart,
            url: url,
            json: 1 // 输出json格式
          },
          callback
        );
        return;
      }

      // 种子文件
      PTBackgroundService.requestMessage({
        action: "getTorrentDataFromURL",
        data: url
      })
        .then(result => {
          let formData = new FormData();
          formData.append("json", 1); // 输出json格式
          // 如果有传值时，则设置路径参数
          if (data.savePath) {
            formData.append("dir_edit", data.savePath);
          }

          formData.append("paused", !data.autoStart);
          formData.append("torrent_file", result, "file.torrent");

          this.addTorrent(formData, callback);
        })
        .catch(result => {
          callback && callback(result);
        });
    }

    /**
     * POST完成后会被302到类似  /php/addtorrent.php?result[]=Success&name[]=file.torrent&json=1
     * 得到类似 { "result" : "Success" } 的结果
     * 其中result取值为 enum(
     *    'Success',   // 添加成功
     *    'Failed',    // 添加失败（magnet，不存在种子文件，种子上传失败）
     *    'FailedURL', // 添加链接失败（ruT获取不到对应种子）
     *    'FailedFile' // 添加文件失败（rT返回错误）
     * )
     *
     *
     * @param data
     * @param callback
     */
    addTorrent(data, callback) {
      $.ajax({
        type: "POST",
        url: this.options.address + "php/addtorrent.php",
        username: this.options.loginName,
        password: this.options.loginPwd,
        timeout: PTBackgroundService.options.connectClientTimeout,
        data: data,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: (resultData, textStatus) => {
          if (callback) {
            callback(resultData);
          }
        }
      });
    }
  }

  // 添加到 window 对象，用于客户页面调用
  window.ruTorrent = Client;
})(jQuery, window);
