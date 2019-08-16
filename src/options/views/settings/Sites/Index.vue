<template>
  <div class="set-sites">
    <v-alert :value="true" type="info">
      <div>{{ $t('settings.sites.index.title') }}</div>
    </v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="add">
          <v-icon class="mr-2">add</v-icon>
          {{$t('common.add')}}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{$t('common.remove')}}
        </v-btn>
        <v-divider class="mx-3 mt-0" inset vertical></v-divider>
        <v-btn color="info" @click="importAll" :loading="importing">
          <v-icon class="mr-2">save_alt</v-icon>
          {{$t('settings.sites.index.importAll')}}
        </v-btn>
        <span v-if="importing">{{ $t('settings.sites.index.importedText') }} {{importedCount}}</span>
        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="this.$store.state.options.sites"
        :pagination.sync="pagination"
        item-key="name"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td>
            <a @click="edit(props.item)">
              <v-avatar size="18">
                <img :src="props.item.icon" />
              </v-avatar>
              <span class="ml-2">{{ props.item.name }}</span>
            </a>
          </td>
          <td>{{ props.item.tags && props.item.tags.join(", ") }}</td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.allowSearch?'true':'false'"
              hide-details
              @click.stop="updateSearchStatus(props.item)"
            ></v-switch>
          </td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.allowGetUserInfo?'true':'false'"
              hide-details
              @click.stop="updateAllowGetUserInfo(props.item)"
            ></v-switch>
          </td>
          <!-- <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.offline?'true':'false'"
              hide-details
              @click.stop="updateOfflineStatus(props.item)"
            ></v-switch>
          </td>-->
          <td>
            <a
              :href="props.item.activeURL"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ props.item.activeURL }}</a>
          </td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)" :title="$t('common.edit')">edit</v-icon>
            <v-icon
              small
              class="mr-2"
              @click="editPlugins(props.item)"
              :title="$t('settings.sites.index.plugins')"
            >assistant</v-icon>
            <v-icon
              small
              class="mr-2"
              @click="editSearchEntry(props.item)"
              :title="$t('settings.sites.index.searchEntry')"
            >search</v-icon>
            <v-icon
              small
              color="error"
              @click="removeConfirm(props.item)"
              :title="$t('common.remove')"
            >delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增站点 -->
    <AddSite v-model="showAddDialog" @save="addSite" />
    <!-- 编辑站点 -->
    <EditSite v-model="showEditDialog" :site="selectedSite" @save="updateSite" />

    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{ $t('settings.sites.index.removeTitle') }}</v-card-title>

        <v-card-text>{{ $t('settings.sites.index.removeConfirm') }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm=false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t('common.cancel') }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t('common.ok') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert :value="true" color="grey">
      <div v-html="$t('settings.sites.index.subTitle')"></div>
    </v-alert>

    <v-snackbar
      v-model="siteDuplicate"
      top
      :timeout="3000"
      color="error"
    >{{ $t('settings.sites.index.siteDuplicateText') }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Site, LogItem, EAction, EModule } from "@/interface/common";
import AddSite from "./Add.vue";
import EditSite from "./Edit.vue";

import { filters } from "@/service/filters";
import Extension from "@/service/extension";
const extension = new Extension();

