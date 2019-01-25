<template>
  <div class="site-search-entry">
    <v-alert :value="true" type="info">{{ words.title }} [{{ site.name }}]</v-alert>
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
        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="searchEntry"
        :pagination.sync="pagination"
        item-key="name"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details v-if="props.item.isCustom"></v-checkbox>
          </td>
          <td>
            <a @click="edit(props.item)">
              <span class="ml-2">{{ props.item.name }}</span>
            </a>
          </td>
          <td class="cat">
            <template v-for="(item, index) in getCategory(props.item)">
              <v-chip
                :key="index"
                label
                color="blue-grey"
                text-color="white"
                small
                class="mr-2 pl-0"
                disabled
              >{{ item }}</v-chip>
            </template>
          </td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.enabled?'true':'false'"
              hide-details
            ></v-switch>
          </td>
          <td>
            <v-icon small class="mr-2" @click="copy(props.item)" :title="words.copy">file_copy</v-icon>
            <v-icon
              small
              class="mr-2"
              @click="edit(props.item)"
              v-if="props.item.isCustom"
              :title="words.edit"
            >edit</v-icon>
            <v-icon
              small
              color="error"
              @click="removeConfirm(props.item)"
              v-if="props.item.isCustom"
              :title="words.remove"
            >delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增 -->
    <AddItem v-model="showAddDialog" @save="addItem" :site="site"/>
    <!-- 编辑 -->
    <EditItem v-model="showEditDialog" :site="site" :data="selectedItem" @save="updateItem"/>

    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{ words.removeTitle }}</v-card-title>

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
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {
  Site,
  SearchEntry,
  SiteCategory,
  SiteCategories
} from "@/interface/common";
import AddItem from "./Add.vue";
import EditItem from "./Edit.vue";

import { filters } from "@/service/filters";
export default Vue.extend({
  components: {
    AddItem,
    EditItem
  },
  data() {
    return {
      words: {
        title: "站点搜索入口配置",
        add: "新增",
        remove: "删除",
        importAll: "导入所有",
        removeSelectedConfirm: "确认要删除已选中的站点吗？",
        removeConfirm: "确认要删除这个搜索入口吗？",
        removeTitle: "删除确认",
        ok: "确认",
        cancel: "取消",
        copy: "复制",
        edit: "编辑"
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
        {
          text: "已选择分类",
          align: "left",
          value: "categories"
        },
        { text: "启用", align: "left", value: "enable" },
        { text: "操作", value: "name", sortable: false }
      ],
      site: {} as Site,
      selectedItem: {},
      dialogRemoveConfirm: false,
      searchEntry: [] as any
    };
  },
  methods: {
    add() {
      this.showAddDialog = true;
    },
    copy(item: SearchEntry) {
      let newItem = Object.assign({}, item);
      newItem.name += " Copy";
      newItem.isCustom = true;
      this.addItem(newItem);
    },
    edit(item: any) {
      if (item) {
        this.selectedItem = item;
        this.showEditDialog = true;
      }
    },
    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    remove() {
      this.dialogRemoveConfirm = false;
      this.$store.dispatch("removeSiteSearchEntry", {
        host: this.site.host,
        item: this.selectedItem
      });
      this.selectedItem = {};
      this.reloadEntry(this.site.host);
    },
    removeSelected() {
      if (confirm(this.words.removeSelectedConfirm)) {
        this.selected.forEach((item: any) => {
          this.$store.dispatch("removeSiteSearchEntry", {
            host: this.site.host,
            item
          });
        });
        this.selected = [];
        this.reloadEntry(this.site.host);
      }
    },
    updateItem(item: any) {
      console.log(item);
      this.selectedItem = item;
      this.$store.dispatch("updateSiteSearchEntry", {
        host: this.site.host,
        item
      });
      this.reloadEntry(this.site.host);
    },
    addItem(item: any) {
      console.log(item);
      this.$store.dispatch("addSiteSearchEntry", {
        host: this.site.host,
        item: item
      });
      this.reloadEntry(this.site.host);
    },
    reloadEntry(host: string | undefined) {
      this.site = this.$store.state.options.sites.find((item: Site) => {
        return item.host == host;
      });

      if (this.site) {
        let searchEntry: any[] = [];

        if (this.site.searchEntry && this.site.searchEntry.length > 0) {
          searchEntry.push(...this.site.searchEntry);
        } else {
          let schema = this.site.schema;
          if (typeof schema === "string") {
            let _schema = this.$store.state.options.system.schemas.find(
              (item: Site) => {
                return item.name == schema;
              }
            );
            if (_schema) {
              searchEntry.push(..._schema.searchEntry);
            }
          }
        }

        this.searchEntry = searchEntry;
      }
    },
    getCategory(entry: SearchEntry): string[] {
      let site: Site = this.site;
      let result: string[] = [];
      if (site.categories && entry.categories) {
        site.categories.forEach((item: SiteCategories) => {
          if (
            item.category &&
            (item.entry == "*" ||
              (entry.entry as string).indexOf(item.entry as string))
          ) {
            item.category.forEach((c: SiteCategory) => {
              if (
                entry.categories &&
                entry.categories.includes(c.id as string)
              ) {
                result.push(c.name as string);
              }
            });
          }
        });
      }
      return result;
    }
  },
  created() {
    let host = this.$route.params["host"];
    console.log("create", this.$route.params);
    if (host) {
      this.reloadEntry(host);
    }
  }
});
</script>

<style lang="scss" scoped>
.site-search-entry {
  .search {
    max-width: 400px;
  }

  .cat {
    max-width: 40vw;
  }
}
</style>
