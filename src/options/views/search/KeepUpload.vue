<template>
  <v-dialog v-model="dialog" persistent scrollable max-width="1024">
    <template v-slot:activator="{ on }">
      <v-btn color="success" dark v-on="on" small>{{label}}</v-btn>
    </template>
    <v-card>
      <v-toolbar dark color="blue-grey darken-2">
        <v-toolbar-title>辅种验证</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card-text style="max-height: 500px;">
        <v-list two-line subheader dense>
          <template v-for="(item, index) in verifiedItems">
            <v-subheader v-if="index==0" :key="index">基准文件</v-subheader>
            <v-subheader v-if="index==1" :key="index">辅种文件</v-subheader>
            <v-list-tile :key="item.title">
              <v-list-tile-avatar>
                <v-avatar size="18">
                  <img :src="item.data.site.icon" />
                </v-avatar>
              </v-list-tile-avatar>

              <v-list-tile-content>
                <v-list-tile-title>{{ item.data.title }}</v-list-tile-title>
                <v-list-tile-sub-title>大小：{{ item.data.size | formatSize}}, 文件数：{{ item.torrent?item.torrent.files.length: '-' }}, 状态：{{ item.status }}</v-list-tile-sub-title>
              </v-list-tile-content>

              <v-list-tile-action>
                <v-btn icon :loading="item.loading">
                  <v-icon color="success" v-if="item.verified">done_all</v-icon>
                  <v-icon color="error" v-else>clear</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>
          </template>
        </v-list>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <template v-if="items.length>0">
          <DownloadTo
            flat
            get-options-only
            :label="downloadOptions?`${downloadOptions.clientName} -> ${downloadOptions.savePath}`:'设置保存路径'"
            @itemClick="setDownloadOptions"
            :downloadOptions="items[0]"
          />
          <v-btn flat @click="create" v-if="downloadOptions && verifiedItems.length>0">生成辅种任务</v-btn>
        </template>

        <v-spacer></v-spacer>
        <v-btn color="error" flat @click="dialog = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import { SearchResultItem, EAction } from "@/interface/common";
import DownloadTo from "@/options/components/DownloadTo.vue";
import Extension from "@/service/extension";
const extension = new Extension();

export default Vue.extend({
  components: {
    DownloadTo
  },
  data() {
    return {
      dialog: false,
      verified: false,
      baseTorrent: null as any,
      loading: false,
      verifiedItems: [] as any[],
      downloadOptions: null as any
    };
  },
  props: {
    label: {
      type: String,
      default: "辅种"
    },
    items: {
      type: Array as () => SearchResultItem[],
      default: () => {
        return [] as SearchResultItem[];
      }
    }
  },
  mounted() {},
  watch: {
    dialog() {
      if (this.dialog) {
        this.start();
      }
    }
  },
  methods: {
    setDownloadOptions(options: any) {
      console.log(options);
      this.downloadOptions = options;
    },
    create() {
      if (this.verifiedItems.length == 0 || !this.downloadOptions) {
        return;
      }
      let result = {
        title: this.verifiedItems[0].data.title,
        downloadOptions: this.downloadOptions,
        items: this.verifiedItems.filter((item: any) => {
          return item.verified === true;
        })
      };

      console.log(result);
    },
    start() {
      let requests: Promise<any>[] = [];
      this.baseTorrent = null;
      this.verifiedItems = [];

      this.items.forEach((item: SearchResultItem, index: number) => {
        if (item.url) {
          this.verifiedItems.push({
            data: item,
            torrent: null,
            loading: true,
            verified: false,
            status: "正在下载"
          });
          requests.push(this.getTorrent(item.url, index));
        }
      });

      Promise.all(requests)
        .then(results => {
          this.verification(results);
        })
        .catch(error => {
          console.log(error);
        });
    },
    /**
     * 验证
     */
    verification(items: any[]) {
      if (items.length == 1) {
        this.verified = true;
        return;
      }

      if (!this.baseTorrent) {
        this.baseTorrent = items[0];
      }

      const baseTorrent = this.baseTorrent.torrent;

      this.verifiedItems[0].loading = false;
      this.verifiedItems[0].torrent = baseTorrent;
      this.verifiedItems[0].verified = true;
      this.verifiedItems[0].status = "下载完成";

      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const torrent = item.torrent;

        let result: any = {
          verified: false,
          torrent,
          loading: false
        };

        // 验证名称、长度、及文件列表内容是否相同
        if (
          torrent.name == baseTorrent.name &&
          torrent.length == baseTorrent.length &&
          torrent.files.length == baseTorrent.files.length
        ) {
          result.verified = baseTorrent.files.every(
            (sourceFile: any, index: number) => {
              const file = torrent.files[index];

              return (
                file.path == sourceFile.path && file.length == sourceFile.length
              );
            }
          );
        }

        result.status = result.verified ? "校验成功" : "校验失败";

        this.verifiedItems[i] = Object.assign(this.verifiedItems[i], result);
      }
    },
    /**
     * 获取种子文件内容
     */
    getTorrent(url: string, index: number): Promise<any> {
      return new Promise<any>((resolve?: any, reject?: any) => {
        extension
          .sendRequest(EAction.getTorrentDataFromURL, null, {
            url,
            parseTorrent: true
          })
          .then(result => {
            console.log(result);
            this.verifiedItems[index].status = "等待校验";
            resolve(result);
          })
          .catch(result => {
            this.verifiedItems[index].status = "下载失败";
            reject(result);
          });
      });
    }
  }
});
</script>