<template>
  <div>
    <v-card color="grey lighten-4">
      <v-card-text>
        <v-form v-model="isValid">
          <v-layout row>
            <v-flex xs3>
              <v-subheader>{{words.name}}</v-subheader>
            </v-flex>
            <v-flex xs9>
              <v-text-field
                v-model="option.name"
                :label="words.name"
                :placeholder="words.name"
                required
                :rules="rules.require"
                @change="change(true)"
              ></v-text-field>
            </v-flex>
          </v-layout>
          <v-layout row>
            <v-flex xs3>
              <v-subheader>{{words.range}}</v-subheader>
            </v-flex>
            <v-flex xs9>
              <div class="list">
                <v-list dense>
                  <!-- 站点列表 -->
                  <v-data-table
                    v-model="selected"
                    :headers="headers"
                    :items="sites"
                    :pagination.sync="pagination"
                    item-key="host"
                    select-all
                    class="elevation-1"
                    hide-actions
                  >
                    <template slot="items" slot-scope="props">
                      <tr>
                        <td style="width:20px;">
                          <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
                        </td>
                        <td>
                          <div>{{ props.item.name }}</div>
                          <v-container v-if="props.item.enabled" fluid class="ma-0 pa-0 ml-4">
                            <v-layout row wrap class="ma-0 pa-0">
                              <v-flex
                                class="ma-0 pa-0"
                                xs3
                                v-for="(item, key, index) in props.item.searchEntry"
                                :key="index"
                              >
                                <v-checkbox
                                  class="ma-0 pa-0 caption"
                                  :label="item.name"
                                  v-model="item.enabled"
                                  @change="change(true)"
                                ></v-checkbox>
                              </v-flex>
                            </v-layout>
                          </v-container>
                        </td>
                      </tr>
                    </template>
                  </v-data-table>
                </v-list>
              </div>
            </v-flex>
          </v-layout>
        </v-form>
        <v-divider class="mb-2"></v-divider>
        <template v-for="(item, index) in checked">
          <v-chip
            :key="index"
            label
            color="blue-grey"
            text-color="white"
            small
            class="mr-2 pl-0"
            disabled
          >{{ item.siteName }}{{ getSiteEntry(item.host, item.entry) }}</v-chip>
        </template>
      </v-card-text>
    </v-card>
    <v-snackbar v-model="haveError" absolute top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar
      v-model="haveSuccess"
      absolute
      bottom
      :timeout="3000"
      color="success"
    >{{ successMsg }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Extension from "@/service/extension";
import {
  EAction,
  DataResult,
  Site,
  SearchSolutionRange,
  SearchEntry
} from "@/interface/common";
const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        name: "方案名称",
        range: "搜索范围",
        id: "ID",
        ok: "确认",
        cancel: "取消",
        selectAll: "全选/取消全选"
      },
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      pagination: {
        rowsPerPage: -1
      },
      headers: [{ text: "站点", align: "left", value: "name" }],
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      errorMsg: "",
      isValid: false,
      checked: [] as SearchSolutionRange[],
      sites: [] as Site[],
      selected: [] as any,
      loading: false
    };
  },
  props: {
    option: Object,
    initSites: {
      type: Array as () => Array<any>
    }
  },
  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    },
    initSites() {
      this.loading = true;
      this.selected = [];
      this.sites = this.initSites;
      this.sites.forEach((item: any) => {
        if (item.enabled) {
          this.selected.push(item);
        }
      });
      this.loading = false;
      this.change(false);
    },
    selected() {
      this.sites.forEach((item: any) => {
        item.enabled = false;
      });

      this.selected.forEach((item: any) => {
        item.enabled = true;
      });

      this.change();
    }
  },
  methods: {
    change(update: boolean = true) {
      if (this.loading) return;
      let checked: SearchSolutionRange[] = [];

      this.sites.forEach((item: any) => {
        if (item.enabled) {
          let entry: any[] = [];
          if (item.searchEntry) {
            item.searchEntry.forEach((e: SearchEntry) => {
              if (e.enabled) {
                entry.push(e.id || e.name);
              }
            });
          }
          checked.push({
            host: item.host,
            siteName: item.name,
            entry
          });
        }
      });

      if (update) {
        this.$emit("change", {
          id: this.option.id,
          name: this.option.name,
          range: checked
        });
      }

      this.checked = checked;
    },
    selectAll(selected: boolean) {
      this.sites.forEach((item: any) => {
        item.enabled = selected;
        if (item.searchEntry) {
          item.searchEntry.forEach((e: SearchEntry) => {
            e.enabled = selected;
          });
        }
      });
      this.change();
    },
    getSiteEntry(host: string, entry: string[]): string {
      let site: Site | undefined = this.sites.find((item: Site) => {
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
    }
  },
  created() {},
  computed: {
    selectedAll(): boolean {
      return this.checked.length === this.sites.length;
    },
    selectedSome(): boolean {
      return this.checked.length > 0 && !this.selectedAll;
    },
    selectAllIcon(): string {
      if (this.selectedAll) return "check_box";
      if (this.selectedSome) return "indeterminate_check_box";
      return "check_box_outline_blank";
    }
  }
});
</script>

<style lang="scss" >
.list {
  max-height: 350px;
  overflow-y: auto;

  .caption {
    .v-input__control {
      .v-input__slot {
        margin: 0;
      }

      .v-input--selection-controls__input {
        margin-right: 0;
      }
    }

    .v-icon {
      font-size: 18px;
    }

    .v-label {
      font-size: 12px;
    }
  }

  .grey {
    filter: grayscale(100%);
  }
}
</style>
