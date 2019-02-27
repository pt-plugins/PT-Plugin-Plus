<template>
  <div class="home">
    <v-btn flat @click="getInfos" :loading="loading">{{words.getInfos}}</v-btn>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Extension from "@/service/extension";
import { EAction } from "@/interface/common";

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        getInfos: "获取用户信息"
      },
      loading: false
    };
  },

  methods: {
    getInfos() {
      this.loading = true;
      extension
        .sendRequest(EAction.getUserInfo)
        .then((result: any) => {
          console.log(result);
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
});
</script>