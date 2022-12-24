<template>
  <div>
    <v-alert :value="true" type="info">{{
      $t("keepUploadTask.title")
    }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn
          color="error"
          :disabled="selected.length == 0"
          @click="removeSelected"
        >
          <v-icon class="mr-2">remove</v-icon>
          {{ $t("common.remove") }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length == 0">
          <v-icon class="mr-2">clear</v-icon>
          {{ $t("common.clear") }}
        </v-btn>

        <v-btn
          color="info"
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/keep-upload-task"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-icon class="mr-2">help</v-icon>
          {{ $t("settings.searchSolution.index.help") }}
        </v-btn>
        <v-spacer></v-spacer>

        <v-text-field
          v-model="filterKey"
          class="search"
          append-icon="search"
          :label="$t('keepUploadTask.filterSearchResults')"
          single-line
          hide-details
          enterkeyhint="search"
        ></v-text-field>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :search="filterKey"
        :custom-filter="searchResultFilter"
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="id"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <tr @click="props.expanded = !props.expanded">
            <td style="width: 20px">
              <v-checkbox
                v-model="props.selected"
                primary
                hide-details
              ></v-checkbox>
            </td>
            <td class="text-xs-center">
              <v-avatar size="18">
                <img :src="props.item.site.icon" />
              </v-avatar>
              <br />
              <span class="caption">{{ props.item.site.name }}</span>
            </td>
            <!-- 标题 -->
            <td class="py-2">
              <a
                class="subheading"
                :href="props.item.items[0].link"
                target="_blank"
                v-html="props.item.title"
                :title="props.item.title"
                rel="noopener noreferrer nofollow"
              ></a>
              <div class="body-1">
                <span v-if="props.item.items[0].subTitle">{{
                  props.item.items[0].subTitle
                }}</span>
              </div>
              <div class="caption">
                {{ $t("keepUploadTask.savePath")
                }}{{ props.item.downloadOptions.clientName }} ->
                {{
                  props.item.downloadOptions.savePath ||
                  $t("keepUploadTask.defaultPath")
                }}
                <DownloadTo
                  flat
                  icon
                  small
                  :title="$t('keepUploadTask.setSavePath')"
                  iconText="edit"
                  get-options-only
                  @itemClick="setDownloadOptions"
                  :payload="props.item"
                  :downloadOptions="props.item.items[0]"
                />
              </div>
              <div class="caption">
                {{ $t("keepUploadTask.torrentCount")
                }}{{ props.item.items.length }}
              </div>
            </td>
            <!-- 大小 -->
            <td class="text-xs-right">{{ props.item.size | formatSize }}</td>
            <td>{{ props.item.time | formatDate }}</td>
            <td>
              <v-btn
                small
                color="success"
                icon
                flat
                :title="$t('keepUploadTask.sendBaseTorrent')"
                class="mx-0"
                @click.stop="sendBaseTorrent(props.item)"
              >
                <v-icon small>filter_1</v-icon>
              </v-btn>
              <v-btn
                small
                color="info"
                icon
                flat
                :title="$t('keepUploadTask.sendOtherTorrents')"
                class="mx-0"
                @click.stop="sendOtherTorrents(props.item)"
              >
                <v-icon small>filter_2</v-icon>
              </v-btn>

              <v-btn
                small
                color="primary"
                icon
                flat
                :title="$t('keepUploadTask.sendAllTorrents')"
                class="mx-0"
                @click.stop="sendAllTorrents(props.item)"
              >
                <v-icon small>save_alt</v-icon>
              </v-btn>

              <!-- 复制下载链接 -->
              <v-btn
                color="info"
                small
                icon
                flat
                :title="$t('searchTorrent.copyToClipboardTip')"
                @click.stop="copyLinksToClipboard(props.item)"
                class="mx-0"
              >
                <v-icon small>file_copy</v-icon>
              </v-btn>

              <v-btn
                small
                color="error"
                icon
                flat
                @click.stop="removeConfirm(props.item)"
                class="mx-0"
                :title="$t('common.remove')"
              >
                <v-icon small>delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </template>

        <template slot="expand" slot-scope="props">
          <v-list subheader dense class="ml-5">
            <template v-for="item in props.item.items">
              <v-list-tile :key="item.link" class="ml-5">
                <v-list-tile-avatar>
                  <v-avatar size="18">
                    <img :src="item.site.icon" />
                  </v-avatar>
                </v-list-tile-avatar>

                <v-list-tile-content>
                  <v-list-tile-title>
                    <a
                      :href="item.link"
                      target="_blank"
                      v-html="item.title"
                      :title="item.title"
                      rel="noopener noreferrer nofollow"
                    ></a>
                  </v-list-tile-title>
                  <v-list-tile-sub-title>{{
                    item.subTitle
                  }}</v-list-tile-sub-title>
                </v-list-tile-content>
              </v-list-tile>
            </template>
          </v-list>
        </template>
      </v-data-table>
    </v-card>

    <v-alert :value="true" color="warning">
      <div>
        警告：
        <ul>
          <li>
            辅种前请确认下载服务器已关闭类似于 “自动开始下载” 的选项（如果有）。
          </li>
          <li>
            助手仅对种子文件做简单验证，不保证辅种成功，请自行斟酌是否要使用辅种功能！
          </li>
          <li>
            如出现因辅种失败造成的爆仓，由用户自行负责！别找我，别找我，别找我。
          </li>
        </ul>
      </div>
    </v-alert>

    <!-- 删除确认 -->
    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{
          $t("keepUploadTask.removeConfirmTitle")
        }}</v-card-title>

        <v-card-text>{{ $t("keepUploadTask.removeConfirm") }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm = false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t("common.cancel") }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove()">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t("common.ok") }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{
      errorMsg
    }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{
      successMsg
    }}</v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import {
  EAction,
  DownloadOptions,
  Site,
  Dictionary,
  IKeepUploadTask
} from "@/interface/common";
import Extension from "@/service/extension";
import { PPF } from "@/service/public";
import DownloadTo from "@/options/components/DownloadTo.vue";

