<template>
  <v-layout class="mt-3">
    <v-flex xs12 sm6 offset-sm3>
      <v-card>
        <v-img src="http://sf.co.ua/13/04/wallpaper-2729515.jpg" aspect-ratio="2.75"></v-img>

        <v-card-title primary-title>
          <div>
            <h3 class="headline">{{ words.title }}</h3>
            <div>
              <li class="body-2" v-for="(item, index) in words.permissions" :key="index">{{item}}</li>
            </div>
          </div>
        </v-card-title>

        <v-card-actions>
          <v-btn flat color="success" @click="request">授权</v-btn>
          <v-btn flat color="orange">我不用了</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      words: {
        title: "PT 助手需要以下权限才能正常使用：",
        permissions: ["所有网站的访问权限", "选项卡的读取权限"]
      }
    };
  },
  methods: {
    request() {
      // 权限必须在用户操作下请求，例如按钮单击的事件处理函数。
      chrome.permissions.request(
        {
          permissions: ["tabs"],
          origins: ["*://*/*"]
        },
        granted => {
          this.$emit("update", granted);
        }
      );
    }
  }
});
</script>
<style lang="scss" scoped>
.item {
  padding: 5px;
}
</style>
