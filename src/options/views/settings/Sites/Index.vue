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

        <input
          type="file"
          ref="fileImport"
          style="display:none;"
          multiple
          accept="application/json"
        />
        <!-- 导入配置文件 -->
        <v-btn color="info" @click="importConfig">
          <v-icon class="mr-2">folder_open</v-icon>
          {{$t('settings.sites.index.importConfig')}}
        </v-btn>

        <v-divider class="mx-3 mt-0" inset vertical></v-divider>

        <!-- 一键导入已登录站点 -->
        <v-btn color="info" @click="importAll" :loading="importing">
          <v-icon class="mr-2">gps_fixed</v-icon>
          {{$t('settings.sites.index.importAll')}}
        </v-btn>
        <span v-if="importing">{{ $t('settings.sites.index.importedText') }} {{importedCount}}</span>

        <v-divider class="mx-3 mt-0" inset vertical></v-divider>

        <!-- 重置站点图标缓存 -->
        <v-btn color="purple" dark @click="resetFavicons" :loading="faviconReseting">
          <v-icon class="mr-2">cached</v-icon>
          {{$t('settings.sites.index.resetFavicons')}}
        </v-btn>

        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="this.$store.state.options.sites"
        :pagination.sync="pagination"
        item-key="host"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td class="text-xs-center pb-1">
            <v-btn
              flat
              icon
              :title="$t('settings.sites.index.resetFavicons')"
              @click.stop="resetFavicon(props.item)"
              :loading="loadingIconSites.includes(props.item.host)"
              class="siteIcon"
            >
              <v-avatar :size="18" v-if="!loadingIconSites.includes(props.item.host)">
                <img :src="props.item.icon" />
              </v-avatar>
            </v-btn>
            <br />
            <a @click="edit(props.item)">
              <span>{{ props.item.name }}</span>
            </a>
          </td>
          <td>{{ props.item.tags && props.item.tags.join(", ") }}</td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.allowSearch?'true':'false'"
              hide-details
              :disabled="props.item.offline"
              @click.stop="updateSearchStatus(props.item)"
            ></v-switch>
          </td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.allowGetUserInfo?'true':'false'"
              hide-details
              :disabled="props.item.offline"
              @click.stop="updateAllowGetUserInfo(props.item)"
            ></v-switch>
          </td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.offline?'true':'false'"
              hide-details
              @click.stop="updateOfflineStatus(props.item)"
            ></v-switch>
          </td>
          <td>
            <a
              :href="props.item.activeURL"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ props.item.activeURL }}</a>
          </td>
          <td>
            <v-icon small @click="edit(props.item)" :title="$t('common.edit')">edit</v-icon>
            <v-icon
              small
              class="ml-2"
              @click="editPlugins(props.item)"
              :title="$t('settings.sites.index.plugins')"
            >assistant</v-icon>
            <v-icon
                v-if="props.item.allowGetUserInfo"
                small
                class="ml-2"
                @click="editUserInfo(props.item)"
                :title="$t('settings.sites.index.showUserInfo')"
            >view_list</v-icon>
            <v-icon
              small
              class="ml-2"
              @click="editSearchEntry(props.item)"
              :title="$t('settings.sites.index.searchEntry')"
            >search</v-icon>
            <v-icon
              small
              color="error"
              class="ml-2"
              @click="removeConfirm(props.item)"
              :title="$t('common.remove')"
            >delete</v-icon>
            <v-icon
              small
              color="info"
              class="ml-2"
              @click="shareSiteConfig(props.item)"
              :title="$t('common.share')"
            >share</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增站点 -->
    <AddSite v-model="showAddDialog" @save="addSite" />
    <!-- 编辑站点 -->
    <EditSite v-model="showEditDialog" :site="selectedSite" @save="updateSite" />
    <UserInfo v-model="showUserInfo" :site="selectedSite"></UserInfo>

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

    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {
  Site,
  LogItem,
  EAction,
  EModule,
  Plugin,
  SearchEntry,
  Options
} from "@/interface/common";
import AddSite from "./Add.vue";
import EditSite from "./Edit.vue";
import UserInfo from "./UserInfo.vue";

