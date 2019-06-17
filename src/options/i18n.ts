import Vue from "vue";
import VueI18n from "vue-i18n";
import { API } from "@/service/api";

Vue.use(VueI18n);

export const i18n = new VueI18n({
  locale: "",
  fallbackLocale: "zh-CN"
});

export class i18nService {
  // 已加载的语言文件
  public loadedLanguages: Array<string> = [];
  // 已支持的语言文件列表
  public config: Array<any> = [];

  public onChanged: Function = () => {};

  constructor() {}

  /**
   * 初始化语言环境
   * @param langCode
   */
  public init(langCode: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.loadConfig()
        .then(() => {
          this.reset(langCode)
            .then(() => {
              resolve(i18n);
            })
            .catch(() => {
              reject();
            });
        })
        .catch(() => {
          console.error(
            "Loading language configuration file failed. (加载语言配置文件失败)"
          );
        });
    });
  }

  /**
   * 加载语言配置信息
   */
  public loadConfig(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      $.getJSON(`${API.host}/i18n.json`)
        .done((result: any) => {
          this.config = result;
          resolve(this.config);
        })
        .fail(e => {
          reject(e);
        });
    });
  }

  /**
   * 重设语言
   * @param langCode 语言代码
   */
  public reset(langCode: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (i18n.locale !== langCode) {
        if (!this.loadedLanguages.includes(langCode)) {
          $.getJSON(`${API.host}/i18n/${langCode}.json`)
            .done((result: any) => {
              i18n.setLocaleMessage(langCode, result.words);
              this.loadedLanguages.push(langCode);
              i18n.locale = langCode;
              this.onChanged.call(this, langCode);
              resolve(langCode);
            })
            .fail(e => {
              reject(e);
            });
          return;
        }
        i18n.locale = langCode;
      }
      resolve(langCode);
    });
  }
}
