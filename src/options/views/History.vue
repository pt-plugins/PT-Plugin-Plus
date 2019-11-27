<template>
  <div class="history">
    <v-alert :value="true" type="info">{{ $t("history.title") }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn
          color="error"
          :disabled="selected.length == 0"
          @click="removeSelected"
        >
          <v-icon class="mr-2">remove</v-icon>
          {{ $t("history.remove") }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length == 0">
          <v-icon class="mr-2">clear</v-icon>
          {{ $t("history.clear") }}
        </v-btn>
        <v-spacer></v-spacer>

        <v-text-field
          class="search"
          append-icon="search"
          label="Search"
          single-line
          hide-details
          v-model="filterKey"
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :search="filterKey"
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
            <v-checkbox
              v-model="props.selected"
              primary
              hide-details
            ></v-checkbox>
          </td>
          <!-- 站点 -->
          <td style="text-align: center;">
            <div v-if="!!props.item.site">
              <v-avatar size="18">
                <img :src="props.item.site.icon" />
              </v-avatar>
              <br />
              <span class="captionText">{{ props.item.site.name }}</span>
            </div>
          </td>
          <td>
            <a
              v-if="props.item.data.link"
              :href="props.item.data.link"
              target="_blank"
              :title="props.item.data.title"
              rel="noopener noreferrer nofollow"
              >{{ props.item.data.title || props.item.data.link }}</a
            >
            <span v-else :title="props.item.data.url">{{
              props.item.data.title || props.item.data.url
            }}</span>
            <br />
            <span class="sub-title"
              >[
              {{
                getClientName(props.item.data.clientId || props.item.clientId)
              }}
              ] ->
              {{ props.item.data.savePath || $t("history.defaultPath") }}</span
            >
          </td>
          <td>
            <v-icon
              v-if="props.item.success === false"
              color="error"
              :title="$t('history.fail')"
              >close</v-icon
            >
            <v-icon v-else color="success" :title="$t('history.success')"
              >done</v-icon
            >
          </td>
          <td>{{ props.item.time | formatDate }}</td>
          <td>
            <!-- 重新下载 -->
            <v-btn
              icon
              flat
              small
              @click="download(props.item)"
              :title="$t('history.download')"
            >
              <v-icon small>save_alt</v-icon>
            </v-btn>

            <!-- 下载到 -->
            <DownloadTo
              :downloadOptions="{
                host: props.item.host,
                url: props.item.data.url
              }"
              flat
              icon
              small
              class="mx-0"
              @error="onError"
              @success="onSuccess"
            />

            <v-btn
              icon
              flat
              small
              color="error"
              @click="removeConfirm(props.item)"
              :title="$t('common.remove')"
            >
              <v-icon small>delete</v-icon>
            </v-btn>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 删除确认 -->
    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{
          $t("history.removeConfirmTitle")
        }}</v-card-title>

        <v-card-text>{{ $t("history.removeConfirm") }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm = false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t("history.cancel") }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove(null)">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t("history.ok") }}</span>
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
import { EAction, DownloadOptions, Site, Dictionary } from "@/interface/common";
import Extension from "@/service/extension";
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
      filterKey: ""
    };
  },

  methods: {
    clear() {
      if (confirm(this.$t("history.clearConfirm").toString())) {
        extension
          .sendRequest(EAction.clearDownloadHistory)
          .then((result: any) => {
            this.getDownloadHistory();
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

    remove(items?: any) {
      if (!items) {
        items = [this.selectedItem];
      }

      extension
        .sendRequest(EAction.removeDownloadHistory, null, items)
        .then((result: any) => {
          this.getDownloadHistory();
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
      this.successMsg = this.$t("history.seedingTorrent").toString();

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
    },

    onError(msg: string) {
      this.errorMsg = msg;
    },

    onSuccess(msg: string) {
      this.successMsg = msg;
    }
  },

  created() {
    this.getDownloadHistory();
  },

  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("history.headers.site"),
          align: "center",
          value: "data.host",
          width: "140px"
        },
        {
          text: this.$t("history.headers.title"),
          align: "left",
          value: "data.title"
        },
        {
          text: this.$t("history.headers.status"),
          align: "left",
          value: "data.success"
        },
        { text: this.$t("history.headers.time"), align: "left", value: "time" },
        {
          text: this.$t("history.headers.action"),
          value: "name",
          sortable: false
        }
      ];
    }
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
