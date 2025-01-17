<template>
  <div>
    <v-card class="mb-5" :color="$vuetify.dark ? '' : 'grey lighten-4'">
      <v-card-text>
        <v-form v-model="option.valid">
          <!-- 类型 -->
          <v-text-field :label="$t('settings.mediaServers.editor.type')"
            :placeholder="$t('settings.mediaServers.editor.type')" disabled :value="option.type"></v-text-field>

          <!-- 名称 -->
          <v-text-field v-model="option.name" :label="$t('settings.mediaServers.editor.name')"
            :placeholder="$t('settings.mediaServers.editor.name')" required :rules="rules.require"
            ref="name"></v-text-field>

          <!-- 地址 -->
          <v-text-field v-model="option.address" :label="$t('settings.mediaServers.editor.address')"
            :placeholder="$t('settings.mediaServers.editor.address')" required :rules="[rules.url]"></v-text-field>

          <!-- API Key -->
          <v-text-field v-model="option.apiKey" :label="$t('settings.mediaServers.editor.apiKey')"
            :placeholder="$t('settings.mediaServers.editor.apiKey')" required :rules="rules.require"></v-text-field>
        </v-form>

        <v-btn flat block :color="testButtonColor" :loading="testing" :disabled="testing || !option.valid"
          @click="testServerConnectivity">
          <v-icon class="mr-2">{{ testButtonIcon }}</v-icon>
          {{ successMsg || errorMsg || $t('settings.mediaServers.editor.test') }}
        </v-btn>
        <v-alert :value="true" color="info" v-if="option.description">{{ option.description }}</v-alert>
        <v-alert :value="true" color="warning" v-if="option.warning">{{ option.warning }}</v-alert>
      </v-card-text>
    </v-card>
    <v-snackbar v-model="haveError" absolute top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" absolute bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Extension from "@/service/extension";
import { EAction, DataResult, Dictionary } from "@/interface/common";
const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      showPassword: false,
      categoryText: '',
      customTagText: '',
      rules: {
        require: [(v: any) => !!v || "!"],
        url: (v: any) => {
          return (
            /^(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;\[\]]+[-A-Za-z0-9+&@#/%=~_|]$/.test(
              v
            ) || this.$t("settings.mediaServers.editor.addressTip")
          );
        }
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
    option() {
      console.log(`watch option`, this.option)

    },
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },
  methods: {
    testServerConnectivity() {
      this.successMsg = "";
      this.errorMsg = "";
      let options = Object.assign({}, this.option);
      if (!options.address) {
        this.errorMsg = this.$t(
          "settings.downloadClients.editor.testAddressError"
        ).toString();
        return;
      }
      this.testing = true;

      extension
        .sendRequest(EAction.testMediaServerConnectivity, null, options)
        .then((result: DataResult) => {
          console.log(result);
          if (result) {
            this.successMsg = this.$t(
              "settings.downloadClients.editor.testSuccess"
            ).toString();
            this.setTestButtonStatus(this.testButtonStatus.success);
          } else {
            this.errorMsg = this.$t(
              "settings.downloadClients.editor.testUnknownError"
            ).toString();
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
            this.errorMsg = this.$t(
              "settings.downloadClients.editor.testError"
            ).toString();
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
