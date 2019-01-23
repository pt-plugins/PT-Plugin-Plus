<template>
  <div>
    <v-card class="mb-5" color="grey lighten-4">
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
                @change="change"
              ></v-text-field>
            </v-flex>
          </v-layout>
          <v-layout row>
            <v-flex xs3>
              <v-subheader>{{words.range}}</v-subheader>
            </v-flex>
            <v-flex xs9>
              <div class="list">
                <v-list>
                  <template v-for="(site, index) in sites">
                    <v-list-tile :key="site.host" avatar>
                      <v-list-tile-action>
                        <v-checkbox v-model="site.enabled" color="teal" @change="change"></v-checkbox>
                      </v-list-tile-action>
                      <!-- <v-list-tile-avatar :size="site.enabled?30:18">
                      <img :src="site.icon">
                      </v-list-tile-avatar>-->
                      <v-list-tile-content>
                        <v-list-tile-title :color="site.enabled?'blue':'grey'">
                          <span>{{site.name}}</span>
                        </v-list-tile-title>
                        <v-list-tile-sub-title>
                          <template v-if="site.enabled">
                            <v-container fluid class="ma-0 pa-0 ml-4">
                              <v-layout row wrap class="ma-0 pa-0">
                                <v-flex
                                  class="ma-0 pa-0"
                                  xs3
                                  v-for="(item, key, index) in site.searchEntry"
                                  :key="index"
                                >
                                  <v-checkbox
                                    class="ma-0 pa-0 caption"
                                    :label="item.name"
                                    v-model="item.enabled"
                                    @change="change"
                                  ></v-checkbox>
                                </v-flex>
                              </v-layout>
                            </v-container>
                          </template>
                        </v-list-tile-sub-title>
                      </v-list-tile-content>
                    </v-list-tile>

                    <v-divider :key="index"></v-divider>
                  </template>
                </v-list>
              </div>
            </v-flex>
          </v-layout>
        </v-form>
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
import md5 from "blueimp-md5";
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
        cancel: "取消"
      },
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      errorMsg: "",
      isValid: false,
      checked: [] as SearchSolutionRange[]
    };
  },
  props: {
    option: Object,
    sites: {
      type: Array as () => Array<any>
    }
  },
  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },
  methods: {
    change() {
      let checked: SearchSolutionRange[] = [];

      this.sites.forEach((item: any) => {
        if (item.enabled) {
          let entry: any[] = [];
          if (item.searchEntry) {
            item.searchEntry.forEach((e: SearchEntry) => {
              entry.push(e.enabled);
            });
          }
          checked.push({
            host: item.host,
            siteName: item.name,
            entry
          });
        }
      });
      // console.log(checked);

      this.$emit("change", {
        id: this.option.id,
        name: this.option.name,
        range: checked
      });
    }
  },
  created() {}
});
</script>

<style lang="scss" scoped>
.list {
  max-height: 350px;
  overflow-y: auto;
}
</style>
