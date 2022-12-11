<template>
  <div class="set-download-clients">
    <v-alert :value="true" type="info">{{
      $t("settings.searchSolution.index.title")
    }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="add">
          <v-icon class="mr-2">add</v-icon>
          {{ $t("common.add") }}
        </v-btn>
        <v-btn
          color="error"
          :disabled="selected.length == 0"
          @click="removeSelected"
        >
          <v-icon class="mr-2">remove</v-icon>
          {{ $t("common.remove") }}
        </v-btn>
        <v-btn
          color="info"
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/search-solution-definition"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-icon class="mr-2">help</v-icon>
          {{ $t("settings.searchSolution.index.help") }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field
          class="search"
          append-icon="search"
          label="Search"
          single-line
          hide-details
        ></v-text-field>
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
          <td style="width: 20px">
            <v-checkbox
              v-model="props.selected"
              primary
              hide-details
            ></v-checkbox>
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
                >{{ item.siteName
                }}{{ getSiteEntry(item.host, item.entry) }}</v-chip
              >
            </template>
          </td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)">edit</v-icon>
            <v-icon small color="error" @click="removeConfirm(props.item)"
              >delete</v-icon
            >
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增 -->
    <EditItem v-model="showAddDialog" @save="updateItem" />
    <!-- 编辑 -->
    <EditItem
      v-model="showEditDialog"
      :option="selectedItem"
      @save="updateItem"
    />

    <!-- 删除确认 -->
    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{
          $t("settings.searchSolution.index.removeConfirmTitle")
        }}</v-card-title>

        <v-card-text>{{
          $t("settings.searchSolution.index.removeConfirm")
        }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm = false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t("common.cancel") }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t("common.ok") }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="itemDuplicate" top :timeout="3000" color="error">{{
      $t("settings.searchSolution.index.itemDuplicate")
    }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import EditItem from "./Edit.vue";
import { SearchSolution, Site, SearchEntry, Options } from "@/interface/common";
import { PPF } from "@/service/public";
export default Vue.extend({
  components: {
    EditItem
  },
  data() {
    return {
      showAddDialog: false,
      showEditDialog: false,
      itemDuplicate: false,
      selected: [],
      selectedItem: {},
      pagination: {
        rowsPerPage: -1
      },
      items: [] as SearchSolution[],
      dialogRemoveConfirm: false,
      options: {} as Options
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
      if (!this.options.searchSolutions) {
        return;
      }
      let index = this.options.searchSolutions.findIndex((data: any) => {
        return item.id === data.id;
      });

      if (index !== -1) {
        this.selectedItem = PPF.clone(this.options.searchSolutions[index]);
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
      if (
        confirm(
          this.$t(
            "settings.searchSolution.index.removeSelectedConfirm"
          ).toString()
        )
      ) {
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
  created() {
    this.options = this.$store.state.options;
    this.items = this.$store.state.options.searchSolutions;
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.searchSolution.index.headers.name"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("settings.searchSolution.index.headers.range"),
          align: "left",
          value: "range"
        },
        {
          text: this.$t("settings.searchSolution.index.headers.action"),
          value: "name",
          sortable: false
        }
      ];
    }
  }
});
</script>

<style lang="scss" scoped>
.set-download-clients {
  .search {
    max-width: 400px;
  }
}
</style>