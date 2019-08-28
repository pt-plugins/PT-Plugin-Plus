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

          <v-text-field
            v-model="option.authCode"
            :label="$t('settings.backup.server.editor.authCode')"
            :placeholder="$t('settings.backup.server.editor.authCode')"
            required
            :rules="rules.require"
          >
            <template v-slot:append>
              <v-btn
                flat
                small
                color="primary"
                @click="applyAuthCode"
              >{{ $t('settings.backup.server.editor.applyAuthCode') }}</v-btn>
            </template>
          </v-text-field>
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
import { EAction, DataResult, Dictionary } from "@/interface/common";
const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      showPassword: false,
      rules: {
        require: [(v: any) => !!v || "!"],
        url: (v: any) => {
          return (
            /^(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/.test(
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
      } as Dictionary<any>,
      valid: false,
      option: {
        authCode: ""
      } as any
    };
  },
  props: {
    initData: Object,
    isNew: Boolean
  },
  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    },
    valid() {
      this.$emit("change", {
        data: this.option,
        valid: this.valid
      });
    },
    initData() {
      if (this.initData) {
        this.option = Object.assign(this.option, this.initData);
      }
    }
  },
  methods: {
    applyAuthCode() {
      if (this.option.address) {
        $.getJSON(`${this.option.address}/create`, result => {
          console.log(result);
          this.option.authCode = result.data;
        });
      }
    }
  }
});
</script>
