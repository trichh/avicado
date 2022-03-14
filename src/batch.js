const { apiClient } = require('./api-client');
const { isFalsy, colors } = require('./utils');
const {dataClient} = require("./data-client");
const { simplifyResults } = require('./utils');
const { Request } = require('./request');

const defaultOptions = {
  logProgress: true,
};

/**
 * Performs a group of Requests
 */
class Batch {
  constructor(records = [], fn = () => {}, options = defaultOptions) {
    if (isFalsy(records)) throw new Error('records must be defined');
    this.records = records;
    this.fn = fn;
    this.sent = 0;
    this.simplifiedResults = [];
    this.options = options;
    this.steps = Array.from(Array(10).keys()).map(i => Math.floor(records.length * ((i + 1) / 10)));
  }

  /**
   * Aggregates response data by status code
   * @returns {{ count: number, bodies: array, headers: array }}
   */
  get groupedStats() {
    if (this._groupedStats) {
      return this._groupedStats;
    }
    this._groupedStats = this.simplifiedResults.reduce((acc, ps) => {
      if (acc.hasOwnProperty(ps.status)) {
        acc[ps.status].count += 1;
        acc[ps.status].bodies = [...acc[ps.status].bodies, ps.body];
        acc[ps.status].headers = [...acc[ps.status].headers, ps.headers];
      } else {
        acc[ps.status] =  {count: 1, bodies: [ps.body], headers: [ps.headers]};
      }
      return acc;
    }, {});
    return this._groupedStats;
  }

  /**
   * Returns an object containing counts of response statuses
   * { '404': 1, '200': 10 }
   * @returns {{}}
   */
  get responseCounts() {
    return Object.keys(this.groupedStats).reduce((acc, key) => {
      return { ...acc, [key]: this.groupedStats[key].count };
    }, {})
  }

  /**
   * Performs requests for all supplied records.
   * returns an array of response,parsed body arrays
   * @example
   * [[response, body]]
   * @returns {Promise<*[]>}
   */
  async process() {
    this.sent = 0;
    this.processStart = (new Date()).getTime();
    const { fn } = this;
    const delayIncrement = 750;
    let delay = 0;
    try {
      const responses = await Promise.all(this.records.map(async (datacenter) => {
        const promise = new Promise(resolve => setTimeout(resolve, delay)).then(() => Request.perform(datacenter, fn));
        setTimeout(() => {
          this.sent += 1;
          if (this.options.logProgress) this.logProgress();
        }, delay)
        delay += delayIncrement;
        return promise;
      }));

      this.simplifiedResults = simplifyResults(responses);

      return responses;
    } catch (e) {
      console.error(e, e.stackTrace);
      throw e;
    } finally {
      this.processEnd = (new Date()).getTime();
      if (this.options.logProgress) this.logEnd();
    }
  }

  /**
   * Logs progress, turn off with options.logProgress
   */
  logProgress() {
    const { sent, records: { length: total }, fn: { name }, steps, processStart: started, processEnd: ended} = this;
    if (sent === 1) {
      console.log(`${colors.underscore}Batch Start (${name})${colors.reset}`)
      console.log(`[${(new Date()).toTimeString()}]${colors.fgGreen} - ${name} - batch started ${colors.reset} (${colors.fgGreen}1${colors.reset} of ${colors.fgGreen}${total}${colors.reset} )`);
    }
    if (steps.includes(sent) && sent !== total) {
      console.log(`[${(new Date()).toTimeString()}]${colors.fgGreen} - ${name} - batch progress ${colors.reset} (${colors.fgGreen}${sent}${colors.reset}  of ${colors.fgGreen}${total}${colors.reset} )`);
    }
  }

  /**
   * Logs batch completion, turn off with options.logProgress
   */
  logEnd() {
    const { sent, records: { length: total }, fn: { name }, steps, processStart: started, processEnd: ended} = this;
    if (sent === total) {
      const elapsed = Math.floor((ended - started) / 1000);
      console.log(`[${(new Date()).toTimeString()}]${colors.fgGreen} - ${name} - batch completed${colors.reset} (${colors.fgGreen}${sent}${colors.reset} of ${colors.fgGreen}${total}${colors.reset}) in ${colors.fgGreen}${elapsed}${colors.reset}s.`);
    }
  }
}

module.exports = { Batch };
