var Logger = require('../lib/logger');
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
