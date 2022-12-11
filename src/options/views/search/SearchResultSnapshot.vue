<template>
  <div>
    <v-alert :value="true" type="info">{{
      $t("searchResultSnapshot.title")
    }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn
          color="error"
          :disabled="selected.length == 0"
          @click="removeSelected"
        >
          <v-icon class="mr-2">remove</v-icon>
          {{ $t("common.remove") }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length == 0">
          <v-icon class="mr-2">clear</v-icon>
          {{ $t("common.clear") }}
        </v-btn>

        <v-btn
          color="info"
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/search-result-snapshot"
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
        item-key="id"
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
          <!-- 关键字 -->
          <td>{{ props.item.key }} {{ getInfos(props.item) }}</td>
          <td>{{ props.item.time | formatDate }}</td>
          <td>
            <v-btn
              flat
              icon
              small
              class="mx-0"
              :title="$t('searchResultSnapshot.show')"
              :to="`/search-torrent/show-snapshot-${props.item.id}`"
            >
              <v-icon small>image_search</v-icon>
            </v-btn>

            <v-btn
              flat
              icon
              small
              class="mx-0"
              color="error"
              :title="$t('common.remove')"
              @click="removeConfirm(props.item)"
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
          $t("searchResultSnapshot.removeConfirmTitle")
        }}</v-card-title>

        <v-card-text>{{
          $t("searchResultSnapshot.removeConfirm")
        }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm = false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t("common.cancel") }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove()">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t("common.ok") }}</span>
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
import {
  EAction,
  DownloadOptions,
  Site,
  Dictionary,
  ISearchResultSnapshot
} from "@/interface/common";
import Extension from "@/service/extension";

const extension = new Extension();
export default Vue.extend({
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
      siteCache: {} as Dictionary<any>
    };
  },

  methods: {
    clear() {
      if (confirm(this.$t("searchResultSnapshot.clearConfirm").toString())) {
        extension
          .sendRequest(EAction.clearSearchResultSnapshot)
          .then((result: any) => {
            console.log("clearSearchResultSnapshot", result);
            this.items = [];
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

    remove(items: any) {
      if (!items) {
        items = [this.selectedItem];
      }

      extension
        .sendRequest(EAction.removeSearchResultSnapshot, null, items)
        .then((result: any) => {
          console.log("removeSearchResultSnapshot", result);
          this.items = result;
        });
      this.dialogRemoveConfirm = false;
    },

    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    loadSearchResultSnapshot() {
      extension
        .sendRequest(EAction.loadSearchResultSnapshot)
        .then((result: any) => {
          console.log("loadSearchResultSnapshot", result);
          this.items = result;
        });
    },
    getInfos(item: ISearchResultSnapshot) {
      let result = "";
      if (item.searchPayload) {
        if (item.searchPayload.cn) {
          result = item.searchPayload.cn;
        } else if (item.searchPayload.en) {
          result = item.searchPayload.en;
        }
      }

      return result;
    }
  },

  created() {
    this.loadSearchResultSnapshot();
  },

  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("searchResultSnapshot.headers.key"),
          align: "left",
          value: "data.key"
        },
        {
          text: this.$t("searchResultSnapshot.headers.time"),
          align: "left",
          value: "time"
        },
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
