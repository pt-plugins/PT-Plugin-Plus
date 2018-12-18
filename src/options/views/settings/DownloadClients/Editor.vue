<template>
  <v-card class="mb-5" color="grey lighten-4">
    <v-card-text>
      <v-form v-model="option.valid">
        <v-text-field
          v-model="option.name"
          :label="words.name"
          :placeholder="words.name"
          required
          :rules="rules.require"
        ></v-text-field>
        <v-text-field
          v-model="option.address"
          :label="words.address"
          :placeholder="words.addressTip"
          required
          :rules="rules.require"
        ></v-text-field>

        <v-text-field
          v-model="option.loginName"
          :label="words.loginName"
          :placeholder="words.loginName"
          required
          :rules="rules.require"
        ></v-text-field>

        <v-text-field
          v-model="option.loginPwd"
          :label="words.loginPwd"
          :placeholder="words.loginPwd"
          required
          :rules="rules.require"
          :type="showPassword ? 'text' : 'password'"
          :append-icon="showPassword ? 'visibility_off' : 'visibility'"
          @click:append="showPassword = !showPassword"
        ></v-text-field>

        <v-switch
          :label="words.autoStart"
          v-model="option.autoStart"
          v-if="option.type==='transmission'"
        ></v-switch>

        <v-text-field :value="option.type" :label="words.type" disabled></v-text-field>
        <v-text-field :label="words.id" disabled :value="option.id" :placeholder="words.autoCreate"></v-text-field>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import md5 from "blueimp-md5";
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      words: {
        name: "服务器名称",
        type: "服务器类型",
        address: "服务器地址",
        addressTip: "服务器地址包含端口，如：http://192.168.1.1:5000/",
        loginName: "登录名",
        loginPwd: "登录密码",
        id: "ID",
        autoStart: "发送种子时自动开始下载",
        autoCreate: "<保存后自动生成>"
      },
      showPassword: false,
      rules: {
        require: [(v: any) => !!v || "!"]
      }
    };
  },
  props: {
    option: Object
  },
  computed: {
    // getId(): any {
    //   let id = this.option.id;
    //   if (!id) {
    //     id = md5(new Date().toString());
    //   }
    //   return id;
    // }
  }
});
</script>