const extension = new Extension();
export default Vue.extend({
  components: {
    DownloadTo
  },
  data() {
    return {
      selected: [],
      selectedItem: {} as any,
      pagination: {
        rowsPerPage: 10,
        sortBy: "time",
        descending: true
      },
      items: [] as any[],
      dialogRemoveConfirm: false,
      options: this.$store.state.options,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      siteCache: {} as Dictionary<any>,
      filterKey: "",
      // 已过滤的数据
      filteredDatas: [] as any
    };
  },

  methods: {
    setDownloadOptions(options: any) {
      console.log(options);
      options.payload.downloadOptions = options.downloadOptions;

      extension.sendRequest(
        EAction.updateKeepUploadTask,
        null,
        options.payload
      );
    },
    clear() {
      if (confirm(this.$t("keepUploadTask.clearConfirm").toString())) {
        extension
          .sendRequest(EAction.clearKeepUploadTask)
          .then((result: any) => {
            console.log("clearKeepUploadTask", result);
            this.items = [];
          });
      }
    },

    removeSelected() {
      if (this.selected && this.selected.length > 0) {
        if (
          confirm(
            this.$t("common.removeSelectedConfirm", {
              count: this.selected.length
            }).toString()
          )
        ) {
          this.remove(this.selected);
        }
      }
    },

    remove(items: any) {
      if (!items) {
        items = [this.selectedItem];
      }

      extension
        .sendRequest(EAction.removeKeepUploadTask, null, items)
        .then((result: any) => {
          console.log("removeKeepUploadTask", result);
          this.resetItems(result);
        });
      this.dialogRemoveConfirm = false;
    },

    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    resetItems(result: any[]) {
      this.items = [];
      result.forEach((data: any) => {
        data.items.forEach((item: any) => {
          item.site = PPF.getSiteFromHost(item.host, this.options);
        });

        data.site = PPF.getSiteFromHost(data.items[0].host, this.options);

        this.items.push(data);
      });
    },
    loadKeepUploadTask() {
      extension
        .sendRequest(EAction.loadKeepUploadTask)
        .then((result: any[]) => {
          console.log(result);
          this.resetItems(result);
        });
    },
    getInfos(item: IKeepUploadTask) {
      let result = "";

      return result;
    },
    clearMessage() {
      this.successMsg = "";
      this.errorMsg = "";
    },
    sendBaseTorrent(source: any) {
      this.sendTorrentsInBackground(source.downloadOptions);
    },
    sendOtherTorrents(source: any) {
      let items: DownloadOptions[] = [];
      source.items.slice(1).forEach((item: any) => {
        let downloadOptions = PPF.clone(source.downloadOptions);
        downloadOptions = Object.assign(downloadOptions, {
          title: item.title,
          url: item.url,
          link: item.link,
          imdbId: item.imdbId
        });
        items.push(downloadOptions);
      });

      this.sendTorrentsInBackground(items);
    },
    sendAllTorrents(source: any) {
      let items: DownloadOptions[] = [];
      source.items.forEach((item: any) => {
        let downloadOptions = PPF.clone(source.downloadOptions);
        downloadOptions = Object.assign(downloadOptions, {
          title: item.title,
          url: item.url,
          link: item.link,
          imdbId: item.imdbId
        });
        items.push(downloadOptions);
      });

      this.sendTorrentsInBackground(items);
    },
    /**
     * 发送下载任务到后台
     */
    sendTorrentsInBackground(items: DownloadOptions[]) {
      console.log(items);

      if (items.length > 1) {
        if (
          !confirm(
            this.$t("keepUploadTask.sendConfirm", {
              count: items.length
            }).toString()
          )
        ) {
          return;
        }
      }

      extension
        .sendRequest(EAction.sendTorrentsInBackground, null, items)
        .then((result: any) => {
          this.successMsg = this.$t("keepUploadTask.sendSuccess").toString();
          console.log("命令执行完成", result);

          this.$emit("success", result);
        })
        .catch((result: any) => {
          console.log(result);
          this.errorMsg = this.$t("keepUploadTask.sendError").toString();
        })
        .finally(() => { });
    },

    copyLinksToClipboard(source: any) {
      let urls: string[] = [];

      source.items.forEach((item: any) => {
        urls.push(item.url);
      });

      this.clearMessage();
      extension
        .sendRequest(EAction.copyTextToClipboard, null, urls.join("\n"))
        .then(result => {
          this.successMsg = this.$t(
            "searchTorrent.copySelectedToClipboardSuccess",
            {
              count: urls.length
            }
          ).toString();
        })
        .catch(() => {
          this.errorMsg = this.$t(
            "searchTorrent.copyLinkToClipboardError"
          ).toString();
        });
    },
    /**
     * 搜索结果过滤器，用于用户二次过滤
     * @param items
     * @param search
     */
     searchResultFilter(items: any[], search: string) {
      search = search.toString().toLowerCase();
      this.filteredDatas = [];
      if (search.trim() === "") return items;

      // 以空格分隔要过滤的关键字
      let searchs = search.split(" ");

      this.filteredDatas = items.filter((item: IKeepUploadTask) => {
        // 过滤标题和副标题
        let source = (item.title + (item.items[0].subTitle || "")).toLowerCase();
        let result = true;
        searchs.forEach((key) => {
          if (key.trim() != "") {
            result = result && source.indexOf(key) > -1;
          }
        });
        return result;
      });
      return this.filteredDatas;
    },
  },

  created() {
    this.loadKeepUploadTask();
  },

  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("keepUploadTask.headers.site"),
          align: "center",
          width: "60px",
          value: "site.name"
        },
        {
          text: this.$t("keepUploadTask.headers.title"),
          align: "left",
          value: "title"
        },
        {
          text: this.$t("keepUploadTask.headers.size"),
          align: "right",
          value: "size"
        },
        {
          text: this.$t("keepUploadTask.headers.time"),
          align: "left",
          value: "time"
        },
        {
          text: this.$t("history.headers.action"),
          value: "name",
          sortable: false
        }
      ];
    }
  },

  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  }
});
</script>
<style lang="scss" >
.v-datatable .caption {
  line-height: 1px!important;
}
</style>