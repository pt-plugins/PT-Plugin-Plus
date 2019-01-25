<template>
  <div class="set-download-clients">
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="add">
          <v-icon class="mr-2">add</v-icon>
          {{ words.add }}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{ words.remove }}
        </v-btn>
        <!-- <v-btn color="error" @click="clear" :disabled="this.$store.state.options.clients.length==0">
          <v-icon class="mr-2">clear</v-icon>
          {{ words.clear }}
        </v-btn>-->
        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
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
            <a @click="edit(props.item)">{{ props.item.name }}</a>
          </td>
          <td>
            <template v-for="(item, index) in props.item.range">
              <v-chip
                :key="index"
                label
                color="blue-grey"
                text-color="white"
                small
                class="mr-2 pl-0"
                @click="editSearchEntry(item.host)"
              >{{ item.siteName }}{{ getSiteEntry(item.host, item.entry) }}</v-chip>
            </template>
          </td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)">edit</v-icon>
            <v-icon small color="error" @click="removeConfirm(props.item)">delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增 -->
    <EditItem v-model="showAddDialog" @save="updateItem"/>
    <!-- 编辑 -->
    <EditItem v-model="showEditDialog" :option="selectedItem" @save="updateItem"/>

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

    <v-snackbar v-model="itemDuplicate" top :timeout="3000" color="error">{{ words.itemDuplicate }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import EditItem from "./Edit.vue";
import { SearchSolution, Site, SearchEntry } from "@/interface/common";
export default Vue.extend({
  components: {
    EditItem
  },
  data() {
    return {
      words: {
        title: "搜索方案定义",
        add: "新增",
        remove: "删除",
        clear: "清除",
        itemDuplicate: "该名称已存在",
        removeConfirm: "确认要删除这个搜索方案吗？",
        removeConfirmTitle: "删除确认",
        clearConfirm: "确认要删除所有搜索方案吗？",
        removeSelectedConfirm: "确认要删除已选中的搜索方案吗？",
        ok: "确认",
        cancel: "取消"
      },
      showAddDialog: false,
      showEditDialog: false,
      itemDuplicate: false,
      selected: [],
      selectedItem: {},
      pagination: {
        rowsPerPage: -1
      },
      headers: [
        { text: "名称", align: "left", value: "name" },
        { text: "范围", align: "left", value: "range" },
        { text: "操作", value: "name", sortable: false }
      ],
      items: this.$store.state.options.searchSolutions as SearchSolution[],
      dialogRemoveConfirm: false,
      options: this.$store.state.options
    };
  },
  methods: {
    add() {
      this.selectedItem = {};
      this.showEditDialog = true;
    },
    updateItem(item: SearchSolution) {
      this.$store.dispatch("updateSearchSolution", item);
      this.pagination.rowsPerPage = 0;
      this.pagination.rowsPerPage = -1;
    },

    edit(item: any) {
      let index = this.options.searchSolutions.findIndex((data: any) => {
        return item.id === data.id;
      });

      if (index !== -1) {
        this.selectedItem = this.options.searchSolutions[index];
        this.showEditDialog = true;
      }
    },

    remove() {
      this.dialogRemoveConfirm = false;
      this.$store.dispatch("removeSearchSolution", this.selectedItem);
      this.selectedItem = {};
    },
    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    removeSelected() {
      if (confirm(this.words.removeSelectedConfirm)) {
        console.log(this.selected);
        this.selected.forEach((item: any) => {
          this.$store.dispatch("removeSearchSolution", item);
        });
        this.selected = [];
      }
    },
    getSiteEntry(host: string, entry: string[]): string {
      let site: Site = this.options.sites.find((item: Site) => {
        return item.host === host;
      });

      if (site && site.searchEntry) {
        let results: string[] = [];
        let siteEntry: SearchEntry[] = site.searchEntry;

        entry.forEach((key: string) => {
          let index: number = siteEntry.findIndex((entry: SearchEntry) => {
            return entry.id == key || entry.name == key;
          });
          if (siteEntry[index] && siteEntry[index].name) {
            results.push(siteEntry[index].name as string);
          }
        });

        if (results.length > 0) {
          return " -> " + results.join(";");
        }
      }
      return "";
    },
    editSearchEntry(host: string) {
      this.$router.push({
        name: "set-site-search-entry",
        params: {
          host: host
        }
      });
    }
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.set-download-clients {
  .search {
    max-width: 400px;
  }
}
</style>