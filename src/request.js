const { isFalsy, isJson } = require("./utils");
const defaultOptions = {
  suppressErrors: true,
  logResponse: false,
};


/**
 * Performs supplied api action.
 */
class Request {
  /**
   *
   * @param {Object} datacenter - `dataCenter` object from dataClient
   * @param {Function} apiAction - apiClient action to take (create, update, etc)
   * @param {Object} options
   * @param {Boolean} options.suppressErrors - If true, will prevent try/catch in perform from throwing error, reporting it back in a pseudo response
   * @param {Boolean} options.logResponse - Will console log response data. Could get messy!
   */
  constructor(datacenter, apiAction = () => {}, options = defaultOptions) {
    this.datacenter = datacenter;
    this.apiAction = apiAction;
    this.options = options;
  }

  get requestArgs() {
    const { apiAction: { length: argCount }, datacenter: dc } = this;
    let args;
    if (argCount === 1) {
      args = [dc];
    } else if (argCount === 2) {
      const { id } = dc;
      if (isFalsy(id)) throw new Error('Must have id to update.');
      args = [id, dc];
    } else {
      throw new Error('weird arg count for fn.');
    }
    return args;
  }

  /**
   * Does the work.
   * Returns a combination of response, and parsed response body.
   * @returns {Promise<({headers: string, error: boolean, body: string, status: string}|{message: *}|string)[]>}
   */
  async perform() {
    const { apiAction } = this;
    let response;
    let body;
    try {
      response = await apiAction(...this.requestArgs);
      if (isJson(response)) {
        body = await response.json();
      } else {
        // 429, 404, and several other responses come back as text.
        const message = await response.text();
        body = { message, error: true, status: response.status };
      }
    } catch(e) {
      if (!this.options.suppressErrors) {
        throw e;
      }
      response = {
        error: true,
        status: 'request-failure',
        body: '',
        headers: ''
      };
      body = `${e}\n${e.stackTrace}`;
    }
    if (this.options.logResponse) {
      console.log(`[${(new Date()).toTimeString()}] - ${this.apiAction.name} - response and body:`, response, body);
    }
    return [response, body];
  }

  static async perform(datacenter, apiAction = () => {}, options = defaultOptions) {
    const request = new this(datacenter, apiAction, options);
    return request.perform();
  }

}

module.exports = { Request };
