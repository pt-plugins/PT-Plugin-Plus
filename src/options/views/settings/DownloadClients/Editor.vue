<template>
  <div>
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
            v-if="!option.passwordOnly"
          ></v-text-field>

          <v-text-field
            v-model="option.loginPwd"
            :label="words.loginPwd"
            :placeholder="words.loginPwd"
            :type="showPassword ? 'text' : 'password'"
            :append-icon="showPassword ? 'visibility_off' : 'visibility'"
            @click:append="showPassword = !showPassword"
          ></v-text-field>

          <v-switch
            :label="words.autoStart"
            v-model="option.autoStart"
            v-if="['transmission', 'qbittorrent'].includes(option.type)"
          ></v-switch>

          <v-text-field :value="option.type" :label="words.type" disabled></v-text-field>
          <v-text-field
            :label="words.id"
            disabled
            :value="option.id"
            :placeholder="words.autoCreate"
          ></v-text-field>
        </v-form>

        <v-btn
          flat
          block
          :color="testButtonColor"
          :loading="testing"
          :disabled="testing || !option.valid"
          @click="testClientConnectivity"
        >
          <v-icon class="mr-2">{{ testButtonIcon }}</v-icon>
          {{ successMsg || errorMsg || words.test }}
        </v-btn>
        <v-alert :value="true" color="info" v-if="option.description">{{ option.description }}</v-alert>
        <v-alert :value="true" color="warning" v-if="option.warning">{{ option.warning }}</v-alert>
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
import { EAction, DataResult, Dictionary } from "@/interface/common";
const extension = new Extension();
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
        autoCreate: "<保存后自动生成>",
        test: "测试服务器是否可连接",
        testSuccess: "服务器可连接",
        testConnectionError: "网络连接错误",
        testError: "服务器连接失败",
        testUnknownError: "未知错误",
        testOtherError: "其他错误，服务返回的代码为: $code$",
        testAddressError: "服务器地址错误"
      },
      showPassword: false,
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      testing: false,
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      errorMsg: "",
      testButtonIcon: "compass_calibration",
      testButtonColor: "info",
      testButtonStatus: {
        success: "success",
        error: "error"
      },
      buttonColor: {
        default: "info",
        success: "success",
        error: "error"
      } as Dictionary<any>,
      buttonIcon: {
        default: "compass_calibration",
        success: "done",
        error: "close"
      } as Dictionary<any>
    };
  },
  props: {
    option: Object
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
    testClientConnectivity() {
      this.successMsg = "";
      this.errorMsg = "";
      let options = Object.assign({}, this.option);
      if (!options.address) {
        this.errorMsg = this.words.testAddressError;
        return;
      }
      this.testing = true;

      extension
        .sendRequest(EAction.testClientConnectivity, null, options)
        .then((result: DataResult) => {
          console.log(result);
          if (result.success) {
            this.successMsg = this.words.testSuccess;
            this.setTestButtonStatus(this.testButtonStatus.success);
          } else if (result && result.data) {
            if (result.data.msg) {
              this.errorMsg = result.data.msg;
            } else if (result.data.code === 0) {
              this.errorMsg = this.words.testConnectionError;
            } else {
              this.errorMsg = this.words.testOtherError.replace(
                "$code$",
                result.data.code
              );
            }
          } else {
            this.errorMsg = this.words.testUnknownError;
          }
          this.errorMsg &&
            this.setTestButtonStatus(this.testButtonStatus.error);
          this.testing = false;
        })
        .catch((result: DataResult) => {
          console.log(result);
          if (result && result.data && result.data.msg) {
            this.errorMsg = result.data.msg;
          } else {
            this.errorMsg = this.words.testError;
          }

          this.setTestButtonStatus(this.testButtonStatus.error);
          this.testing = false;
        });
    },

    setTestButtonStatus(status: string) {
      this.testButtonIcon = this.buttonIcon[status];
      this.testButtonColor = this.buttonColor[status];
      window.setTimeout(() => {
        this.testButtonIcon = this.buttonIcon.default;
        this.testButtonColor = this.buttonColor.default;
        this.successMsg = "";
        this.errorMsg = "";
      }, 3000);
    }
  }
});
</script>
