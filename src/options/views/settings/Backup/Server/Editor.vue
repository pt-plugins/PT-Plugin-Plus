<template>
  <div>
    <v-card class="mb-5" color="grey lighten-4">
      <v-card-text>
        <v-form v-model="valid">
          <v-text-field
            v-model="option.name"
            :label="$t('settings.backup.server.editor.name')"
            :placeholder="$t('settings.backup.server.editor.name')"
            required
            :rules="rules.require"
          ></v-text-field>
          <v-text-field
            v-model="option.address"
            :label="$t('settings.backup.server.editor.address')"
            :placeholder="$t('settings.backup.server.editor.address')"
            required
            :rules="[rules.url]"
          ></v-text-field>

          <!-- 授权码 -->
          <template v-if="type==='OWSS'">
            <v-text-field
              v-model="option.authCode"
              :label="$t('settings.backup.server.editor.authCode')"
              :placeholder="$t('settings.backup.server.editor.authCode')"
              required
              :rules="rules.require"
              :type="showAuthCode ? 'text' : 'password'"
            >
              <template v-slot:append>
                <v-icon
                  @click="showAuthCode = !showAuthCode"
                >{{showAuthCode ? 'visibility_off' : 'visibility'}}</v-icon>
                <v-btn
                  flat
                  small
                  color="primary"
                  @click="applyAuthCode"
                >{{ $t('settings.backup.server.editor.applyAuthCode') }}</v-btn>
              </template>
            </v-text-field>
          </template>

          <template v-else>
            <!-- 登录名 -->
            <v-text-field
              v-model="option.loginName"
              :label="$t('settings.backup.server.editor.loginName')"
              :placeholder="$t('settings.backup.server.editor.loginName')"
              required
              :rules="rules.require"
            ></v-text-field>

            <v-text-field
              v-model="option.loginPwd"
              :label="$t('settings.backup.server.editor.loginPwd')"
              :placeholder="$t('settings.backup.server.editor.loginPwd')"
              required
              :rules="rules.require"
              :type="showLoginPwd ? 'text' : 'password'"
            >
              <template v-slot:append>
                <v-icon
                  @click="showLoginPwd = !showLoginPwd"
                >{{showLoginPwd ? 'visibility_off' : 'visibility'}}</v-icon>
              </template>
            </v-text-field>
          </template>
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
  Dictionary,
  EBackupServerType
} from "@/interface/common";
const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      showLoginPwd: false,
      showAuthCode: false,
      rules: {
        require: [(v: any) => !!v || "!"],
        url: (v: any) => {
          return (
            /^(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/.test(
              v
            ) || this.$t("settings.backup.server.owss.addressTip")
          );
        }
      },
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      errorMsg: "",
      valid: false,
      option: {
        authCode: "",
        address: "",
        name: "",
        loginName: "",
        loginPwd: "",
        type: EBackupServerType.OWSS
      } as any
    };
  },
  props: {
    initData: Object,
    isNew: Boolean,
    type: {
      type: String,
      default: EBackupServerType.OWSS
    }
  },
  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    },
    option: {
      handler() {
        this.$emit("change", {
          data: this.option,
          valid: this.valid
        });
      },
      deep: true
    },
    type() {
      this.option = Object.assign({}, this.initData);
      this.option.type = this.type;
    },
    initData() {
      if (this.initData) {
        this.option = Object.assign(this.option, this.initData);
        this.option.type = this.type;
      }
    }
  },
  methods: {
    applyAuthCode() {
      this.successMsg = "";
      this.errorMsg = "";
      if (this.option.address) {
        $.ajax({
          url: `${this.option.address}/create`
        })
          .done(result => {
            console.log(result);
            if (result && result.data) {
              this.option.authCode = result.data;
              this.successMsg = result.data;
            } else if (result.code && result.msg) {
              this.errorMsg = result.msg + " (" + result.code + ")";
            }
          })
          .fail((jqXHR, status, text) => {
            if (
              jqXHR.responseJSON &&
              jqXHR.responseJSON.code &&
              jqXHR.responseJSON.msg
            ) {
              this.errorMsg =
                jqXHR.responseJSON.msg + " (" + jqXHR.responseJSON.code + ")";
            } else {
              this.errorMsg = status + ", " + text;
            }
          });
      }
    }
  }
});
</script>