import { filters } from "@/service/filters";
import Extension from "@/service/extension";
import FileSaver from "file-saver";
import { PPF } from "@/service/public";

const extension = new Extension();

export default Vue.extend({
  components: {
    AddSite,
    EditSite,
    UserInfo
  },
  data() {
    return {
      selected: [],
      pagination: {
        rowsPerPage: -1
      },
      showAddDialog: false,
      showEditDialog: false,
      showUserInfo: false,
      siteDuplicate: false,
      sites: [] as Site[],
      selectedSite: {},
      dialogRemoveConfirm: false,
      options: this.$store.state.options,
      importing: false,
      importingCount: 0,
      importedCount: 0,
      fileImport: null as any,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      faviconReseting: false,
      loadingIconSites: [] as string[]
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
    editUserInfo(item: any) {
      let index = this.$store.state.options.sites.findIndex((site: any) => {
        return item.name === site.name;
      });

      if (index !== -1) {
        this.selectedSite = this.$store.state.options.sites[index];
        this.showUserInfo = true;
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
    },

    clearMessage() {
      this.successMsg = "";
      this.errorMsg = "";
    },

    /**
     * 导出站点配置
     */
    shareSiteConfig(site: Site) {
      let fileName = (site.host || site.name) + ".json";

      let data: Site = JSON.parse(JSON.stringify(site));

      // 清除个人相关信息
      ["id", "user", "passkey", "defaultClientId"].forEach((field: string) => {
        if ((data as any)[field]) {
          delete (data as any)[field];
        }
      });

      // 非自定义站点时，删除系统自带的一些参数
      if (!data.isCustom) {
        [
          "categories",
          "selectors",
          "searchEntryConfig",
          "description",
          "icon",
          "url",
          "schema",
          "tags",
          "formerHosts"
        ].forEach((field: string) => {
          if ((data as any)[field]) {
            delete (data as any)[field];
          }
        });
      }

      // 处理需要保留的插件
      if (data.plugins && data.plugins.length > 0) {
        const keepItems: any[] = [];
        data.plugins.forEach((item: Plugin) => {
          if (item.isCustom) {
            keepItems.push(item);
          }
        });
        data.plugins = keepItems;
      }

      // 处理需要保留的入口
      if (data.searchEntry && data.searchEntry.length > 0) {
        const keepItems: any[] = [];
        data.searchEntry.forEach((item: SearchEntry) => {
          if (item.isCustom) {
            keepItems.push(item);
          }
        });
        data.searchEntry = keepItems;
      }

      const blob = new Blob([JSON.stringify(data)], {
        type: "text/plain"
      });
      FileSaver.saveAs(blob, fileName);
    },

    /**
     * 导入配置文件
     */
    importConfig() {
      this.fileImport.click();
    },

    importConfigFile(event: Event) {
      this.clearMessage();
      let restoreFile: any = event.srcElement;
      if (
        restoreFile.files.length > 0 &&
        restoreFile.files[0].name.length > 0
      ) {
        console.log(restoreFile.files);

        for (let index = 0; index < restoreFile.files.length; index++) {
          const file = restoreFile.files[index];
          const r = new FileReader();
          r.onload = (e: any) => {
            try {
              const result = JSON.parse(e.target.result);
              this.importSite(result);
            } catch (error) {
              console.log(error);
              this.errorMsg = this.$t("common.importFailed").toString();
            }
          };
          r.onerror = () => {
            this.errorMsg = this.$t("settings.backup.loadError").toString();
          };
          r.readAsText(file);
        }

        restoreFile.value = "";
      }
    },

    /**
     * 导入站点信息
     */
    importSite(sourceSite: Site) {
      const options: Options = JSON.parse(JSON.stringify(this.options));
      let site: Site | null = null;
      let systemSite: Site | null = null;
      if (options.sites && options.sites.length > 0) {
        site = options.sites.find((item: Site) => {
          return item.host === sourceSite.host;
        });
      }

      if (
        options.system &&
        options.system.sites &&
        options.system.sites.length > 0
      ) {
        systemSite = options.system.sites.find((item: Site) => {
          return item.host === sourceSite.host;
        });
      }

      // 如果当前用户已定义该站点
      if (site) {
        if (
          !confirm(
            this.$t("settings.sites.index.importDuplicateConfirm", {
              name: site.name || site.host
            }).toString()
          )
        ) {
          return;
        }

        // 导入插件
        if (sourceSite.plugins && sourceSite.plugins.length > 0) {
          if (!site.plugins) {
            site.plugins = [];
          }

          let items = site.plugins;
          let keepItems: any[] = [];

          items.forEach((item: Plugin) => {
            if (item.isCustom) {
              keepItems.push(item);
            }
          });

          sourceSite.plugins.forEach((item: Plugin) => {
            let index = items.findIndex((_item: Plugin) => {
              return _item.name === item.name;
            });

            if (index === -1) {
              item.id = PPF.getNewId();
              keepItems.push(item);
            }
          });

          site.plugins = keepItems;
        }

        // 导入搜索入口
        if (sourceSite.searchEntry && sourceSite.searchEntry.length > 0) {
          if (!site.searchEntry) {
            site.searchEntry = [];
          }

          let items = site.searchEntry;

          sourceSite.searchEntry.forEach((item: SearchEntry) => {
            let index = items.findIndex((_item: SearchEntry) => {
              return _item.name === item.name;
            });

            if (index === -1) {
              item.id = PPF.getNewId();
              items.push(item);
            }
          });
        }

        this.updateSite(site);
      } else {
        if (
          !confirm(
            this.$t("settings.sites.index.importConfirm", {
              name: sourceSite.name || sourceSite.host
            }).toString()
          )
        ) {
          return;
        }

        // 如果当前用户未定义该站点，但系统已定义时
        if (systemSite) {
          this.addSite(Object.assign(systemSite, sourceSite));
        } else {
          this.addSite(sourceSite);
        }
      }

      this.successMsg = this.$t("settings.sites.index.importedText").toString();
    },

    resetFavicons() {
      this.faviconReseting = true;
      extension
        .sendRequest(EAction.resetFavicons)
        .then(options => {
          this.$store.commit("updateOptions", options);
        })
        .finally(() => {
          this.faviconReseting = false;
        });
    },

    resetFavicon(site: Site) {
      if (!site.host) {
        return;
      }
      const host = site.host;
      if (!this.loadingIconSites.includes(host)) {
        this.loadingIconSites.push(host);
      }

      extension
        .sendRequest(EAction.resetFavicon, null, site.activeURL || site.url)
        .then(options => {
          // 重新加载配置信息
          this.$store.commit("readConfig");
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          let index = this.loadingIconSites.indexOf(host);
          console.log("host: %s, index: %s", host, index);
          if (index != -1) {
            this.loadingIconSites.splice(index, 1);
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
  },
  mounted() {
    this.fileImport = this.$refs.fileImport;
    this.fileImport.addEventListener("change", this.importConfigFile);
  },
  beforeDestroy() {
    this.fileImport.removeEventListener("change", this.importConfigFile);
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.sites.index.headers.name"),
          align: "center",
          value: "name",
          width: "110px"
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
        {
          text: this.$t("settings.sites.index.headers.offline"),
          align: "left",
          value: "offline"
        },
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

<style lang="scss" scoped>
.set-sites {
  .search {
    max-width: 400px;
  }

  .siteIcon {
    margin: 0;
    margin-top: 5px;
    height: 30px;
    width: 30px;
  }
}
</style>
