<template>
  <v-dialog
    v-model="dialog"
    persistent
    scrollable
    max-width="1024"
    :fullscreen="$vuetify.breakpoint.smAndDown"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        dark
        v-on="on"
        small
        :class="$vuetify.breakpoint.smAndUp ? '' : 'mini'"
        :title="$t('keepUploadTask.keepUpload')"
        :color="color"
      >
        <v-icon small>merge_type</v-icon>
        <span class="ml-2">{{ label || $t("keepUploadTask.keepUpload") }}</span>
      </v-btn>
    </template>
    <v-card>
      <v-toolbar dark color="blue-grey darken-2">
        <v-toolbar-title>{{
          $t("keepUploadTask.verification")
        }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          flat
          color="success"
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/keep-upload-task"
          target="_blank"
          rel="noopener noreferrer nofollow"
          :title="$t('common.help')"
        >
          <v-icon>help</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text style="max-height: 80vh">
        <v-list two-line subheader dense>
          <template v-for="(item, index) in verifiedItems">
            <v-subheader v-if="index == 0" :key="index">{{
              $t("keepUploadTask.baseTorrent")
            }}</v-subheader>
            <v-subheader v-if="index == 1" :key="index">{{
              $t("keepUploadTask.otherTorrent")
            }}</v-subheader>
            <v-list-tile :key="item.title">
              <v-list-tile-avatar>
                <v-avatar size="18">
                  <img :src="item.data.site.icon" />
                </v-avatar>
              </v-list-tile-avatar>

              <v-list-tile-content>
                <v-list-tile-title class="list-item">
                  <a
                    :href="item.data.link"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    >{{ item.data.title }}</a
                  >
                </v-list-tile-title>
                <v-list-tile-sub-title
                  >{{ $t("keepUploadTask.size")
                  }}{{ item.data.size | formatSize }},
                  {{ $t("keepUploadTask.fileCount")
                  }}{{ item.torrent ? item.torrent.files.length : "N/A" }},
                  {{ $t("keepUploadTask.status.label")
                  }}{{ item.status }}</v-list-tile-sub-title
                >
              </v-list-tile-content>

              <v-list-tile-action>
                <div>
                  <v-btn
                    icon
                    v-if="
                      verifiedItems[0].verified &&
                      !item.loading &&
                      !item.verified &&
                      index > 0
                    "
                    :title="$t('keepUploadTask.addToKeepUpload')"
                    @click.stop="addToVerified(item)"
                    class="mr-1"
                  >
                    <v-icon color="info">add</v-icon>
                  </v-btn>

                  <v-btn
                    icon
                    v-if="
                      verifiedItems[0].verified &&
                      !item.loading &&
                      !item.torrent &&
                      index > 0
                    "
                    :title="$t('keepUploadTask.redownload')"
                    @click.stop="reDownload(index)"
                    class="mr-1"
                  >
                    <v-icon color="green">sync</v-icon>
                  </v-btn>

                  <v-btn icon :loading="item.loading" :title="item.status">
                    <v-icon color="success" v-if="item.verified"
                      >done_all</v-icon
                    >
                    <v-icon color="error" :title="$t('keepUploadTask.removeFromKeepUpload')" @click.stop="deleteVerifiedItem(index)" v-else>clear</v-icon>
                  </v-btn>
                </div>
              </v-list-tile-action>
            </v-list-tile>
            <v-divider v-if="index > 0" :key="'d' + index" inset></v-divider>
          </template>
        </v-list>
      </v-card-text>
      <v-divider v-if="$vuetify.breakpoint.smAndDown"></v-divider>
      <div
        v-if="$vuetify.breakpoint.smAndDown && downloadOptions"
        class="caption ml-1 py-2"
      >
        {{ $t("keepUploadTask.savePath")
        }}{{
          downloadOptions
            ? `${downloadOptions.clientName} -> ${downloadOptions.savePath}`
            : ""
        }}
      </div>
      <v-divider></v-divider>
      <v-card-actions>
        <template v-if="verifiedCount > 1">
          <DownloadTo
            flat
            get-options-only
            small
            :label="
              $vuetify.breakpoint.smAndDown
                ? $t('keepUploadTask.setSavePath')
                : downloadOptions
                ? `${downloadOptions.clientName} -> ${downloadOptions.savePath}`
                : $t('keepUploadTask.setSavePath')
            "
            @itemClick="setDownloadOptions"
            :downloadOptions="items[0]"
          />
          <v-btn
            flat
            small
            @click="create"
            v-if="downloadOptions && verifiedItems.length > 0"
            :loading="creating"
            color="info"
          >
            <v-icon small>date_range</v-icon>
            <span class="ml-2">{{ $t("keepUploadTask.create") }}</span>
          </v-btn>
        </template>

        <v-spacer></v-spacer>
        <v-btn color="error" flat @click="dialog = false">{{
          $t("common.close")
        }}</v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{
      errorMsg
    }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{
      successMsg
    }}</v-snackbar>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import { SearchResultItem, EAction, IKeepUploadTask } from "@/interface/common";
