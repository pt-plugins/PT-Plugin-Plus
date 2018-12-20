<template>
  <div>
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-card-title primary-title>
        <div>
          <div>本项目由作者在业余时间完成，如果您喜欢本项目，可以通过捐助来支持作者继续开发。</div>
          <div class="mt-3">支付宝和微信</div>
          <v-img src="./assets/donate.png" max-width="300"></v-img>
          <div
            class="mt-3"
          >This project is completed by the author in his spare time. You can support the author's continued development through donations.</div>
        </div>
      </v-card-title>
      <v-card-actions>
        <v-btn flat color="orange" href="https://www.paypal.me/ronggang" target="_blank">
          <v-icon>attach_money</v-icon>Paypal
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      words: {
        title: "感谢您的关注和支持"
      }
    };
  }
});
</script>
