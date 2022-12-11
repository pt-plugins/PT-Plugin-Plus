<template>
  <div class="site-search-entry">
    <v-alert :value="true" type="info"
      >{{ $t("settings.siteSearchEntry.index.title") }} [{{
        site.name
      }}]</v-alert
    >
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
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/search-entry-definition"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-icon class="mr-2">help</v-icon>
          {{ $t("settings.siteSearchEntry.index.help") }}
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
        :items="searchEntry"
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
              v-if="props.item.isCustom"
            ></v-checkbox>
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
                >{{ item }}</v-chip
              >
            </template>
          </td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.enabled ? 'true' : 'false'"
              hide-details
            ></v-switch>
          </td>
          <td>
            <v-icon
              small
              class="mr-2"
              @click="copy(props.item)"
              :title="$t('common.copy')"
              >file_copy</v-icon
            >
            <v-icon
              small
              class="mr-2"
              @click="edit(props.item)"
              v-if="props.item.isCustom"
              :title="$t('common.edit')"
              >edit</v-icon
            >
            <v-icon
              small
              color="error"
              @click="removeConfirm(props.item)"
              v-if="props.item.isCustom"
              :title="$t('common.remove')"
              >delete</v-icon
            >
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增 -->
    <AddItem v-model="showAddDialog" @save="addItem" :site="site" />
    <!-- 编辑 -->
    <EditItem
      v-model="showEditDialog"
      :site="site"
      :data="selectedItem"
      @save="updateItem"
    />

    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{
          $t("settings.siteSearchEntry.index.removeTitle")
        }}</v-card-title>

        <v-card-text>{{
          $t("settings.siteSearchEntry.index.removeConfirm")
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
import { PPF } from "@/service/public";
export default Vue.extend({
  components: {
    AddItem,
    EditItem
  },
  data() {
    return {
      selected: [],
      pagination: {
        rowsPerPage: -1
      },
      showAddDialog: false,
      showEditDialog: false,
      site: {} as Site,
      selectedItem: {},
      dialogRemoveConfirm: false,
      searchEntry: [] as any,
      options: this.$store.state.options
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
      if (
        confirm(
          this.$t(
            "settings.siteSearchEntry.index.removeSelectedConfirm"
          ).toString()
        )
      ) {
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
      let site = this.$store.state.options.sites.find((item: Site) => {
        return item.host == host;
      });

      if (site) {
        this.site = PPF.clone(site);
        let systemSite = this.options.system.sites.find((item: Site) => {
          return item.host == host;
        });
        if (systemSite) {
          this.site.categories = PPF.clone(systemSite.categories);
        }
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

        this.searchEntry = PPF.clone(searchEntry);
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
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.siteSearchEntry.index.headers.name"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("settings.siteSearchEntry.index.headers.categories"),
          align: "left",
          value: "categories"
        },
        {
          text: this.$t("settings.siteSearchEntry.index.headers.enable"),
          align: "left",
          value: "enable"
        },
        {
          text: this.$t("settings.siteSearchEntry.index.headers.action"),
          value: "name",
          sortable: false
        }
      ];
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
