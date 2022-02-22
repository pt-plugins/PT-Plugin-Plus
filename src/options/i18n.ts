import Vue from "vue";
import VueI18n from "vue-i18n";
import { API } from "@/service/api";
import { i18nResource } from "@/interface/common";

Vue.use(VueI18n);

export const i18n = new VueI18n({
  locale: "",
  fallbackLocale: "en"
});

export class i18nService {
  // 已加载的语言文件
  public loadedLanguages: Array<string> = [];
  // 已支持的语言文件列表
  public config: Array<any> = [];
  // 当前语言
  public currentLanguage: string = "";

  public onChanged: Function = () => {};
  public onAdded: Function = () => {};
  public onReplaced: Function = () => {};

  private initialized = false;
  public vuei18n = i18n;

  constructor() {
    // 加载所有语言包
    this.loadLangResource("en");
    this.loadLangResource("zh-CN");
  }

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
              this.initialized = true;
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
   * 加载语言资源文件
   * @param langCode
   */
  public loadLangResource(langCode: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      $.getJSON(`${API.host}/i18n/${langCode}.json`)
        .done((result: any) => {
          this.push(result);
          resolve(result);
        })
        .fail(e => {
          reject(e);
        });
    });
  }

  /**
   * push 语言资源
   * @param resource
   */
  public push(resource: i18nResource) {
    if (resource.name && resource.code) {
      if (!this.exists(resource.code)) {
        i18n.setLocaleMessage(resource.code, resource.words);
        this.loadedLanguages.push(resource.code);
      }
    }
  }

  /**
   * 变更语言
   * @param langCode
   */
  public change(langCode: string) {
    if (this.currentLanguage !== langCode) {
      i18n.locale = langCode;
      this.currentLanguage = langCode;
      this.initialized && this.onChanged.call(this, langCode);
    }
  }

  /**
   * 重设语言
   * @param langCode 语言代码
   */
  public reset(langCode: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (this.currentLanguage !== langCode) {
        if (!this.exists(langCode)) {
          this.loadLangResource(langCode)
            .then(() => {
              this.change(langCode);
              resolve(langCode);
            })
            .catch(e => {
              if (langCode != "en") {
                this.reset("en").then(() => {
                  resolve(langCode);
                });
                return;
              }
              reject(e);
            });
          return;
        }
        this.change(langCode);
      }
      resolve(langCode);
    });
  }

  /**
   * 从指定的资源加载新的语言
   * @param resource
   */
  public add(resource: i18nResource): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (resource.name && resource.code) {
        if (this.exists(resource.code)) {
          reject();
        } else {
          this.push(resource);
          i18n.locale = resource.code;
          this.currentLanguage = resource.code;
          this.initialized && this.onAdded.call(this, resource);
          resolve(resource.code);
        }
      } else {
        reject();
      }
    });
  }

  /**
   * 替换已有语言资源
   * @param resource 语言资源内容
   */
  public replace(resource: i18nResource): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (resource.name && resource.code) {
        if (this.exists(resource.code)) {
          i18n.setLocaleMessage(resource.code, resource.words);
          i18n.locale = resource.code;
          this.currentLanguage = resource.code;
          this.initialized && this.onReplaced.call(this, resource);
          resolve(resource.code);
        }
      } else {
        reject();
      }
    });
  }

  public exists(code: string): boolean {
    return this.loadedLanguages.includes(code);
  }
}
