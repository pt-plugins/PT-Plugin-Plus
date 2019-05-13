<template>
  <div class="site-plugins">
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
        :items="plugins"
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
            <a @click="edit(props.item.id)" v-if="props.item.isCustom">
              <span class="ml-2">{{ props.item.name }}</span>
            </a>
            <span class="ml-2" v-else>{{ props.item.name }}</span>
          </td>
          <td>
            <v-chip
              label
              color="light-blue"
              text-color="white"
              v-for="(page, index) in props.item.pages"
              :key="index"
              small
            >
              <!-- <v-icon left small>label</v-icon> -->
              {{ page }}
            </v-chip>
          </td>
          <td>{{ props.item.url }}</td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item.id)" v-if="props.item.isCustom">edit</v-icon>
            <v-icon
              small
              color="error"
              @click="removeConfirm(props.item)"
              v-if="props.item.isCustom"
            >delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增插件 -->
    <AddItem v-model="showAddDialog" @save="addItem"/>
    <!-- 编辑插件 -->
    <EditItem v-model="showEditDialog" :data="selectedItem" @save="updateItem"/>

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
import { Site } from "../../../../interface/common";
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
        title: "站点插件配置",
        add: "新增",
        remove: "删除",
        importAll: "导入所有",
        removeSelectedConfirm: "确认要删除已选中的站点吗？",
        removeConfirm: "确认要删除这个插件吗？",
        removeTitle: "删除确认",
        ok: "确认",
        cancel: "取消"
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
        { text: "适用页面", align: "left", value: "pages" },
        { text: "启用", align: "left", value: "enable" },
        { text: "操作", value: "name", sortable: false }
      ],
      site: {} as Site,
      selectedItem: {},
      dialogRemoveConfirm: false,
      plugins: [] as any
    };
  },
  methods: {
    add() {
      this.showAddDialog = true;
    },
    edit(id: any) {
      let item = (this.site as any).plugins.find((item: any) => {
        return item.id === id;
      });
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
      this.$store.commit("removePlugin", {
        host: this.site.host,
        plugin: this.selectedItem
      });
      this.selectedItem = {};
      this.reloadPlugins(this.site.host);
    },
    removeSelected() {
      if (confirm(this.words.removeSelectedConfirm)) {
        this.selected.forEach((item: any) => {
          this.$store.commit("removePlugin", {
            host: this.site.host,
            plugin: item
          });
        });
        this.selected = [];
        this.reloadPlugins(this.site.host);
      }
    },
    updateItem(item: any) {
      console.log(item);
      this.selectedItem = item;
      this.$store.commit("updatePlugin", {
        host: this.site.host,
        plugin: item
      });
      this.reloadPlugins(this.site.host);
    },
    addItem(item: any) {
      console.log(item);
      this.$store.commit("addPlugin", {
        host: this.site.host,
        plugin: item
      });
      this.reloadPlugins(this.site.host);
    },
    reloadPlugins(host: any) {
      this.site = this.$store.state.options.sites.find((item: Site) => {
        return item.host == host;
      });

      if (this.site) {
        let plugins: any[] = [];

        let schema = this.site.schema;
        if (typeof schema === "string") {
          let _schema = this.$store.state.options.system.schemas.find(
            (item: Site) => {
              return item.name == schema;
            }
          );
          if (_schema) {
            plugins.push(..._schema.plugins);
          }
        } else if (schema && schema.plugins) {
          let site = this.$store.state.options.system.sites.find(
            (item: Site) => {
              return item.host == host;
            }
          );
          if (site && site.schema && site.schema.plugins) {
            plugins.push(...site.schema.plugins);
          }
        }

        if (this.site.plugins) {
          plugins.push(...this.site.plugins);
        }

        this.plugins = plugins;
      }
    }
  },
  created() {
    let host = this.$route.params["host"];
    console.log("create", this.$route.params);
    if (host) {
      this.reloadPlugins(host);
    }
  }
});
</script>

<style lang="scss" scoped>
.site-plugins {
  .search {
    max-width: 400px;
  }
}
</style>
