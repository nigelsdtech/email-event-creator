'use strict'

var
    account           = require('../../../lib/EmailEventCreator.js'),
    CalendarModel     = require('calendar-model'),
    cfg               = require('config'),
    chai              = require('chai'),
    converter         = require('csvtojson').Converter,
    EmailNotification = require('email-notification'),
    Q                 = require('q'),
    reporter          = require('reporter'),
    utils             = require('./utils.js');

/*
 * Set up chai
 */
chai.should();


var timeout = cfg.test.timeout.functional;


/*
 * The actual tests
 */

describe('Complete success of the inserts', function () {

  before(function (done) { utils.runMainScript(null,done) })

  it('Inserts events into the calendar')
  it('Marks the notification email as read and processed')
  it('Sends out a report email')

  after(function (done) {
    utils.cleanupNotificationEmails(null,done)
  })
});

describe('Partial success of the inserts', function () {

  it('Inserts successful events into the calendar')
  it('Sends out a report email for the successful events')
  it('Sends out a report email for the failed events')
  it('Does not mark the notification email as read and processed')
  it('Sends out a report email')

});

describe('Complete failure of the inserts', function () {

  it('Sends out a report email for the failed events')
  it('Does not mark the notification email as read and processed')

});
