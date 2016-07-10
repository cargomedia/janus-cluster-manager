var Logger = require('../lib/Logger');
Logger.configure({
  "appenders": [
    {
      "type": "logLevelFilter",
      "level": "DEBUG",
      "appender": {
        "type": "console",
        "layout": {
          "type": "colored"
        }
      }
    }
  ]
});