import DownloadTo from "@/options/components/DownloadTo.vue";
import Extension from "@/service/extension";
import { PPF } from "@/service/public";
import { ParsedFile } from "parse-torrent-file";
const extension = new Extension();

interface IVerifiedItem {
  data: any;
  torrent: any;
  loading: boolean;
  verified: boolean;
  status: string;
  error: boolean;
}

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
      downloadOptions: null as any,
      creating: false,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      verifiedCount: 0
    };
  },
  props: {
    label: String,
    color: String,
    items: {
      type: Array as () => SearchResultItem[],
      default: () => {
        return [] as SearchResultItem[];
      }
    }
  },
  mounted() { },
  watch: {
    dialog() {
      if (this.dialog) {
        this.start();
      }
    },
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },
  methods: {
    deleteVerifiedItem(index: number){
      this.$delete(this.verifiedItems, index);
    },
    setDownloadOptions(options: any) {
      console.log(options);
      this.downloadOptions = options.downloadOptions;
    },
    /**
     * 生成辅种任务
     */
    create() {
      if (this.verifiedItems.length == 0 || !this.downloadOptions) {
        return;
      }
      this.creating = true;
      let task = {
        title: this.verifiedItems[0].data.title,
        size: this.verifiedItems[0].data.size,
        downloadOptions: this.downloadOptions,
        items: [] as any[]
      };

      let items: any[] = [];

      this.verifiedItems.forEach((item: IVerifiedItem) => {
        if (item.verified) {
          let _item = PPF.clone(item);
          if (_item.data.site) {
            _item.data.host = _item.data.site.host;
            delete _item.data.site;
          }

          // 移除一些用不到的内容
          [
            "author",
            "category",
            "comments",
            "completed",
            "entryName",
            "status",
            "tags",
            "titleHTML",
            "progress",
            "seeders",
            "leechers"
          ].forEach((key: string) => {
            if (_item.data.hasOwnProperty(key)) {
              delete _item.data[key];
            }
          });

          items.push(_item.data);
        }
      });

      if (items.length == 0) {
        this.errorMsg = this.$t("keepUploadTask.noItem").toString();
        this.creating = false;
        return;
      }

      task.items = items;

      console.log(task);

      extension
        .sendRequest(EAction.createKeepUploadTask, null, task)
        .then(result => {
          this.successMsg = this.$t("keepUploadTask.createSuccess").toString();
          setTimeout(() => {
            this.creating = false;
            this.dialog = false;
          }, 3000);
          console.log("createKeepUploadTask", result);

           // 生成辅种任务后清除选择
           this.$root.$emit('KeepUploadTaskCreateSuccess');
        })
        .catch(() => {
          this.creating = false;
          this.errorMsg = this.$t("keepUploadTask.createError").toString();
        });
    },
    start() {
      this.baseTorrent = null;
      this.verifiedItems = [];
      this.verifiedCount = 0;
      this.downloadOptions = null;
      this.clearMessage();

      this.items.forEach((item: SearchResultItem, index: number) => {
      if (item.url) {
        this.verifiedItems.push({
          data: item,
          torrent: null,
          loading: true,
          verified: false,
          status: this.$t("keepUploadTask.status.downloading").toString()
        });
        // requests.push(this.getTorrent(item.url, index));
        this.getTorrent(item.url, index)
          .then((result: any) => {
            this.verification(result, index);
          })
          .catch(() => {
            this.verification(null, index);
          });
        }
      });
    },
    reDownload(index: number)
    {
      this.verifiedItems[index].loading = true;
      this.verifiedItems[index].status = this.$t("keepUploadTask.status.downloading").toString();

      this.getTorrent(this.verifiedItems[index].data.url, index)
        .then((result: any) => {
          this.verification(result, index);
        })
        .catch(() => {
          this.verification(null, index);
        });
    },
    /**
     * 验证
     */
    verification(item: IVerifiedItem | null, index: number) {
      if (index == 0) {
        if (!this.baseTorrent) {
          this.baseTorrent = item;

          this.verifiedItems[0].loading = false;
          if (item) {
            this.verifiedItems[0].torrent = this.baseTorrent.torrent;
            this.verifiedItems[0].verified = true;
            this.verifiedItems[0].status = this.$t(
              "keepUploadTask.status.downloaded"
            ).toString();
            this.verifiedCount++;
          } else {
            this.verifiedItems[0].verified = false;
          }
        }
      } else {
        // 如果基准种子未下载完成，则等待
        if (this.verifiedItems[0].loading) {
          setTimeout(() => {
            this.verification(item, index);
          }, 200);
          return;
        }
        let result: any = {
          verified: false,
          torrent: null,
          loading: false
        };

        if (!this.verifiedItems[0].verified) {
          result.status = this.$t("keepUploadTask.status.failed").toString();
        }

        if (!item || !this.verifiedItems[0].verified) {
          this.verifiedItems[index] = Object.assign(
            this.verifiedItems[index],
            result
          );
          return;
        }

        const torrent = item.torrent;
        const baseTorrent = this.baseTorrent.torrent;

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

        result.torrent = torrent;
        if (result.verified) {
          this.verifiedCount++;
        }

        result.status = result.verified
          ? this.$t("keepUploadTask.status.success").toString()
          : this.$t("keepUploadTask.status.failed").toString();

        // 验证是否因为文件顺序错误或缺少文件而失败
        if (!result.verified && torrent.name == baseTorrent.name &&
          torrent.length <= baseTorrent.length &&
          torrent.files.length <= baseTorrent.files.length)
        {
          if (torrent.files.every((file: any) =>
          {
            return baseTorrent.files.find((sourceFile: any) => 
              file.path == sourceFile.path && file.length == sourceFile.length
            );
          }))
          {
            if (torrent.files.length == baseTorrent.files.length)
              result.status = this.$t("keepUploadTask.status.incorrectOrder").toString();
            else
              result.status = this.$t("keepUploadTask.status.missingFiles").toString();
          }
        }

        this.verifiedItems[index] = Object.assign(
          this.verifiedItems[index],
          result
        );
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
            this.verifiedItems[index].status = this.$t(
              "keepUploadTask.status.waiting"
            ).toString();
            resolve(result);
          })
          .catch(result => {
            this.verifiedItems[index].status = this.$t(
              "keepUploadTask.status.downloadFailed"
            ).toString();
            this.verifiedItems[index].error = true;
            reject(result);
          });
      });
    },
    clearMessage() {
      this.successMsg = "";
      this.errorMsg = "";
    },
    addToVerified(item: IVerifiedItem) {
      if (
        window.confirm(
          this.$t("keepUploadTask.addToKeepUploadConfirm").toString()
        )
      ) {
        item.verified = true;
        this.verifiedCount++;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.list-item {
  a {
    color: #000;
    text-decoration: none;
  }

  a:hover {
    color: #008c00;
  }
}
</style>
