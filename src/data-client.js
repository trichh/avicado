const { readFileSync } = require('fs');
const { isFalsy, isTruthy } = require('./utils');
const path = require('path');

const load = (filepath) => {
  return JSON.parse(readFileSync(path.resolve(filepath)).toString());
}

/**
 * Initial export of buildings
 * datacenters should have an array of buildings
 * @type {any}
 */
const buildings = load('./src/data/buildings.json');

/**
 * Initial export of datacenters
 * note: some records do not have correct date formats, or buildings associated
 * @type [{id: string, externalId: string, address: string, country: string, city: string, state: string, zipcode: string, owner: string, contactName: string, contactEmail: string, buildingIds: array, buildings: array, import: string, operationalDate: string}]
 */
const dataCenters = load('./src/data/datacenters.json');

/**
 * Provides an interface to datacenter and building data.
 * Also a reasonable place for data mutations/transforms. See `enableImport`;
 */
class DataClient {
  constructor(obj) {
    const {
      buildings,
      dataCenters,
    } = obj;

    this.buildings = buildings;
    this.dataCenters = dataCenters;
  }

  /**
   * Datacenters without an id, and therefore insertable
   * @returns {*}
   */
  insertable() {
    return this.dataCenters.filter(({ id }) => isFalsy(id));
  }

  /**
   * Datacenters with an id, and therefore insertable
   * @returns {*}
   */
  updatable() {
    return this.dataCenters.filter(({ id }) => isTruthy(id));
  }

  /**
   * Exported records came with an import field set to false. To process
   * on the api this value must be true.
   */
  enableImport() {
    this.dataCenters = this.dataCenters.map((dc) => ({ ...dc, import: true }));
  }

}

const dataClient = new DataClient({ buildings, dataCenters });

module.exports = { dataClient };
