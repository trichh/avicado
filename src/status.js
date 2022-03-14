const { apiClient } = require('./api-client');

(async()=>{
  try {
    console.log('Checking the status endpoint...');
    const response = await apiClient.status();
    if (response.status.toString() === '200') {
      console.log('... done! Everything looks good!');
    } else {
      const text = await response.text();
      console.error(`... ugh. Something went wrong. Let Christopher know. [${response.status} - ${text}]`)
    }
  } catch (e) {
    console.error(`Welp. That's a problem. Something went wrong, double check your internet connection and environment, and try again. If things are still broke, reach out to Christopher.`, e, e.stackTrace);
  }
})();
