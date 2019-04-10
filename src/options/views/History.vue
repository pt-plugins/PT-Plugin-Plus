<template>
  <div class="history">
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="error" :disabled="selected.length==0">
          <v-icon class="mr-2">remove</v-icon>
          {{ words.remove }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length==0">
          <v-icon class="mr-2">clear</v-icon>
          {{ words.clear }}
        </v-btn>
        <v-spacer></v-spacer>

        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="data.url"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <!-- 站点 -->
          <td style="text-align: center;">
            <v-avatar size="18">
              <img :src="props.item.site.icon">
            </v-avatar>
            <br>
            <span class="captionText">{{ props.item.site.name }}</span>
          </td>
          <td>
            {{ props.item.data.title }}
            <br>
            <span
              class="sub-title"
            >[ {{ getClientName(props.item.data.clientId||props.item.clientId) }} ] -> {{ props.item.data.savePath || '默认目录' }}</span>
          </td>
          <td>
            <v-icon v-if="props.item.success===false" color="error" :title="words.fail">close</v-icon>
            <v-icon v-else color="success" :title="words.success">done</v-icon>
          </td>
          <td>{{ props.item.time | formatDate }}</td>
          <td>
            <v-icon
              small
              class="mr-2"
              @click="download(props.item)"
              :title="words.download"
            >cloud_download</v-icon>
            <v-icon small color="error" @click="removeConfirm(props.item)">delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 删除确认 -->
    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{ words.removeConfirmTitle }}</v-card-title>

        <v-card-text>{{ words.removeConfirm }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm=false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ words.cancel }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ words.ok }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { EAction, DownloadOptions, Site, Dictionary } from "@/interface/common";
import Extension from "@/service/extension";

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "下载历史",
        remove: "删除",
        clear: "清除",
        removeConfirm: "确认要删除这条记录吗？",
        removeConfirmTitle: "删除确认",
        clearConfirm: "确认要删除所有下载记录吗？",
        ok: "确认",
        cancel: "取消",
        download: "下载",
        fail: "失败",
        success: "成功"
      },
      selected: [],
      selectedItem: {} as any,
      pagination: {
        rowsPerPage: 10,
        sortBy: "time",
        descending: true
      },
      headers: [
        { text: "来源", align: "left", value: "data.host" },
        { text: "标题", align: "left", value: "data.title" },
        { text: "状态", align: "left", value: "data.success" },
        { text: "下载时间", align: "left", value: "time" },
        { text: "操作", value: "name", sortable: false }
      ],
      items: [] as any[],
      dialogRemoveConfirm: false,
      options: this.$store.state.options,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      siteCache: {} as Dictionary<any>
    };
  },

  methods: {
    clear() {
      if (confirm(this.words.clearConfirm)) {
        extension
          .sendRequest(EAction.clearDownloadHistory)
          .then((result: any) => {
            console.log("clearDownloadHistory", result);
            this.items = result;
          });
      }
    },
    remove() {
      extension
        .sendRequest(EAction.removeDownloadHistory, null, [this.selectedItem])
        .then((result: any) => {
          console.log("removeDownloadHistory", result);
          this.items = result;
        });
      this.dialogRemoveConfirm = false;
    },

    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    getDownloadHistory() {
      extension.sendRequest(EAction.getDownloadHistory).then((result: any) => {
        console.log("downloadHistory", result);
        this.items = [];
        result.forEach((item: any) => {
          let site = this.siteCache[item.host];
          if (!site) {
            site = this.options.sites.find((site: Site) => {
              return site.host === item.host;
            });
            this.siteCache[item.host] = site;
          }

          item.site = site;

          this.items.push(item);
        });
      });
    },

    getClientName(clientId: string): string {
      let client = this.options.clients.find((item: any) => {
        return item.id === clientId;
      });
      if (client) {
        return client.name;
      }
      return "";
    },
    download(options: any) {
      console.log(options);

      this.haveSuccess = true;
      this.successMsg = "正在发送种子到下载服务器……";

      let data = Object.assign({}, options.data);
      if (!data.clientId) {
        data.clientId = options.clientId;
      }

      extension
        .sendRequest(EAction.sendTorrentToClient, null, data)
        .then((result: any) => {
          console.log("命令执行完成", result);

          if (result.success) {
            this.haveSuccess = true;
            this.successMsg = result.msg;
          } else {
            this.haveError = true;
            this.errorMsg = result.msg;
          }
        });
    }
  },

  created() {
    this.getDownloadHistory();
  }
});
</script>
<style lang="scss" scoped>
.history {
  .sub-title {
    color: #aaaaaa;
    font-size: 12px;
  }
}
</style>