export default Vue.extend({
  components: {
    AddSite,
    EditSite
  },
  data() {
    return {
      selected: [],
      pagination: {
        rowsPerPage: -1
      },
      showAddDialog: false,
      showEditDialog: false,
      siteDuplicate: false,
      sites: [] as Site[],
      selectedSite: {},
      dialogRemoveConfirm: false,
      options: this.$store.state.options,
      importing: false,
      importingCount: 0,
      importedCount: 0
    };
  },
  methods: {
    add() {
      this.showAddDialog = true;
    },
    edit(item: any) {
      let index = this.$store.state.options.sites.findIndex((site: any) => {
        return item.name === site.name;
      });

      if (index !== -1) {
        this.selectedSite = this.$store.state.options.sites[index];
        this.showEditDialog = true;
      }
    },
    removeConfirm(item: any) {
      this.selectedSite = item;
      this.dialogRemoveConfirm = true;
    },
    remove() {
      this.dialogRemoveConfirm = false;
      this.$store.commit("removeSite", this.selectedSite);
      this.selectedSite = {};
    },
    removeSelected() {
      if (
        confirm(
          this.$t("settings.sites.index.removeSelectedConfirm").toString()
        )
      ) {
        this.selected.forEach((item: any) => {
          this.$store.commit("removeSite", item);
        });
        this.selected = [];
      }
    },
    updateSearchStatus(item: any) {
      item.allowSearch = !(<boolean>item.allowSearch);
      this.$store.commit("updateSite", item);
      this.pagination.rowsPerPage = 0;
      this.pagination.rowsPerPage = -1;
    },
    updateAllowGetUserInfo(item: any) {
      item.allowGetUserInfo = !(<boolean>item.allowGetUserInfo);
      this.$store.commit("updateSite", item);
      this.pagination.rowsPerPage = 0;
      this.pagination.rowsPerPage = -1;
    },
    updateOfflineStatus(item: any) {
      item.offline = !(<boolean>item.offline);
      this.$store.commit("updateSite", item);
      this.pagination.rowsPerPage = 0;
      this.pagination.rowsPerPage = -1;
    },
    updateSite(item: any) {
      // this.selectedSite = item;
      this.$store.commit("updateSite", item);
      this.pagination.rowsPerPage = 0;
      this.pagination.rowsPerPage = -1;
    },
    addSite(item: any) {
      if (!item.host) {
        let url = filters.parseURL(item.url);
        item.host = url.host;
      }

      if (!item.icon) {
        let url = filters.parseURL(item.url);
        item.icon = `${url.protocol}://${item.host}/favicon.ico`;
      }

      let index = this.$store.state.options.sites.findIndex((site: any) => {
        return site.host === item.host;
      });
      if (index === -1) {
        if (!item.activeURL) {
          item.activeURL = item.url;
        }
        this.$store.commit("addSite", item);
      } else {
        this.siteDuplicate = true;
      }
    },
    importAll() {
      if (
        !confirm(this.$t("settings.sites.index.importAllConfirm").toString())
      ) {
        return;
      }
      if (this.importing) {
        return;
      }
      this.importing = true;
      this.importedCount = 0;
      this.$store.state.options.system.sites.forEach((site: any) => {
        let index = this.$store.state.options.sites
          ? this.$store.state.options.sites.findIndex((item: any) => {
              return item.host === site.host;
            })
          : -1;
        if (index === -1) {
          this.checkAndAddSite(site);
        }
      });
    },
    editPlugins(item: any) {
      this.$router.push({
        name: "set-site-plugins",
        params: {
          host: item.host
        }
      });
    },
    writeLog(options: LogItem) {
      extension.sendRequest(EAction.writeLog, null, {
        module: EModule.options,
        event: options.event,
        msg: options.msg,
        data: options.data
      });
    },
    editSearchEntry(item: Site) {
      this.$router.push({
        name: "set-site-search-entry",
        params: {
          host: item.host as string
        }
      });
    },
    /**
     * 验证并添加站点
     */
    checkAndAddSite(site: Site) {
      this.importingCount++;
      extension
        .sendRequest(EAction.getUserInfo, null, site)
        .then((result: any) => {
          console.log(result);
          if (result && result.name) {
            this.$store.commit(
              "addSite",
              Object.assign(
                {
                  valid: true,
                  activeURL: site.url,
                  allowSearch: true,
                  allowGetUserInfo: true
                },
                site
              )
            );
            this.importedCount++;
          }
        })
        .catch(result => {
          console.log("error", result);
        })
        .finally(() => {
          this.importingCount--;
          if (this.importingCount == 0) {
            this.importing = false;
          }
        });
    }
  },
  created() {
    if (!this.options.system) {
      this.writeLog({
        event: "Sites.init.error",
        msg: "系统配置信息丢失"
      });
    }

    if (this.options.system && !this.options.system.sites) {
      this.writeLog({
        event: "Sites.init.error",
        msg: "系统配置网站信息丢失"
      });
    }
    // this.sites = this.$store.state.options.sites;
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.sites.index.headers.name"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("settings.sites.index.headers.tags"),
          align: "left",
          value: "tags"
        },
        {
          text: this.$t("settings.sites.index.headers.allowSearch"),
          align: "left",
          value: "allowSearch"
        },
        {
          text: this.$t("settings.sites.index.headers.allowGetUserInfo"),
          align: "left",
          value: "allowGetUserInfo"
        },
        // {
        //   text: this.$t("settings.sites.index.headers.offline"),
        //   align: "left",
        //   value: "offline"
        // },
        {
          text: this.$t("settings.sites.index.headers.activeURL"),
          align: "left",
          value: "activeURL"
        },
        {
          text: this.$t("settings.sites.index.headers.action"),
          value: "name",
          sortable: false
        }
      ];
    }
  }
});
</script>

<style lang="scss" scoped>
.set-sites {
  .search {
    max-width: 400px;
  }
}
</style>
