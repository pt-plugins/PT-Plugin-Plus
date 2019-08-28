import { IBackupServer, ERequestMethod } from "@/interface/common";

export class OWSS {
  public serverURL: string = "";
  constructor(public options: IBackupServer) {
    this.serverURL = this.options.address;
    if (this.serverURL.substr(-1) !== "/") {
      this.serverURL += "/";
    }
  }

  private request(
    action: string,
    method: ERequestMethod = ERequestMethod.GET,
    data?: any
  ): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let options: JQuery.AjaxSettings = {
        url: this.serverURL + `${action}`,
        method: method,
        dataType: "json",
        data
      };

      if (method === ERequestMethod.POST) {
        options.processData = false;
        options.contentType = false;
      }

      $.ajax(options)
        .done(result => {
          resolve(result);
        })
        .fail(error => {
          reject(error);
        });
    });
  }

  public create(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request("create")
        .then(result => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            reject();
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  public add(formData: FormData): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(
        `${this.options.authCode}/add`,
        ERequestMethod.POST,
        formData
      )
        .then(result => {
          if (result && result.data === true) {
            resolve(true);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  public get(path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(`${this.options.authCode}/get`, ERequestMethod.GET, {
        path
      })
        .then(result => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  public delete(path: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(`${this.options.authCode}/delete`, ERequestMethod.GET, {
        path
      })
        .then(result => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  public list(options: any = {}): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.request(`${this.options.authCode}/list`, ERequestMethod.GET, options)
        .then(result => {
          if (result && result.data) {
            resolve(result.data);
          } else {
            reject(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}
