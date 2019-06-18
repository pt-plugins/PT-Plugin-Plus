import PTPlugin from "./service";
import { SearchSolution } from "@/interface/common";

type Service = PTPlugin;

/**
 * 搜索建议
 */
export class OmniBox {
  private splitString = " → ";
  constructor(public service: Service) {
    this.initEvents();
  }

  public init() {}

  private initEvents() {
    if (chrome && chrome.omnibox) {
      // 当用户在浏览器搜索栏输入PT按 tab键进入时，提供前5个搜索方案建议
      chrome.omnibox.onInputChanged.addListener((text, suggest) => {
        if (!text) return;
        if (this.service.options.searchSolutions) {
          let result: any[] = [];
          this.service.options.searchSolutions.forEach(
            (solution: SearchSolution) => {
              result.push({
                content: `${solution.name}${this.splitString}${text}`,
                description: this.service.i18n.t("service.omnibox.search", {
                  solutionName: solution.name,
                  text
                })
                //  `在《${
                //   solution.name
                // }》方案中搜索 “${text}” 的相关种子`
              });
            }
          );

          if (result.length > 0) {
            suggest(result);
          }
        }
      });

      // 当用户接收关键字建议时触发
      chrome.omnibox.onInputEntered.addListener(text => {
        let solutionName = "";
        let solutionId = "";
        let key = "";
        if (text.indexOf(this.splitString) != -1) {
          [solutionName, key] = text.split(this.splitString);
          if (solutionName && this.service.options.searchSolutions) {
            let solution = this.service.options.searchSolutions.find(
              (item: SearchSolution) => {
                return item.name == solutionName;
              }
            );
            if (solution) {
              solutionId = solution.id;
            }
          }
        } else {
          key = text;
        }

        // 按关键字进行搜索
        chrome.tabs.create({
          url:
            "index.html#/search-torrent/" +
            key +
            (solutionId ? `/${solutionId}` : "")
        });
      });
    }
  }
}
