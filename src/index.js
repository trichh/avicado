const { apiClient } = require('./api-client');
const { dataClient } = require('./data-client');
const { Batch } = require('./batch');
const { combineCounts, createErrorSummary, logErrorSummary, createValidationSummary, logValidationSummary, colors} = require('./utils');

const defaultOptions = {
  logTiming: false,
  logPostprocess: true,
  logValidationSummary: true,
  logErrorSummary: true,
  logResponseCodeSummary: true,
}

/**
 * Starts batches for insertable and updatable datacenter records
 */
class Import {
  constructor(options = defaultOptions) {
    this.options = options;
  }

  /**
   * Perform actions prior to starting batches. Data transforms welcome!
   * @returns {Promise<void>}
   */
  async preprocess() {
    // Check on api status prior to attempting writes!
    await apiClient.status();

    dataClient.enableImport();
  }

  /**
   * Performs batches of requests.
   * @returns {Promise<*[][]>}
   */
  async process() {

    const batches = [
      {
        data: dataClient.insertable(),
        apiAction: apiClient.create.bind(apiClient),
      },
      {
        data: dataClient.updatable(),
        apiAction: apiClient.update.bind(apiClient),
      }
    ];

    const results = await Promise.all(batches.map(async ({ data, apiAction }) => {
      if (this.options.logTiming) console.log(`[${(new Date()).toTimeString()}] - ${apiAction.name} starting`);
      let start = (new Date()).getTime();
      const batch = new Batch(data, apiAction);
      const batchResults = await batch.process();
      let elapsed = Math.floor(((new Date()).getTime() - start) / 1000);
      if (this.options.logTiming) console.log(`[${(new Date()).toTimeString()}] - ${apiAction.name} complete in ${elapsed}s`);
      return [batch, batchResults];
    }))

    const batchInstances = results.map(r => { const [batch] = r; return batch; });

    this.counts = batchInstances.map(({ responseCounts }) => responseCounts);

    const batchResults = [
      ...results.map(r => { const [,batchResults] = r; return batchResults; }).reduce((acc, r) => [...acc, ...r], [])
    ];

    this.validationSummary = createValidationSummary(batchResults);

    this.errorSummary = createErrorSummary(batchResults);

    this.batchResults = batchResults;

    return [
      ...batchResults
    ];
  }

  async postprocess() {
    const combined = combineCounts(this.counts);
    if (this.options.logPostprocess) {
      if (this.options.logResponseCodeSummary) console.log(`${colors.underscore}HTTP Status Codes${colors.reset}`);
      if (this.options.logResponseCodeSummary) console.log(combined);
      if (this.options.logErrorSummary) logErrorSummary(this.errorSummary);
      if (this.options.logValidationSummary) logValidationSummary(this.validationSummary);
    }
    return combined;
  }

  /**
   * Gets things moving.
   * @returns {Promise<void>}
   */
  async start() {
    await this.preprocess();
    await this.process();
    await this.postprocess();
  }

  /**
   * Gets things moving... statically?
   * @returns {Promise<void>}
   */
  static async start() {
    const _import = new this();
    return await _import.start();
  }
}

module.exports = { Import };
