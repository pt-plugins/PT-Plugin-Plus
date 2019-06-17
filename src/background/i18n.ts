import i18next from "i18next";
import PTPlugin from "./service";
import { API } from "@/service/api";

export class i18nService {
  public loadedLanguages: Array<string> = [];
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
}
