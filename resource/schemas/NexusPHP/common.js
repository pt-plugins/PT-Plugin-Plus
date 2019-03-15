String.prototype.getQueryString = function (name, split) {
  if (split == undefined) split = "&";
  var reg = new RegExp(
      "(^|" + split + "|\\?)" + name + "=([^" + split + "]*)(" + split + "|$)"
    ),
    r;
  if ((r = this.match(reg))) return decodeURI(r[2]);
  return null;
};

(function ($, window) {
  class Common {
    constructor() {
      this.siteContentMenus = {};
      this.defaultPath = PTSevrice.getSiteDefaultPath();
      this.downloadClientType = PTSevrice.downloadClientType;
      this.defaultClientOptions = PTSevrice.getClientOptions();
    }

    /**
     * 初始化当前默认服务器可用空间
     */
    initFreeSpaceButton() {
      if (!this.defaultPath) {
        return;
      }
      PTSevrice.call(
        PTSevrice.action.getFreeSpace, {
          path: this.defaultPath,
          clientId: PTSevrice.site.defaultClientId
        }
      ).then((result) => {
        console.log("命令执行完成", result);
        if (result && result.arguments) {
          // console.log(PTSevrice.filters.formatSize(result.arguments["size-bytes"]));

          PTSevrice.addButton({
            title: "默认服务器剩余空间\n" + this.defaultPath,
            icon: "filter_drama",
            label: PTSevrice.filters.formatSize(result.arguments["size-bytes"])
          })

        }
        // success();
      }).catch(() => {
        // error()
      });
    }

    /**
     * 初始化种子详情页面按钮
     */
    initDetailButtons() {
      // 添加下载按钮
      this.addSendTorrentToDefaultClientButton();

      // 添加下载到按钮
      this.addSendTorrentToClientButton();

      // 添加复制下载链接按钮
      this.addCopyTextToClipboardButton();

      this.initFreeSpaceButton();
    }

    /**
     * 发送种子到默认下载服务器
     * @param {string} url 
     */
    sendTorrentToDefaultClient(option, showNotice = true) {
      return new Promise((resolve, reject) => {
        if (typeof option === "string") {
          option = {
            url: option,
            title: ""
          }
        }

        let notice = null;
        if (showNotice) {
          notice = PTSevrice.showNotice({
            type: "info",
            msg: "正在发送下载链接到服务器，请稍候……"
          });
        }

        PTSevrice.call(
          PTSevrice.action.sendTorrentToDefaultClient, {
            url: option.url,
            title: option.title,
            savePath: this.defaultPath,
            autoStart: this.defaultClientOptions.autoStart
          }
        ).then(result => {
          notice && notice.hide();
          console.log("命令执行完成", result);
          if (showNotice) {
            PTSevrice.showNotice(result);
          }
          resolve(result);
        }).catch((result) => {
          notice && notice.hide();
          PTSevrice.showNotice({
            msg: result && result.msg || result
          });
          reject(result);
        });
      });
    }

    /**
     * 发送种子到指定下载服务器
     * @param {string} url 
     */
    sendTorrentToClient(options, showNotice = true) {
      return new Promise((resolve, reject) => {
        if (typeof options === "string") {
          options = {
            url: options,
            title: ""
          }
        }

        if (!options.clientId) {
          reject("无效的下载服务器");
          return;
        }

        let notice = null;
        if (showNotice) {
          notice = PTSevrice.showNotice({
            type: "info",
            msg: "正在发送下载链接到服务器，请稍候……"
          });
        }

        PTSevrice.call(
          PTSevrice.action.sendTorrentToClient, options
        ).then(result => {
          notice && notice.hide();
          console.log("命令执行完成", result);
          if (showNotice) {
            PTSevrice.showNotice(result);
          }
          resolve(result);
        }).catch((result) => {
          notice && notice.hide();
          PTSevrice.showNotice({
            msg: result && result.msg || result
          });
          reject(result);
        });
      });
    }

    /**
     * 下载拖放的种子
     * @param {*} url 
     * @param {*} callback 
     */
    downloadFromDroper(data, callback) {
      if (typeof data === "string") {
        data = {
          url: data,
          title: ""
        };
      }

      let siteURL = PTSevrice.site.url;
      if (siteURL.substr(-1) != "/") {
        siteURL += "/";
      }

      if (PTSevrice.site.schema == "NexusPHP") {
        if (!data.url.getQueryString) {
          PTSevrice.showNotice({
            msg: "系统依赖函数（getQueryString）未正确加载，请尝试刷新页面或重新启用插件。"
          });
          callback();
          return;
        }

        if (data.url.indexOf("download.php") == -1) {
          let id = data.url.getQueryString("id");
          if (id) {
            // 如果站点没有配置禁用https，则默认添加https链接
            data.url = siteURL + "download.php?id=" + id + (PTSevrice.site.passkey ? "&passkey=" + PTSevrice.site.passkey : "") + (PTSevrice.site.disableHttps ? "" : "&https=1");
          } else {
            data.url = "";
          }
        }
      }

      if (!data.url) {
        PTSevrice.showNotice({
          msg: "无效的链接"
        });
        callback();
        return;
      }

      this.sendTorrentToDefaultClient(data).then((result) => {
        callback(result);
      }).catch((result) => {
        callback(result);
      });
    }


    /**
     * 执行指定的操作
     * @param {*} action 需要执行的执令
     * @param {*} data 附加数据
     * @return Promise
     */
    call(action, data) {
      return new Promise((resolve, reject) => {
        switch (action) {
          // 从当前的DOM中获取下载链接地址
          case PTSevrice.action.downloadFromDroper:
            this.downloadFromDroper(data, () => {
              resolve()
            });
            break;
        }
      });
    }

    /**
     * 添加下载到指定下载服务器按钮
     */
    addSendTorrentToClientButton() {
      // 添加下载按钮
      PTSevrice.addButton({
        title: `将当前种子下载到指定的服务器`,
        icon: "save_alt",
        type: PTSevrice.buttonType.popup,
        label: "下载到…",
        /**
         * 单击事件
         * @param success 成功回调事件
         * @param error 失败回调事件
         * @param event 当前按钮事件
         * 
         * 两个事件必需执行一个，可以传递一个参数
         */
        click: (success, error, event) => {
          // getDownloadURL 方法有继承者提供
          if (!this.getDownloadURL) {
            error("getDownloadURL 方法未定义");
            return;
          }

          let url = this.getDownloadURL();

          if (!url) {
            error("获取下载链接失败");
            return;
          }

          let title = "";

          if (this.getTitle) {
            title = this.getTitle();
          }

          this.showContentMenusForUrl({
            url,
            title
          }, event.originalEvent, success, error);
        }
      });
    }

    /**
     * 添加一键下载按钮
     */
    addSendTorrentToDefaultClientButton() {
      // 添加下载按钮
      this.defaultClientOptions && PTSevrice.addButton({
        title: `将当前种子下载到[${this.defaultClientOptions.name}]` + (this.defaultPath ? "\n" + this.defaultPath : ""),
        icon: "get_app",
        label: "一键下载",
        /**
         * 单击事件
         * @param success 成功回调事件
         * @param error 失败回调事件
         * 
         * 两个事件必需执行一个，可以传递一个参数
         */
        click: (success, error) => {
          // getDownloadURL 方法有继承者提供
          if (!this.getDownloadURL) {
            error("getDownloadURL 方法未定义");
            return;
          }

          let url = this.getDownloadURL();

          if (!url) {
            error("获取下载链接失败");
            return;
          }

          let title = "";

          if (this.getTitle) {
            title = this.getTitle();
          }

          this.sendTorrentToDefaultClient({
            url,
            title
          }).then(() => {
            success();
          }).catch((result) => {
            error(result);
          });
        }
      });
    }

    /**
     * 添加复制下载链接按钮
     */
    addCopyTextToClipboardButton() {
      // 复制下载链接
      PTSevrice.addButton({
        title: "复制下载链接到剪切板",
        icon: "file_copy",
        label: "复制链接",
        click: (success, error) => {
          // getDownloadURL 方法有继承者提供
          if (!this.getDownloadURL) {
            error("getDownloadURL 方法未定义");
            return;
          }

          console.log(PTSevrice.site, this.defaultPath);
          let url = this.getDownloadURL();

          if (!url) {
            error("获取下载链接失败");
            return;
          }

          PTSevrice.call(
            PTSevrice.action.copyTextToClipboard,
            url
          ).then((result) => {
            console.log("命令执行完成", result);
            success();
          }).catch((result) => {
            error(result)
          });
        }
      });
    }

    /**
     * 根据指定的URL获取可用的下载目录及客户端信息
     * @param url
     */
    getContentMenusForUrl(url) {
      let urlParser = PTSevrice.filters.parseURL(url);
      if (!urlParser.host) {
        return [];
      }
      let results = [];
      let clients = [];
      let host = urlParser.host;

      if (this.siteContentMenus[host]) {
        return this.siteContentMenus[host];
      }

      /**
       * 增加下载目录
       * @param paths
       * @param client
       */
      function pushPath(paths, client) {
        paths.forEach((path) => {
          results.push({
            client: client,
            path: path,
            host: host
          });
        });
      }

      PTSevrice.options.clients.forEach((client) => {
        clients.push({
          client: client,
          path: "",
          host: host
        });

        if (client.paths) {
          // 根据已定义的路径创建菜单
          for (const _host in client.paths) {
            let paths = client.paths[host];

            if (_host !== host) {
              continue;
            }

            pushPath(paths, client);
          }

          // 最后添加当前客户端适用于所有站点的目录
          let publicPaths = client.paths[PTSevrice.allSiteKey];
          if (publicPaths) {
            if (results.length > 0) {
              results.push({});
            }

            pushPath(publicPaths, client);
          }

        }
      });

      if (results.length > 0) {
        clients.splice(0, 0, {});
      }

      results = results.concat(clients);

      this.siteContentMenus[host] = results;

      return results;
    }

    /**
     * 显示指定链接的下载服务器及目录菜单
     * @param options
     * @param event
     */
    showContentMenusForUrl(options, event, success, error) {
      let items = this.getContentMenusForUrl(options.url);
      let menus = [];

      items.forEach((item) => {
        if (item.client && item.client.name) {
          menus.push({
            title: `下载到：${item.client.name} -> ${item.client.address}` +
              (item.path ? ` -> ${item.path}` : ""),
            fn: () => {
              if (options.url) {
                // console.log(options, item);
                this.sendTorrentToClient({
                  clientId: item.client.id,
                  url: options.url,
                  title: options.title,
                  savePath: item.path,
                  autoStart: item.client.autoStart
                }).then((result) => {
                  success();
                }).catch((result) => {
                  error(result);
                });
              }
            }
          });
        } else {
          menus.push({});
        }
      });

      console.log(items, menus);

      basicContext.show(menus, event);
      $(".basicContext").css({
        left: "-=20px",
        top: "+=10px"
      });
    }
  }

  window.NexusPHPCommon = Common;
})(jQuery, window);