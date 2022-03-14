const { Import } = require('./index');

(async()=>{
  try {
    await Import.start();
  } catch (e) {
    console.error(e, e.stackTrace);
  }
})();
