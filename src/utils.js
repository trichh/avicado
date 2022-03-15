/**
 * Interpolate existing strings. use '${prop}' syntax
 * @example
 * template('Hi, my name is ${name}', { name: 'Shiro' })
 * // 'Hi, my name is Shiro.
 * @param str
 * @param values
 * @returns {*}
 */
const template = (str, values) => {
  let templateString = str.slice();
  const regexp = /\${([^}}]+)}/g;
  // eslint-disable-next-line no-restricted-syntax
  for (const match of templateString.matchAll(regexp)) {
    const [ segment, prop ] = match;
    let value = values[prop];
    if (typeof value === 'undefined' || value === null) {
      throw new Error(`No value provided for '${prop}'`);
    } else if (typeof value.toString === 'function') {
      value = value.toString();
    } else {
      throw new Error(`No value provided for '${prop}'`);
    }
    templateString = templateString.replace(segment, value.toString());
  }
  return templateString;
};

const isNullish = v => (v === null || v === undefined);
const isFalsy = v => (isNullish(v) || typeof v === 'boolean' && !v || typeof v === 'string' && v.length === 0 || Array.isArray(v) && v.length === 0);
const isTruthy = v => !(isNullish(v));

/**
 * Aggregates counts in simple objects
 * @example
 * combineCounts([{hi: 5}, {hi: 6}])
 * // {hi: 11}
 * @param counts
 * @returns {*}
 */
const combineCounts = function(counts = []) {
  return counts.reduce((acc, count) => {
    for (const key of Object.keys(count)) {
      if (!acc.hasOwnProperty(key)) {
        acc[key] = count[key];
      } else {
        acc[key] += count[key];
      }
    }
    return acc;
  }, {});
};

/**
 * Convert a fetch headers object into a normal object.
 * @param response
 * @returns {{name: [string]}}
 */
const headersToObject = (response) => {
  return Array.from(response.headers.entries()).reduce((acc, h)=>{
    const [name, value] = h;
    acc[name] = value;
    return acc;
  },{});
};

/**
 * Check content-type header for json. Super duper naive.
 * @param response
 * @returns {*}
 */
const isJson = (response) => {
  let contentType;
  if (response.headers && typeof response.headers === 'object') {
    contentType = response.headers.get('content-type');
  } else {
    contentType = response;
  }

  return (contentType || '').includes('json');
}

/**
 * Serializes response results for "easier" logging.
 * @param results
 * @returns {{status: string, body: string, headers: string}}
 */
const simplifyResults = (results) => {
  return results.map((res) => {
    const [response, body] = res;

    let headers;
    if (!response.error) {
      headers = headersToObject(response);
    } else {
      headers = response.headers;
    }

    return {
      status: response.status.toString(),
      body: JSON.stringify(body),
      headers: JSON.stringify(headers),
    };
  });
}

const createErrorSummary = (batchResults) => {
  return batchResults.map(br => { const [,body] = br; return body; }).filter(b => {
    return typeof b === 'string' || b.error;
  }).reduce((acc, e) => {
    let message;
    if (typeof e === 'object') {
      message = `${e.status} - ${e.message}`;
    } else {
      message = e.replace(/\nundefined/g, '');
      message = message.replace('https://us-central1-tech-interview-api.cloudfunctions.net', '');
    }

    if (acc.hasOwnProperty(message)) {
      acc[message] += 1;
    } else {
      acc[message] = 1;
    }
    return acc;
  }, {});
};

/**
 * Creates a summary of validation errors
 * @param batchResults
 * @returns {[{valid: boolean, messages: array, url: string, status: number}]}
 */
const createValidationSummary = (batchResults) => {
  return batchResults.filter(br => {
    const [response] = br;
    return response.status === 422;
  }).map(br => {
    const [response, body] = br;
    return { ...body, url: response.url, status: response.status };
  });
};

/**
 * Logs validation summary made by `createValidationSummary`
 * @param validationSummary
 */
const logValidationSummary = (validationSummary) => {
  const fgRed = "\x1b[31m";
  const fgGreen = "\x1b[32m";
  const reset = "\x1b[0m";
  const fgYellow = "\x1b[33m";
  const underscore = "\x1b[4m";
  console.log(`${underscore}Validation Summary${reset}`);
  validationSummary.forEach(vs => {
    const { url, status, messages } = vs;
    console.log(`${fgGreen}(${status}) ${url}${reset}`);
    messages.forEach(m => {
      console.log(`       |---- ${fgYellow}${m}${reset}`);
    });
  });
};

/**
 * Prints the results of `createErrorSummary`
 * @param errorSummary
 */
const logErrorSummary = (errorSummary) => {
  const fgRed = "\x1b[31m";
  const fgGreen = "\x1b[32m";
  const reset = "\x1b[0m";
  console.log(`${colors.underscore}Error Summary${colors.reset}`);
  for (const key of Object.keys(errorSummary)) {
    console.log(`${fgRed}${key}${reset} [occured ${fgGreen}${errorSummary[key]}${reset} time(s)]`);
  }
}

/**
 * Returns datacenter with correct timestamp, buildings, and import set to true
 * @param dc
 * @param buildingsObj
 */
const parseDataCenter = (dc, buildingsObj) => {
  const parsedBuildings = parseBuildings(dc.buildings, dc.buildingIds, buildingsObj);
  const parsedDate = parseDate(dc.operationalDate);
  return { ...dc, operationalDate: parsedDate, buildings: parsedBuildings, import: true };
}

/**
 * Returns array of buildings
 * @param building
 * @param buildingIds
 * @param buildingsObj
 */
const parseBuildings = (building, buildingIds, buildingsObj) => {
  if (!building) {
    return buildingIds.reduce((arr, id) => {
      arr.push(buildingsObj.find(b => b.id === id));
      return arr;
    }, []);
  } else {
    return building;
  }
}

/**
 * Returns timestamp in ISOString format
 * @param date
 */
const parseDate = (date) => {
  if (typeof date === "number") {
    return new Date(date).toISOString();
  } else {
    return date;
  }
}

/**
 * It's funny. I really can't SEE a lot of these colors, but they're
 * fun to put in logs in any case. It's crazy how a little dash of contrast
 * can make so much difference as you're watching logs go by.
 * @type {{bgBlack: string, fgBlue: string, hidden: string, bgWhite: string, bright: string, bgMagenta: string, dim: string, blink: string, reverse: string, fgBlack: string, fgYellow: string, bgCyan: string, bgYellow: string, fgWhite: string, underscore: string, fgMagenta: string, reset: string, bgRed: string, bgBlue: string, fgRed: string, bgGreen: string, fgGreen: string, fgCyan: string}}
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fgBlack: "\x1b[30m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgBlue: "\x1b[34m",
  fgMagenta: "\x1b[35m",
  fgCyan: "\x1b[36m",
  fgWhite: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};


module.exports = { template, isNullish, isFalsy, isTruthy, combineCounts, simplifyResults, isJson, createErrorSummary, logErrorSummary, createValidationSummary, logValidationSummary, colors, parseDataCenter };
