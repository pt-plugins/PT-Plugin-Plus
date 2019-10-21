<template>
  <v-dialog v-model="dialog" persistent scrollable max-width="1024">
    <template v-slot:activator="{ on }">
      <v-btn color="primary" dark v-on="on">保种</v-btn>
    </template>
    <v-card>
      <v-card-title class="headline">保种验证</v-card-title>
      <v-card-text style="max-height: 500px;">
        <v-list two-line subheader dense>
          <template v-for="(item, index) in verifiedItems">
            <v-subheader v-if="index==0" inset :key="index">基准文件</v-subheader>
            <v-subheader v-if="index==1" inset :key="index">验证文件</v-subheader>
            <v-list-tile :key="item.title">
              <v-list-tile-avatar>
                <v-avatar size="18">
                  <img :src="item.data.site.icon" />
                </v-avatar>
              </v-list-tile-avatar>

              <v-list-tile-content>
                <v-list-tile-title>{{ item.data.title }}</v-list-tile-title>
                <v-list-tile-sub-title>大小：{{ item.data.size | formatSize}}, 文件数：{{ item.torrent?item.torrent.files.length: '-' }}</v-list-tile-sub-title>
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
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" flat @click="dialog = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import parseTorrent from "parse-torrent";
import { SearchResultItem } from "@/interface/common";

export default Vue.extend({
  data() {
    return {
      dialog: false,
      verified: false,
      baseTorrent: null as any,
      loading: false,
      verifiedItems: [] as any[]
    };
  },
  props: {
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
    start() {
      let requests: Promise<any>[] = [];
      this.baseTorrent = null;
      this.verifiedItems = [];

      this.items.forEach((item: SearchResultItem) => {
        if (item.url) {
          this.verifiedItems.push({
            data: item,
            torrent: null,
            loading: true,
            verified: false
          });
          requests.push(this.parse(item.url));
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

        this.verifiedItems[i] = Object.assign(this.verifiedItems[i], result);
      }
    },
    parse(url: string): Promise<any> {
      return new Promise<any>((resolve?: any, reject?: any) => {
        parseTorrent.remote(url, (err, torrent) => {
          console.log(url, torrent);
          if (err) {
            console.log("parse.error", err);
            reject(err);
          } else {
            resolve({
              url,
              torrent
            });
          }
        });
      });
    }
  }
});
</script>