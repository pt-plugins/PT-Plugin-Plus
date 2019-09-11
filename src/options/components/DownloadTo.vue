<template>
  <v-btn :flat="flat" :icon="icon" :small="small" :loading="loading">
    <v-icon v-if="haveSuccess" color="success" small>done</v-icon>
    <v-icon v-else-if="haveError" color="red" small>close</v-icon>
    <v-icon
      v-else
      @click.stop="showSiteContentMenus"
      small
      :title="$t('searchTorrent.sendToClient')"
    >{{ iconText }}</v-icon>
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
  EAction
} from "@/interface/common";
import { PathHandler } from "@/service/pathHandler";

import * as basicContext from "basiccontext";
import Extension from "@/service/extension";

const extension = new Extension();

export default Vue.extend({
  props: {
    flat: Boolean,
    icon: Boolean,
    small: Boolean,
    iconText: {
      type: String,
      default: "cloud_download"
    },
    downloadOptions: {
      type: Object,
      default: () => {
        return {
          host: String,
          url: String
        };
      }
    }
  },

  data() {
    return {
      options: this.$store.state.options as Options,
      contentMenus: [] as any[],
      pathHandler: new PathHandler(),
      loading: false,
      site: {} as Site,
      haveSuccess: false,
      haveError: false
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
    showSiteContentMenus(event?: any) {
      let options = this.downloadOptions;

      let items = this.getSiteContentMenus(options.host);
      let menus: any[] = [];
      this.site = options.site || this.getSiteFromHost(options.host);

      items.forEach((item: any) => {
        if (item.client && item.client.name) {
          menus.push({
            title: this.$t("searchTorrent.downloadTo", {
              path:
                `${item.client.name} -> ${item.client.address}` +
                (item.path
                  ? ` -> ${this.pathHandler.replacePathKey(
                      item.path,
                      this.site
                    )}`
                  : "")
            }).toString(),
            fn: () => {
              if (options.url) {
                console.log(options, item);
                this.sendToClient({
                  url: options.url,
                  title: options.title,
                  savePath: item.path,
                  autoStart: item.client.autoStart,
                  link: options.link,
                  clientId: item.client.id
                });
              }
            }
          });
        } else {
          menus.push({});
        }
      });

      basicContext.show(menus, event);
      $(".basicContext").css({
        left: "-=20px",
        top: "+=10px"
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