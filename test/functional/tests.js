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

  before(function (done) {
    Q.nfcall(utils.sendNotificationEmail, {body: 'OVERRIDE ME'})
    .then(function(empty) { return Q.nfcall(utils.runMainScript,null) } )
    .then(function(empty) { done() })
    .fail(function(e)     { throw new Error(e) })
    .done()
  })

  it('Inserts events into the calendar')
  it('Marks the notification email as read and processed')
  it('Sends out a report email')

  after(function (done) {
    Q.nfcall(utils.cleanupEmails,null)
    .then(function(empty) { done() })
    .fail(function(e) { throw new Error(e) })
    .done()
  })
});

describe('Partial success of the inserts', function () {

  before(function (done) {
    Q.nfcall(utils.sendNotificationEmail, {body: 'OVERRIDE ME'})
    .then(function(empty) { return Q.nfcall(utils.runMainScript,null) } )
    .then(function(empty) { done() })
    .fail(function(e)     { throw new Error(e) })
    .done()
  })
  it('Inserts successful events into the calendar')
  it('Sends out a report email for the successful events')
  it('Sends out a report email for the failed events')
  it('Does not mark the notification email as read and processed')
  it('Sends out a report email')


});

describe('Complete failure of the inserts', function () {

  before(function (done) {
    Q.nfcall(utils.sendNotificationEmail, {body: 'OVERRIDE ME'})
    .then(function(empty) { return Q.nfcall(utils.runMainScript,null) } )
    .then(function(empty) { done() })
    .fail(function(e)     { throw new Error(e) })
    .done()
  })
  it('Sends out a report email for the failed events')
  it('Does not mark the notification email as read and processed')

});

describe('Notification email is empty', function () {

  before(function (done) {
    Q.nfcall(utils.sendNotificationEmail, {body: 'OVERRIDE ME'})
    .then(function(empty) { return Q.nfcall(utils.runMainScript,null) } )
    .then(function(empty) { done() })
    .fail(function(e)     { throw new Error(e) })
    .done()
  })
  it('Sends out a report email for the failed events')
  it('Does not mark the notification email as read and processed')

});

describe('No notification received', function () {

  before(function (done) {
    Q.nfcall(utils.sendNotificationEmail, {body: 'OVERRIDE ME'})
    .then(function(empty) { return Q.nfcall(utils.runMainScript,null) } )
    .then(function(empty) { done() })
    .fail(function(e)     { throw new Error(e) })
    .done()
  })
  it('Does not call the calendar')
  it('Does not send a report')

});
