<template>
  <v-layout class="mt-3">
    <v-flex xs12 sm6 offset-sm3>
      <v-card>
        <v-img src="./assets/banner/default.jpg" aspect-ratio="2.75"></v-img>

        <v-card-title class="pb-1">
          <div v-if="!cancelled">
            <h3 class="title mb-2">{{ words.title }}</h3>
            <h3>{{ words.subtitle }}</h3>
            <div class="mt-1 ml-3">
              <li
                class="subheading"
                v-for="(item, index) in words.permissions"
                :key="index"
              >{{item}}</li>
            </div>
            <div class="logo">
              <v-img src="./assets/icon-64.png" width="64"></v-img>
            </div>
          </div>

          <div v-else class="title mb-2">{{ words.cancelled }}</div>
        </v-card-title>

        <v-card-actions v-if="!cancelled">
          <v-btn flat color="success" @click="authorize">{{ words.authorize }}</v-btn>
          <v-btn flat color="orange" @click="cancel">{{ words.cancel }}</v-btn>
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
        title: "感谢您选择 PT 助手",
        subtitle: "现在距成功仅有一步之遥，助手需要以下权限才能正常使用：",
        authorize: "授权",
        cancel: "我不用了",
        permissions: [
          "所有网站的访问权限，用于搜索和读取做种数据；",
          "活动选项卡的读取权限，用于显示助手图标；"
        ],
        cancelled: "世界如此之大，期待有缘再相会！"
      },
      cancelled: false
    };
  },
  methods: {
    /**
     * 发起用户授权
     */
    authorize() {
      if (chrome && chrome.permissions) {
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
      } else {
        this.$emit("update", true);
      }
    },
    cancel() {
      this.cancelled = true;
    }
  }
});
</script>
<style lang="scss" scoped>
.item {
  padding: 5px;
}

.logo {
  position: absolute;
  right: 20px;
  bottom: 60px;
  opacity: 0.5;
}
</style>
