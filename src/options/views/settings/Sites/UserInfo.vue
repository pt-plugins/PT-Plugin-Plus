<template>
  <v-dialog v-model="show" max-width="1200">
    <v-card>
      <v-card-title
          class="headline blue-grey darken-2"
          style="color:white"
      >{{ $t('settings.sites.userinfo.title') }}@{{ this.site.name }}</v-card-title>

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="userData"
          :pagination.sync="pagination"
        >
          <template slot="items" slot-scope="props">
            <td>{{ props.item.date }}</td>
            <td>{{ props.item.name }}</td>
            <td>{{ props.item.levelName  }}</td>
            <td class="number">
              <div>
                {{ props.item.uploaded | formatSize }}
                <v-icon small color="green darken-4">expand_less</v-icon>
              </div>
              <div>
                {{ props.item.downloaded | formatSize }}
                <v-icon small color="red darken-4">expand_more</v-icon>
              </div>
            </td>
            <td class="number">{{ props.item.ratio | formatRatio }}</td>
            <td class="number">{{ props.item.seeding }}</td>
            <td class="number">{{ props.item.seedingSize | formatSize }}</td>
            <td class="number">{{ props.item.bonus | formatNumber }}</td>
            <td>
              <v-icon
                  small
                  color="error"
                  class="ml-2"
                  @click="removeConfirm(props.item)"
                  :title="$t('common.remove')"
                  :disabled="props.item.date === 'latest'"
              >delete</v-icon>
            </td>
          </template>

        </v-data-table>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn flat color="success" @click="save">
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">{{ $t('common.ok') }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
// @ts-nocheck
import Vue from "vue";

export default Vue.extend({
  name: "UserInfo",
  data() {
    return {
      dataKey: 'PT-Plugin-Plus-User-Datas',
      show: false,
      rawUserData: [],
      pagination: {
        descending: true,
        sortBy: "date",
        rowsPerPage: 25
      },
      headers: [
        {
          text: this.$t("home.headers.date"),
          align: "left",
          value: "date",
          width: "130px"
        },
        {
          text: this.$t("home.headers.userName"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("home.headers.levelName"),
          align: "left",
          value: "levelName"
        },
        {
          text: this.$t("home.headers.activitiyData"),
          align: "right",
          value: "uploaded",
          width: "160px"
        },
        {
          text: this.$t("home.headers.ratio"),
          align: "right",
          value: "ratio"
        },
        {
          text: this.$t("home.headers.seeding"),
          align: "right",
          value: "seeding"
        },
        {
          text: this.$t("home.headers.seedingSize"),
          align: "right",
          value: "seedingSize"
        },
        {
          text: this.$t("home.headers.bonus"),
          align: "right",
          value: "bonus"
        },
        {
          text: this.$t("settings.sites.index.headers.action"),
          value: "name",
          sortable: false,
          width: '50px'
        }
      ]
    }
  },
  props: {
    value: Boolean,
    site: Object
  },
  model: {
    prop: "value",
    event: "change"
  },
  filters: {
    formatRatio(v: any) {
      if (v > 10000 || v == -1) {
        return "∞";
      }
      let number = parseFloat(v);
      if (isNaN(number)) {
        return "";
      }
      return number.toFixed(2);
    }
  },
  watch: {
    show() {
      this.$emit("change", this.show);
    },
    value() {
      if (this.value) {
        chrome.storage.local.get(this.dataKey, (result) => {
          this.rawUserData = result[this.dataKey][this.site.host];
          this.show = this.value;
        });
      }
    }
  },
  computed: {
    userData() {
      return Object.entries(this.rawUserData).map(v => {
        const user = v[1];
        const {downloaded, uploaded} = user;
        if (downloaded == 0 && uploaded > 0) {
          user.ratio = -1;
        }
        // 重新以 上传量 / 下载量计算分享率
        else if (downloaded > 0) {
          user.ratio = uploaded / downloaded;
        }
        user['date'] = v[0];
        return user;
      })
    }
  },
  methods: {
    save() {
      this.show = false;
    },
    removeConfirm(item) {
      if (confirm(this.$t('settings.sites.userinfo.deleteConfirm'))) {
        this.$delete(this.rawUserData, item.date);
        chrome.storage.local.get(this.dataKey, (result) => {
          delete result[this.dataKey][this.site.host][item.date];
          chrome.storage.local.set(result, () => {

          });
        });
      }
    }
  }
})
</script>

<style scoped>
.number {
  text-align: right;
}
</style>
