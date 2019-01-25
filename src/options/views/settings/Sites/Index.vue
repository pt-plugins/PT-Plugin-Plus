<template>
  <div class="set-sites">
    <v-alert :value="true" type="info">
      <div>{{ words.title }}</div>
    </v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="add">
          <v-icon class="mr-2">add</v-icon>
          {{words.add}}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{words.remove}}
        </v-btn>
        <v-divider class="mx-3 mt-0" inset vertical></v-divider>
        <v-btn color="info" @click="importAll">
          <v-icon class="mr-2">save_alt</v-icon>
          {{words.importAll}}
        </v-btn>
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
                <img :src="props.item.icon">
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
            <a
              :href="props.item.url"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ props.item.url }}</a>
          </td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)" :title="words.edit">edit</v-icon>
            <v-icon
              small
              class="mr-2"
              @click="editPlugins(props.item)"
              :title="words.plugins"
            >assistant</v-icon>
            <v-icon
              small
              class="mr-2"
              @click="editSearchEntry(props.item)"
              :title="words.searchEntry"
            >search</v-icon>
            <v-icon
              small
              color="error"
              @click="removeConfirm(props.item)"
              :title="words.remove"
            >delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增站点 -->
    <AddSite v-model="showAddDialog" @save="addSite"/>
    <!-- 编辑站点 -->
    <EditSite v-model="showEditDialog" :site="selectedSite" @save="updateSite"/>

    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">删除确认</v-card-title>

        <v-card-text>确认要删除这个站点吗？</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm=false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">取消</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">确认</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert :value="true" color="grey">{{ words.subTitle }}</v-alert>

    <v-snackbar v-model="siteDuplicate" top :timeout="3000" color="error">{{ siteDuplicateText }}</v-snackbar>
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
      words: {
        add: "新增",
        remove: "删除",
        edit: "编辑",
        importAll: "导入所有",
        removeSelectedConfirm: "确认要删除已选中的站点吗？",
        plugins: "插件",
        title: "站点设置",
        subTitle: "只有配置过的站点才会显示插件图标及相应的功能。",
        searchEntry: "搜索入口"
      },
      selected: [],
      pagination: {
        rowsPerPage: -1
      },
      showAddDialog: false,
      showEditDialog: false,
      siteDuplicate: false,
      siteDuplicateText: "该站点已存在",
      headers: [
        { text: "名称", align: "left", value: "name" },
        { text: "标签", align: "left", value: "tags" },
        { text: "允许搜索", align: "left", value: "allowSearch" },
        { text: "URL", align: "left", value: "url" },
        { text: "操作", value: "name", sortable: false }
      ],
      sites: [
        {
          value: false,
          name: "OpenCD",
          tags: ["音乐"],
          url: "https://open.cd/"
        },
        {
          value: false,
          name: "CMCT",
          tags: ["电影"],
          url: "https://hdcmct.org/"
        }
      ],
      selectedSite: {},
      dialogRemoveConfirm: false,
      options: this.$store.state.options
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
      if (confirm(this.words.removeSelectedConfirm)) {
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
        this.$store.commit("addSite", item);
      } else {
        this.siteDuplicate = true;
      }
    },
    importAll() {
      this.$store.state.options.system.sites.forEach((site: any) => {
        let index = this.$store.state.options.sites
          ? this.$store.state.options.sites.findIndex((item: any) => {
              return item.host === site.host;
            })
          : -1;
        if (index === -1) {
          this.$store.commit("addSite", Object.assign({ valid: true }, site));
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
