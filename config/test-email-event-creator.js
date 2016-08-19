var cfg   = require('config');
var defer = require('config/defer').deferConfig;

module.exports = {

  account: 'personalTest',

  auth: {
    scopesGmail: ['https://mail.google.com']
  },

  emailAddress: process.env.PERSONAL_EMAIL_ADDRESS,

  test: {
    timeout: {
      functional: 20000,
      unit: 5000
    }
  }

}
