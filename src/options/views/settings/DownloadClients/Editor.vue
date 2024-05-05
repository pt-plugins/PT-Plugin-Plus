<template>
  <div>
    <v-card class="mb-5" :color="$vuetify.dark ? '' : 'grey lighten-4'">
      <v-card-text>
        <v-form v-model="option.valid">
          <v-text-field
            v-model="option.name"
            :label="$t('settings.downloadClients.editor.name')"
            :placeholder="$t('settings.downloadClients.editor.name')"
            required
            :rules="rules.require"
          ></v-text-field>
          <v-text-field
            v-model="option.address"
            :label="$t('settings.downloadClients.editor.address')"
            :placeholder="$t('settings.downloadClients.editor.addressTip')"
            required
            :rules="[rules.url]"
          ></v-text-field>

          <v-text-field
            v-model="option.loginName"
            :label="$t('settings.downloadClients.editor.loginName')"
            :placeholder="$t('settings.downloadClients.editor.loginName')"
            v-if="!option.passwordOnly"
          ></v-text-field>

          <v-text-field
            v-model="option.loginPwd"
            :label="$t('settings.downloadClients.editor.loginPwd')"
            :placeholder="$t('settings.downloadClients.editor.loginPwd')"
            :type="showPassword ? 'text' : 'password'"
            :append-icon="showPassword ? 'visibility_off' : 'visibility'"
            @click:append="showPassword = !showPassword"
          ></v-text-field>

          <v-switch
              :label="$t('settings.downloadClients.editor.enabled')"
              v-model="option.enabled"
          ></v-switch>

          <v-switch
            :label="$t('settings.downloadClients.editor.autoStart')"
            v-model="option.autoStart"
            v-if="['transmission', 'qbittorrent'].includes(option.type)"
          ></v-switch>

          <v-switch
            :label="$t('settings.downloadClients.editor.tagIMDb')"
            v-model="option.tagIMDb"
            v-if="['qbittorrent'].includes(option.type)"
          ></v-switch>

          <!--站点 host 作为 qb 标签-->
          <v-switch
              :label="$t('settings.downloadClients.editor.hostnameAsTag')"
              v-model="option.hostnameAsTag"
          ></v-switch>
          <!--站点名 作为 qb 标签-->
          <v-switch
              :label="$t('settings.downloadClients.editor.siteNameAsTag')"
              v-model="option.siteNameAsTag"
          ></v-switch>
          <!--启用 qb 分类-->
          <v-switch
              :label="$t('settings.downloadClients.editor.enableCategory')"
              v-model="option.enableCategory"
          ></v-switch>
          <!--自定义分类列表-->
          <v-textarea v-if="option.enableCategory" v-model="categoryText"
              :label="$t('settings.downloadClients.editor.enableCategoryText')"
              :hint="$t('settings.downloadClients.editor.enableCategoryTextTip')"
          ></v-textarea>

          <v-text-field
            :value="option.type"
            :label="$t('settings.downloadClients.editor.type')"
            disabled
          ></v-text-field>
          <v-text-field
            :label="$t('settings.downloadClients.editor.id')"
            disabled
            :value="option.id"
            :placeholder="$t('settings.downloadClients.editor.autoCreate')"
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
          {{ successMsg || errorMsg || $t('settings.downloadClients.editor.test') }}
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
import Vue from "vue";
import Extension from "@/service/extension";
import {EAction, DataResult, Dictionary, QbCategory} from "@/interface/common";
const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      showPassword: false,
      categoryText: '',
      rules: {
        require: [(v: any) => !!v || "!"],
        url: (v: any) => {
          return (
            /^(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;\[\]]+[-A-Za-z0-9+&@#/%=~_|]$/.test(
              v
            ) || this.$t("settings.downloadClients.editor.addressTip")
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
      let qbCategories: QbCategory[] = this.option.qbCategories || [];
      this.categoryText = qbCategories.map(c => `${c.name},${c.path}`).join('\n')
    },
    categoryText() {
      this.option.qbCategories = this.categoryText.split(/\n/).filter(_ => !!_)
          .map(_ => _.split(/\s*[,，]\s*/)).filter(([name, path]) => !!name && !!path)
          .map(([name, path]) => ({name, path}))
    },
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
        this.errorMsg = this.$t(
          "settings.downloadClients.editor.testAddressError"
        ).toString();
        return;
      }
      this.testing = true;

      extension
        .sendRequest(EAction.testClientConnectivity, null, options)
        .then((result: DataResult) => {
          console.log(result);
          if (result.success) {
            this.successMsg = this.$t(
              "settings.downloadClients.editor.testSuccess"
            ).toString();
            this.setTestButtonStatus(this.testButtonStatus.success);
          } else if (result && result.data) {
            if (result.data.msg) {
              this.errorMsg = result.data.msg;
            } else if (result.data.code === 0) {
              this.errorMsg = this.$t(
                "settings.downloadClients.editor.testConnectionError"
              ).toString();
            } else {
              this.errorMsg = this.$t(
                "settings.downloadClients.editor.testOtherError",
                {
                  code: result.data.code
                }
              ).toString();
            }
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
