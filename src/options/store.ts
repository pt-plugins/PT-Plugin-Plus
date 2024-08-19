import Vue from "vue";
import Vuex from "vuex";
import {MD5} from "crypto-js";
import {
  Options,
  EAction,
  Site,
  UIOptions,
  EModule,
  SearchSolution,
  SearchEntry,
  ECommonKey,
  IBackupServer
} from "@/interface/common";
import Extension from "@/service/extension";

class ExtensionWorker extends Extension {
  constructor() {
    super();
  }

  save(options: Options) {
    return this.sendRequest(EAction.saveConfig, null, options);
  }
}

const extension = new ExtensionWorker();

Vue.use(Vuex);
export default new Vuex.Store({
  /**
   * 状态
   */
  state: {
    options: {
      sites: [],
      clients: []
    } as Options,
    schemas: [],
    uiOptions: {} as UIOptions,
    initialized: false,
    searching: false
  },

  /**
   * 方法
   */
  mutations: {
    readConfig(state) {
      extension.sendRequest(EAction.readConfig, (options: Options) => {
        state.options = options;
      });
    },

    resetConfig(state, options) {
      let system = state.options.system;
      state.options = Object.assign({}, options);
      state.options.system = system;
      extension.sendRequest(EAction.saveConfig, null, state.options);
    },

    updateConfig(state, options) {
      Object.assign(state.options, options);
      extension.sendRequest(EAction.saveConfig, null, state.options);
    },

    /**
     * 添加一个站点
     * @param state 状态
     * @param site 站点配置
     */
    addSite(state, site) {
      state.options.sites.push(site);

      extension.sendRequest(EAction.saveConfig, null, state.options);
    },

    /**
     * 更新站点配置
     * @param state
     * @param site
     */
    updateSite(state, site) {
      let index = state.options.sites.findIndex(item => {
        return item.host === site.host;
      });

      if (index !== -1) {
        state.options.sites[index] = site;
        extension.sendRequest(EAction.saveConfig, null, state.options);
      }
    },

    /**
     * 删除指定的站点
     * @param state
     * @param site
     */
    removeSite(state, site) {
      let index = state.options.sites.findIndex(item => {
        return item.host === site.host;
      });

      if (index !== -1) {
        state.options.sites.splice(index, 1);
        extension.sendRequest(EAction.saveConfig, null, state.options);
      }
    },

    /**
     * 添加下载服务器
     * @param state
     * @param item
     */
    addClient(state, item) {
      item.id = MD5(new Date().toString()).toString();
      state.options.clients.push(item);

      extension.sendRequest(EAction.saveConfig, null, state.options);
    },

    /**
     * 更新下载服务器配置
     * @param state
     * @param item
     */
    updateClient(state, item) {
      let index = state.options.clients.findIndex(data => {
        return item.id === data.id;
      });

      if (index !== -1) {
        state.options.clients[index] = item;
        extension.sendRequest(EAction.saveConfig, null, state.options);
      }
    },

    /**
     * 删除指定下载服务器
     * @param state
     * @param item
     */
    removeClient(state, item) {
      let index = state.options.clients.findIndex(data => {
        return data.id === item.id;
      });

      if (index !== -1) {
        let client = state.options.clients[index];
        if (state.options.defaultClientId == client.id) {
          state.options.defaultClientId = "";
        }
        state.options.clients.splice(index, 1);
        extension.sendRequest(EAction.saveConfig, null, state.options);
      }
    },

    clearClients(state) {
      state.options.clients = [];
      state.options.defaultClientId = "";
      extension.sendRequest(EAction.saveConfig, null, state.options);
    },

    /**
     * 更新指定客户端的保存目录信息
     * @param state
     * @param options
     */
    updatePathsOfClient(state, options) {
      let client = state.options.clients.find(data => {
        return options.clientId === data.id;
      });
      if (client) {
        if (!client.paths) {
          client.paths = {};
        }

        if (options.site?.host) {
          client.paths[options.site.host] = options.paths;
        } else {
          // 如果未指定网站，则用于所有站点
          client.paths[ECommonKey.allSite] = options.paths;
        }

        extension.sendRequest(EAction.saveConfig, null, state.options);
      }
    },

    /**
     * 移除下载服务器已配置的保存目录
     * @param state
     * @param options
     */
    removePathsOfClient(state, options) {
      let client = state.options.clients.find(data => {
        return options.clientId === data.id;
      });
      if (client && client.paths) {
        let key = "";
        if (options.site) {
          key = options.site.host;
        } else {
          key = ECommonKey.allSite;
        }
        delete client.paths[key];
        extension.sendRequest(EAction.saveConfig, null, state.options);
      }
    },

    /**
     * 添加插件
     * @param state
     * @param options
     */
    addPlugin(state, options) {
      let site: any = state.options.sites.find((item: any) => {
        return item.host === options.host;
      });

      if (site) {
        if (!site.plugins) {
          site.plugins = [];
        }
        options.plugin.id = MD5(new Date().toString()).toString();
        site.plugins.push(options.plugin);
        extension.sendRequest(EAction.saveConfig, null, state.options);
      }
    },

    /**
     * 更新插件
     * @param state
     * @param options
     */
    updatePlugin(state, options) {
      let site: any = state.options.sites.find((item: any) => {
        return item.host === options.host;
      });
      if (site) {
        let index: any = site.plugins.findIndex((item: any) => {
          return item.id === options.plugin.id;
        });
        if (index !== -1) {
          site.plugins[index] = options.plugin;

          extension.sendRequest(EAction.saveConfig, null, state.options);
        }
      }
    },

    /**
     * 删除插件
     * @param state
     * @param options
     */
    removePlugin(state, options) {
      let site: any = state.options.sites.find((item: any) => {
        return item.host === options.host;
      });
      if (site) {
        let index: any = site.plugins.findIndex((item: any) => {
          return item.id === options.plugin.id;
        });
        if (index !== -1) {
          site.plugins.splice(index, 1);
          extension.sendRequest(EAction.saveConfig, null, state.options);
        }
      }
    },

    updateOptions(state, options: Options) {
      state.options = options;
    },

    updateUIOptions(state, options: UIOptions) {
      state.uiOptions = options;
    },

    updateSearchStatus(state, searching: boolean) {
      state.searching = searching;
    }
  },
  actions: {
    /**
     * 重置运行时配置
     * @param param0
     */
    resetRunTimeOptions({ commit, state }, options: Options) {
      extension
        .sendRequest(EAction.resetRunTimeOptions, null, options)
        .then(result => {
          commit("updateOptions", result);
        })
        .catch(error => {
          console.log("store.resetRunTimeOptions.error", error);
        });
    },

    readConfig({ commit, state }): Promise<any> {
      return new Promise<any>((resolve?: any, reject?: any) => {
        extension.sendRequest(EAction.writeLog, null, {
          module: EModule.options,
          event: "Options.readConfig",
          msg: "开始加载配置信息"
        });
        extension
          .sendRequest(EAction.readConfig)
          .then((options: Options) => {
            commit("updateOptions", options);
            if (!options.system) {
              extension.sendRequest(EAction.writeLog, null, {
                module: EModule.options,
                event: "Options.readConfig.Error",
                msg: "配置信息加载失败，没有获取到系统定义信息"
              });
              reject("Options.readConfig.Error");
              return;
            }

            if (!options.system.clients || !options.system.schemas) {
              extension.sendRequest(EAction.writeLog, null, {
                module: EModule.options,
                event: "Options.readConfig.Error",
                msg: "配置信息加载失败，没有获取到下载服务器或站点架构信息"
              });
              reject("Options.readConfig.Error");
              return;
            }

            extension.sendRequest(EAction.writeLog, null, {
              module: EModule.options,
              event: "Options.readConfig.Finished",
              msg: "配置加载完成"
            });

            state.initialized = true;
            resolve(options);
          })
          .catch(e => {
            reject(e);
          });
      });
    },

    saveConfig({ commit, state }, options: Options) {
      let _options: Options = Object.assign({}, state.options);
      Object.assign(_options, options);

      extension
        .sendRequest(EAction.saveConfig, null, _options)
        .then(() => {
          commit("updateOptions", _options);
        })
        .catch(error => {
          console.log("store.saveConfig.error", error);
        });
    },

    readUIOptions({ commit }): Promise<any> {
      return new Promise<any>((resolve?: any, reject?: any) => {
        extension
          .sendRequest(EAction.readUIOptions)
          .then((options: UIOptions) => {
            commit("updateUIOptions", options);
            resolve(options);
          })
          .catch(error => {
            console.log("store.saveConfig.error", error);
            reject(error);
          });
      });
    },

    saveUIOptions({ commit, state }, options: UIOptions) {
      let _options: UIOptions = Object.assign({}, state.uiOptions);
      Object.assign(_options, options);
      extension
        .sendRequest(EAction.saveUIOptions, null, _options)
        .then(() => {
          commit("updateUIOptions", _options);
        })
        .catch();
    },

    updatePagination({ commit, state }, data: any) {
      let paginations = state.uiOptions.paginations || {};

      paginations[data.key] = data.options;
      state.uiOptions.paginations = paginations;
      extension
        .sendRequest(EAction.saveUIOptions, null, state.uiOptions)
        .then(() => {
          commit("updateUIOptions", state.uiOptions);
        })
        .catch();
    },

    /**
     * 更新视图相关参数
     * @param param0
     * @param data
     */
    updateViewOptions({ commit, state }, data: any) {
      let views = state.uiOptions.views || {};

      views[data.key] = data.options;
      state.uiOptions.views = views;
      extension
        .sendRequest(EAction.saveUIOptions, null, state.uiOptions)
        .then(() => {
          commit("updateUIOptions", state.uiOptions);
        })
        .catch();
    },

    /**
     * 添加/更新搜索方案
     * @param state
     * @param options
     */
    updateSearchSolution({ commit, state }, options: SearchSolution) {
      let index: number = -1;
      if (state.options.searchSolutions) {
        index = state.options.searchSolutions.findIndex((e: SearchSolution) => {
          return e.id === options.id;
        });
      }

      let _options: Options = Object.assign({}, state.options);

      if (!_options.searchSolutions) {
        _options.searchSolutions = [];
      }
      if (index == -1) {
        options.id = MD5(new Date().toString()).toString();
        _options.searchSolutions.push(options);
      } else {
        _options.searchSolutions[index] = options;
      }

      extension
        .save(_options)
        .then(() => {
          commit("updateOptions", _options);
        })
        .catch();
    },

    /**
     * 删除搜索方案
     * @param state
     * @param options
     */
    removeSearchSolution({ commit, state }, options) {
      let index: number = -1;
      if (state.options.searchSolutions) {
        index = state.options.searchSolutions.findIndex((e: SearchSolution) => {
          return e.id === options.id;
        });
      }

      let _options: Options = Object.assign({}, state.options);

      if (!_options.searchSolutions) {
        return;
      }

      if (index > -1) {
        if (_options.defaultSearchSolutionId == options.id) {
          _options.defaultSearchSolutionId = "";
        }
        _options.searchSolutions.splice(index, 1);
        extension
          .save(_options)
          .then(() => {
            commit("updateOptions", _options);
          })
          .catch();
      }
    },

    /**
     * 添加搜索入口
     * @param state
     * @param options
     */
    addSiteSearchEntry({ commit, state }, options) {
      let _options: Options = Object.assign({}, state.options);

      let site: any = _options.sites.find((item: any) => {
        return item.host === options.host;
      });

      if (site) {
        if (!site.searchEntry) {
          site.searchEntry = [];
        }
        options.item.id = MD5(new Date().toString()).toString();
        site.searchEntry.push(options.item);

        commit("updateOptions", _options);
        extension.save(_options);
      }
    },

    /**
     * 更新插件
     * @param state
     * @param options
     */
    updateSiteSearchEntry({ commit, state }, options) {
      let _options: Options = Object.assign({}, state.options);

      let site: any = _options.sites.find((item: any) => {
        return item.host === options.host;
      });

      if (site) {
        let index: any = site.searchEntry.findIndex((item: SearchEntry) => {
          return item.isCustom && item.id === options.item.id;
        });
        if (index !== -1) {
          site.searchEntry[index] = options.item;

          commit("updateOptions", _options);
          extension.save(_options);
        }
      }
    },

    /**
     * 删除插件
     * @param state
     * @param options
     */
    removeSiteSearchEntry({ commit, state }, options) {
      let _options: Options = Object.assign({}, state.options);

      let site: any = _options.sites.find((item: any) => {
        return item.host === options.host;
      });
      if (site) {
        let index: any = site.searchEntry.findIndex((item: any) => {
          return item.isCustom && item.id === options.item.id;
        });
        if (index !== -1) {
          site.searchEntry.splice(index, 1);
          commit("updateOptions", _options);
          extension.save(_options);
        }
      }
    },

    addLanguage({ commit, state }, options) {
      extension
        .sendRequest(EAction.addLanguage, null, options)
        .then(() => {})
        .catch(error => {});
    },

    replaceLanguage({ commit, state }, options) {
      extension
        .sendRequest(EAction.replaceLanguage, null, options)
        .then(() => {})
        .catch(error => {});
    },

    /**
     * 添加备份服务器
     * @param param0
     * @param server
     */
    addBackupServer({ commit, state }, server: IBackupServer) {
      let _options: Options = Object.assign({}, state.options);

      if (!_options.backupServers) {
        _options.backupServers = [];
      }

      server.id = MD5(new Date().toString()).toString();
      _options.backupServers.push(server);

      commit("updateOptions", _options);
      extension.save(_options);
    },

    /**
     * 更新备份服务器
     * @param param0
     * @param newData
     */
    updateBackupServer({ commit, state }, newData: IBackupServer) {
      let _options: Options = Object.assign({}, state.options);

      if (_options.backupServers) {
        let index = _options.backupServers.findIndex((item: IBackupServer) => {
          return item.id === newData.id;
        });

        if (index !== -1) {
          _options.backupServers[index] = newData;

          commit("updateOptions", _options);
          extension.save(_options);
        }
      }
    },

    /**
     * 删除备份服务器
     * @param param0
     * @param newData
     */
    removeBackupServer({ commit, state }, newData: IBackupServer) {
      let _options: Options = Object.assign({}, state.options);

      if (_options.backupServers) {
        let index = _options.backupServers.findIndex((item: IBackupServer) => {
          return item.id === newData.id;
        });

        if (index !== -1) {
          _options.backupServers.splice(index, 1);

          commit("updateOptions", _options);
          extension.save(_options);
        }
      }
    }
  },
  getters: {
    sites: state => {
      return (
        state.options.system &&
        state.options.system.sites &&
        state.options.system.sites.filter((site: Site) => {
          if (state.options.sites) {
            return (
              state.options.sites.findIndex(item => {
                return item.host === site.host;
              }) === -1
            );
          } else {
            return true;
          }
        })
      );
    },
    clients: state => {
      return (
        state.options.system &&
        state.options.system.clients &&
        state.options.system.clients.filter((systemItem: any) => {
          if (state.options.clients) {
            return (
              state.options.clients.findIndex(item => {
                return item.name === systemItem.name;
              }) === -1
            );
          } else {
            return true;
          }
        })
      );
    },
    defaultClient: state => {
      if (!state.options.defaultClientId) {
        return null;
      }
      return state.options.clients.find(data => {
        return state.options.defaultClientId === data.id;
      });
    },
    /**
     * 获取指定客户端配置
     * @param clientId
     */
    clientOptions: state => (site: Site, clientId: string = "") => {
      if (!clientId) {
        clientId =
          site.defaultClientId || <string>state.options.defaultClientId;
      }

      let client = state.options.clients.find((item: any) => {
        return item.id === clientId;
      });

      return client;
    },

    /**
     * 获取当前站点的默认下载目录
     * @param string clientId 指定客户端ID，不指定表示使用默认下载客户端
     * @return string 目录信息，如果没有定义，则返回空字符串
     */
    siteDefaultPath: state => (site: Site, clientId: string = ""): string => {
      if (!clientId) {
        clientId =
          site.defaultClientId || <string>state.options.defaultClientId;
      }

      let client = state.options.clients.find((item: any) => {
        return item.id === clientId;
      });
      let path = "";
      if (client?.paths) {
        for (const host in client.paths) {
          if (site.host === host) {
            path = client.paths[host][0];
            break;
          }
        }
      }

      return path;
    },

    pagination: state => (key: string, defalutValue: any) => {
      if (state.uiOptions && state.uiOptions.paginations) {
        return state.uiOptions.paginations[key] || defalutValue;
      }
      return defalutValue;
    },

    viewsOptions: state => (key: string, defalutValue: any) => {
      if (state.uiOptions && state.uiOptions.views) {
        return state.uiOptions.views[key] || defalutValue;
      }
      return defalutValue;
    }
  }
});

// 用于本地调试
window.chrome = window.chrome || {};

// 更新当前TabId
if (chrome?.tabs) {
  chrome.tabs.getCurrent((tab: any) => {
    extension.sendRequest(EAction.updateOptionsTabId, null, tab.id);
  });
}
