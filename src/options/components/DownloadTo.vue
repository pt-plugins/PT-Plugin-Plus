<template>
  <v-btn
    :flat="flat"
    :icon="icon"
    :small="small"
    :loading="loading"
    @click.stop="showSiteContentMenus"
    :class="[mini?'btn-mini':'']"
    :title="title||$t('searchTorrent.sendToClientTip')"
    :color="color"
  >
    <v-icon v-if="haveSuccess" color="success" small>done</v-icon>
    <v-icon v-else-if="haveError" color="red" small>close</v-icon>
    <v-icon v-else small>{{ iconText }}</v-icon>
    <span v-if="!!label" class="ml-2">{{ label }}</span>
  </v-btn>
</template>
<script lang="ts">
import Vue from "vue";
import {
  Options,
  DownloadClient,
  ECommonKey,
  DownloadOptions,
  Site,
  EAction,
  ICollection
} from "@/interface/common";
import { PathHandler } from "@/service/pathHandler";
import Extension from "@/service/extension";
import { PPF } from "@/service/public";

const extension = new Extension();

export default Vue.extend({
  props: {
    flat: Boolean,
    icon: Boolean,
    small: Boolean,
    mini: Boolean,
    color: String,
    iconText: {
      type: String,
      default: "cloud_download"
    },
    downloadOptions: {
      type: [Object, Array],
      default: () => {
        return {
          host: String,
          url: String
        };
      }
    },
    getOptionsOnly: Boolean,
    label: String,
    title: String,
    payload: [Object, Array, String, Number]
  },

  data() {
    return {
      options: this.$store.state.options as Options,
      contentMenus: [] as any[],
      pathHandler: new PathHandler(),
      loading: false,
      site: {} as Site,
      haveSuccess: false,
      haveError: false,
      allContentMenus: [] as any[]
    };
  },

  methods: {
    /**
     * 根据指定的站点获取可用的下载目录及客户端信息
     * @param site
     */
    getSiteContentMenus(host: string): any[] {
      let results: any[] = [];
      let clients: any[] = [];

      if (this.contentMenus && this.contentMenus.length > 0) {
        return this.contentMenus;
      }

      /**
       * 增加下载目录
       * @param paths
       * @param client
       */
      function pushPath(paths: string[], client: any) {
        paths.forEach((path: string) => {
          results.push({
            client,
            path,
            host
          });
        });
      }

      this.options.clients.forEach((client: DownloadClient) => {
        clients.push({
          client: client,
          path: "",
          host
        });

        if (client.paths) {
          // 根据已定义的路径创建菜单
          for (const _host in client.paths) {
            let paths = client.paths[_host];

            if (host !== _host) {
              continue;
            }

            pushPath(paths, client);
          }

          // 最后添加当前客户端适用于所有站点的目录
          let publicPaths = client.paths[ECommonKey.allSite];
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

      this.contentMenus = results;

      return results;
    },

    /**
     * 根据指定的域名获取站点配置信息
     * @param host 域名
     */
    getSiteFromHost(host: string): Site {
      return this.options.sites.find((item: Site) => {
        let cdn = item.cdn || [];
        item.url && cdn.push(item.url);
        return item.host == host || cdn.join("").indexOf(host) > -1;
      });
    },

    /**
     * 显示指定链接的下载服务器及目录菜单
     * @param options
     * @param event
     */
    showSiteContentMenus(event: any) {
      if (Array.isArray(this.downloadOptions)) {
        this.showAllContentMenus(event);
        return;
      }
      let options = this.downloadOptions;
      let host = options.host;
      if (!host && options.site) {
        host = options.site.host;
      }

      if (!host) {
        return;
      }

      this.site = options.site || this.getSiteFromHost(host);
      let items = this.getSiteContentMenus(host);
      let menus: any[] = [];

      items.forEach((item: any) => {
        if (item.client && item.client.name) {
          let title = this.$vuetify.breakpoint.xs
            ? item.client.name
            : this.$t("searchTorrent.downloadTo", {
                path: `${item.client.name} -> ${item.client.address}`
              });

          if (item.path) {
            title += ` ->${this.pathHandler.replacePathKey(
              item.path,
              this.site
            )}`;
          }
          menus.push({
            title,
            fn: () => {
              if (options.url) {
                console.log(options, item);
                const downloadOptions = {
                  url: options.url,
                  title: options.title,
                  savePath: item.path,
                  autoStart: item.client.autoStart,
                  tagIMDb: item.client.tagIMDb,
                  link: options.link,
                  clientId: item.client.id,
                  imdbId: options.imdbId
                };

                if (this.getOptionsOnly) {
                  downloadOptions.savePath = this.pathHandler.getSavePath(
                    downloadOptions.savePath,
                    this.site
                  );
                  this.$emit("itemClick", {
                    payload: this.payload,
                    downloadOptions: Object.assign(
                      {
                        clientName: item.client.name
                      },
                      downloadOptions
                    )
                  });
                  return;
                }
                this.sendToClient(downloadOptions);
              }
            }
          });
        } else {
          menus.push({});
        }
      });

      PPF.showContextMenu(menus, event);
    },

    /**
     * 显示批量下载时可用下载服务器菜单
     * @param event
     */
    showAllContentMenus(event: any) {
      let clients: any[] = [];
      let menus: any[] = [];
      let _this = this;

      function addMenu(item: any) {
        let title = _this
          .$t("searchTorrent.downloadTo", {
            path: `${item.client.name} -> ${item.client.address}`
          })
          .toString();
        if (item.path) {
          title += ` -> ${item.path}`;
        }
        menus.push({
          title: title,
          fn: () => {
            _this.sendTorrentsInBackground(item);
          }
        });
      }

      if (this.allContentMenus.length == 0) {
        this.options.clients.forEach((client: DownloadClient) => {
          clients.push({
            client: client,
            path: ""
          });
        });
        clients.forEach((item: any) => {
          if (item.client && item.client.name) {
            addMenu(item);

            if (item.client.paths) {
              // 添加适用于所有站点的目录
              let publicPaths = item.client.paths[ECommonKey.allSite];
              if (publicPaths) {
                publicPaths.forEach((path: string) => {
                  // 去除带关键字的目录
                  if (
                    path.indexOf("$site.name$") == -1 &&
                    path.indexOf("$site.host$") == -1 &&
                    path.indexOf("<...>") == -1
                  ) {
                    let _item = PPF.clone(item);
                    _item.path = path;
                    addMenu(_item);
                  }
                });
              }
            }
          } else {
            menus.push({});
          }
        });
        this.allContentMenus = menus;
      } else {
        menus = this.allContentMenus;
      }

      PPF.showContextMenu(menus, event);
    },

    /**
     * 发送下载任务到后台
     */
    sendTorrentsInBackground(options: any) {
      let items: DownloadOptions[] = [];
      this.downloadOptions.forEach((item: ICollection | DownloadOptions) => {
        items.push({
          title: item.title,
          url: item.url,
          clientId: options.client.id,
          savePath: options.path,
          autoStart: options.client.autoStart,
          tagIMDb: options.client.tagIMDb,
          link: item.link,
          imdbId: item.imdbId
        });
      });

      this.loading = true;
      extension
        .sendRequest(EAction.sendTorrentsInBackground, null, items)
        .then((result: any) => {
          console.log("命令执行完成", result);
          this.haveSuccess = true;
          this.$emit("success", result);
        })
        .catch((result: any) => {
          console.log(result);
          this.haveError = true;
          this.$emit("error", result.msg || result);
        })
        .finally(() => {
          this.loading = false;
          setTimeout(() => {
            this.clearStatus();
          }, 5000);
        });
    },

    sendToClient(downloadOptions: DownloadOptions) {
      this.clearStatus();
      let savePath = this.pathHandler.getSavePath(
        downloadOptions.savePath,
        this.site
      );
      // 取消
      if (savePath === false) {
        return;
      }
      this.loading = true;
      downloadOptions.savePath = savePath;

      extension
        .sendRequest(EAction.sendTorrentToClient, null, downloadOptions)
        .then((result: any) => {
          console.log("命令执行完成", result);
          if (result.type == "success") {
            this.haveSuccess = true;
            this.$emit("success", result.msg);
          } else {
            this.haveError = true;
            this.$emit("error", result.msg);
          }
        })
        .catch((result: any) => {
          console.log(result);
          this.haveError = true;
          this.$emit("error", result.msg || result);
        })
        .finally(() => {
          this.loading = false;
          setTimeout(() => {
            this.clearStatus();
          }, 5000);
        });
    },

    clearStatus() {
      this.haveSuccess = false;
      this.haveError = false;
    }
  }
});
</script>