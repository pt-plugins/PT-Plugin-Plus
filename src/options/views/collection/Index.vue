<template>
  <div class="collection">
    <v-alert :value="true" type="info">{{ $t("collection.title") }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{ $t("common.remove") }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length==0">
          <v-icon class="mr-2">clear</v-icon>
          {{ $t("common.clear") }}
        </v-btn>
        <v-spacer></v-spacer>

        <!-- <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field> -->
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="link"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td>
            <v-img
              :src="(props.item.movieInfo && props.item.movieInfo.image)?props.item.movieInfo.image:'./assets/movie.png'"
              class="mx-0 my-2"
              contain
              max-height="80"
              position="left center"
            >
              <v-layout style="margin-left: 80px;" row wrap>
                <template v-if="(props.item.movieInfo && props.item.movieInfo.title)">
                  <v-flex xs12>
                    <a
                      :href="props.item.movieInfo.link"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <img src="https://img3.doubanio.com/favicon.ico" class="mr-2 mt-0" width="16" />
                    </a>
                    <span class="title">{{ props.item.movieInfo.title }}</span>

                    <span class="caption ml-2">({{ props.item.movieInfo.year }})</span>
                  </v-flex>

                  <v-flex xs12 class="mb-1">
                    <span class="sub-title">{{ props.item.movieInfo.alt_title }}</span>
                  </v-flex>
                </template>
                <template>
                  <v-flex xs12>
                    <a
                      :href="props.item.link"
                      target="_blank"
                      :title="props.item.title"
                      rel="noopener noreferrer nofollow"
                    >
                      <span>{{ props.item.title }}</span>
                    </a>
                  </v-flex>

                  <v-flex xs12>
                    <span class="sub-title">{{ props.item.subTitle }}</span>
                  </v-flex>
                </template>
              </v-layout>
            </v-img>
            <v-layout class="mb-2" row wrap v-if="!!props.item.site">
              <v-avatar :size="15">
                <img :src="props.item.site.icon" />
              </v-avatar>
              <span class="caption ml-1">{{ props.item.site.name }}</span>
            </v-layout>
          </td>
          <td>{{ props.item.size | formatSize }}</td>
          <td>{{ props.item.time | formatDate }}</td>
          <td>
            <DownloadTo
              :downloadOptions="props.item"
              flat
              icon
              small
              class="mx-0"
              @error="onError"
              @success="onSuccss"
            />
            <v-btn flat icon small @click="removeConfirm(props.item)" color="error" class="mx-0">
              <v-icon small>delete</v-icon>
            </v-btn>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error" multi-line>
      <span v-html="errorMsg"></span>
    </v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success" multi-line>
      <span v-html="successMsg"></span>
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import {
  EAction,
  DownloadOptions,
  Site,
  Dictionary,
  ICollection
} from "@/interface/common";
import Extension from "@/service/extension";
import DownloadTo from "@/options/components/DownloadTo.vue";

const extension = new Extension();
export default Vue.extend({
  components: {
    DownloadTo
  },
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
      options: this.$store.state.options,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      siteCache: {} as Dictionary<any>
    };
  },

  methods: {
    clearMessage() {
      this.successMsg = "";
      this.errorMsg = "";
    },

    clear() {
      if (confirm(this.$t("common.clearConfirm").toString())) {
        extension
          .sendRequest(EAction.clearTorrentCollention)
          .then((result: any) => {
            this.items = [];
          });
      }
    },
    remove(item: ICollection | ICollection[]) {
      extension
        .sendRequest(EAction.deleteTorrentFromCollention, null, item)
        .then((result: any) => {
          this.getTorrentCollections();
        });
    },

    removeConfirm(item: ICollection) {
      if (confirm(this.$t("common.removeConfirm").toString())) {
        this.remove(item);
      }
    },

    getTorrentCollections() {
      extension
        .sendRequest(EAction.getTorrentCollections)
        .then((result: any) => {
          console.log("getTorrentCollections", result);
          this.items = [];
          result.forEach((item: any) => {
            let site = this.siteCache[item.host];
            if (!site) {
              site = this.options.sites.find((site: Site) => {
                return site.host === item.host;
              });
              this.siteCache[item.host] = site;
            }

            item.site = site;

            this.items.push(item);
          });
        });
    },

    removeSelected() {
      if (this.selected && this.selected.length > 0) {
        if (confirm(this.$t("common.actionConfirm").toString())) {
          this.remove(this.selected);
        }
      }
    },

    onError(msg: string) {
      this.errorMsg = msg;
    },

    onSuccss(msg: string) {
      this.successMsg = msg;
    }
  },

  created() {
    this.getTorrentCollections();
  },

  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },

  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("collection.headers.title"),
          align: "left",
          value: "title"
        },
        {
          text: this.$t("collection.headers.size"),
          align: "left",
          value: "size"
        },
        {
          text: this.$t("collection.headers.time"),
          align: "left",
          value: "time"
        },
        {
          text: this.$t("collection.headers.action"),
          value: "title",
          sortable: false,
          width: 150
        }
      ];
    }
  }
});
</script>
<style lang="scss" scoped>
.collection {
  .sub-title {
    color: #aaaaaa;
    font-size: 12px;
  }
}
</style>

<style lang="scss" src="../search/contextMenu.scss"></style>
