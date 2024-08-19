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
          console.log('exec failed', jqXHR.status, textStatus, errorThrown)
          let res = {status: 'error', code: jqXHR.status, msg: ''}
          switch (jqXHR.status) {
            // Unsupported Media Type
            case 415:
              res.msg = i18n.t('downloadClient.unsupportedMediaType') //"种子文件有误"
              break;
            case 502:
              res.msg = i18n.t('downloadClient.serverIsUnavailable') //"服务器不可用或网络错误"
              break;
            // case 403:
            //   res.msg = i18n.t('downloadClient.permissionDenied')
            //   break;

            default:
              break;
          }
          console.log(jqXHR);
          if (res.msg) {
            callback(res)
            return
          }
          // 刷新 qb SessionId
          this.getSessionId()
            .then(() => {
              this.exec(options, callback, tags);
            })
            .catch((code, msg) => {
              console.log(`getSessionId failed: ${code}, ${msg}`)
              res.code = code
              if (code === 403) {
                res.msg = i18n.t('downloadClient.permissionDenied')
              } else if (code >= 500 && code < 600) {
                res.msg = i18n.t('downloadClient.serverIsUnavailable')
              } else {
                res.msg = msg || i18n.t('downloadClient.unknownError')
              }
              callback(res);
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
      let {savePath, category, clientOptions, siteConfig} = data, autoTMM = undefined, qbCategories
      let tags = [data.imdbId]

      if (savePath) {
        formData.append("savepath", data.savePath)
        // 禁用自动管理种子
        autoTMM = false
      } else {
        savePath = "_"
      }

      if (clientOptions && clientOptions.enableCategory) {
        qbCategories = clientOptions.qbCategories
        if (qbCategories && qbCategories.length > 0) {
          let qbCategory = qbCategories.find(c => c.path === savePath)
          // qb 4.5.2 实测 autoTMM 为 true 的情况下, 如果指定分类, 存储路径以分类为准.
          // 分类不存在时, 会自动创建分类, 路径为 `默认下载路径/分类名称`.
          // nastool 会自动维护分类, 这里不做那么细致的处理.
          // 所以路径不匹配的情况下, 需要禁用 autoTMM
          if (qbCategory) {
            // 以用户手动设置为准
            category = qbCategory.name
            autoTMM = true
          } else {
            autoTMM = false
          }
        }
      }

      if (clientOptions && siteConfig)  {
        let tmpTags = []
        // 以 frds 为例, 这里是 keepfrds
        if (clientOptions.hostnameAsTag) {
          let url = new URL(siteConfig.activeURL).hostname
          let arr = url.split('.')
          arr.pop()
          tmpTags.push(arr.pop())
        }
        // 以 frds 为例, 这里是 pt@keepfrds
        if (clientOptions.siteNameAsTag) {
          tmpTags.push(siteConfig.name)
        }
        tmpTags = tmpTags.filter(_ => !!_).map(_ => _.toLowerCase())
        if (clientOptions.customTags && clientOptions.customTags.length > 0) {
          tmpTags = tmpTags.concat(clientOptions.customTags)
        }
        tags = tags.concat(tmpTags)
      }

      tags = tags.filter(_ => !!_).join(',')

      if (autoTMM !== undefined) {
        formData.append("autoTMM", autoTMM);
      }

      if (category != undefined) {
        formData.append("category", category);
      }

      if (data.autoStart != undefined) {
        formData.append("paused", !data.autoStart);
      }

      if (tags) {
        formData.append("tags", tags);
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
          console.log(`/api/v2/torrents/add: ${JSON.stringify(resultData)}`)
          let result
          switch (typeof resultData) {
            case 'object':
              // this.exec 里面 catch 部分返回的信息
              result = Object.assign({status: '', msg: ''}, resultData)
              // 成功添加
              if (!resultData.error && resultData.result) {
                result = {status: 'success', msg: i18n.t('downloadClient.addURLSuccess', {name})}
              }
              // 无需定义 else
              break
            case 'string':
              let {name} = this.options
              if (resultData === 'Ok.') {
                result = {status: 'success', msg: i18n.t('downloadClient.addURLSuccess', {name})}
              } else if (resultData === 'Fails.') {
                // 如果前面都成功了, 这种情况是因为重复添加了种子
                result = {status: 'error', msg: i18n.t('downloadClient.duplicate', {name})}
              } else {
                console.log(`unknown result: ${resultData}`)
                result = {status: 'error', msg: `${i18n.t('downloadClient.unknownError')} -> ${resultData}`}
              }
              break
            default:
              console.log(`unknown result: ${resultData}`)
              result = {status: 'error', msg: `${i18n.t('downloadClient.unknownError')} -> ${resultData}`}
              break
          }
          if (callback) {
            callback(result);
          }
        }
      );
    }
  }

  window.qbittorrent = Client;
})(jQuery, window);
