import i18next from "i18next";
import PTPlugin from "./service";
import { API } from "@/service/api";
import { i18nResource } from "@/interface/common";

export class i18nService {
  public loadedLanguages: Array<string> = [];
  public i18next = i18next;
  constructor(public service: PTPlugin) {}
  public init() {
    i18next.init({
      interpolation: {
        prefix: "{",
        suffix: "}"
      }
    });
    return this.reset(this.service.options.locale || "en");
  }

  /**
   * 重设语言
   * @param langCode 语言代码
   */
  public reset(langCode: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      console.log(i18next.language);
      if (i18next.language !== langCode) {
        if (!this.loadedLanguages.includes(langCode)) {
          $.getJSON(`${API.host}/i18n/${langCode}.json`)
            .done((result: any) => {
              i18next.addResourceBundle(
                langCode,
                "translation",
                result.words,
                true,
                true
              );
              this.loadedLanguages.push(langCode);
              i18next.changeLanguage(langCode).then(() => {
                resolve(langCode);
              });
            })
            .fail(e => {
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
        i18next.changeLanguage(langCode).then(() => {
          resolve(langCode);
        });
        return;
      }
      resolve(langCode);
    });
  }

  public t(key: any, options?: any): string {
    return i18next.t(key, options);
  }

  public add(resource: i18nResource): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (resource.name && resource.code) {
        if (this.loadedLanguages.includes(resource.code)) {
          reject();
        } else {
          i18next.addResourceBundle(
            resource.code,
            "translation",
            resource.words,
            true,
            true
          );
          this.loadedLanguages.push(resource.code);
          i18next.changeLanguage(resource.code).then(() => {
            resolve(resource.code);
          });
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
        if (this.loadedLanguages.includes(resource.code)) {
          i18next.addResourceBundle(
            resource.code,
            "translation",
            resource.words,
            true,
            true
          );
          i18next.changeLanguage(resource.code).then(() => {
            resolve(resource.code);
          });
        }
      } else {
        reject();
      }
    });
  }
}
