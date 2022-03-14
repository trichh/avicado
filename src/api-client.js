const fetch = require('node-fetch');
const { template } = require('./utils');

// const HOST = 'http://localhost:5051';
const HOST = 'https://us-central1-tech-interview-api.cloudfunctions.net/base';
const BASE_PATH = 'api';
const BASE_RESOURCE_NAME = 'datacenters';

/**
 * Handles requests to the api.
 */
class ApiClient {
  constructor() {
    this.baseApiPath = [
      HOST,
      BASE_PATH,
    ].join('/');
  }

  endpoint(path, params = {}) {
    return template(`${this.baseApiPath}/${path.replace(/^(\/?)+/,'')}`, params);
  }

  /**
   * Create a (datacenter) record
   * @param {Object} body - will probably be a datacenter!
   * @returns {Promise<unknown>}
   */
  async create(body) {
    const createFetch = () => {
      return fetch(this.endpoint(BASE_RESOURCE_NAME), {
        body: typeof body === 'object' ? JSON.stringify(body) : body,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      }).then((res) => {
        if (res.ok) return res;
        return createFetch();
      });
    }
    return createFetch();
  }

  /**
   * Update an existing record
   * @param {String} id - identifier
   * @param {Object} body - probably a datacenter object
   * @returns {Promise<unknown>}
   */
  async update(id, body) {
    const updateFetch = () => {
      return fetch(this.endpoint(`${BASE_RESOURCE_NAME}/\${id}`, { id }), {
        body: typeof body === 'object' ? JSON.stringify(body) : body,
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
      }).then((res) => {
        if (res.ok) return res;
        return updateFetch();
      });
    }
    return updateFetch();
  }

  /**
   * Status. Gives you confidence that the api is alive and well.
   * @returns {Promise<unknown>}
   */
  async status() {
    return fetch(this.endpoint('status'), {
      method: 'GET',
    });
  }

}

const apiClient = new ApiClient();

module.exports = { apiClient };
