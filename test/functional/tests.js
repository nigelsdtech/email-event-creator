'use strict'

var
    account           = require('../../../lib/EmailEventCreator.js'),
    CalendarModel     = require('calendar-model'),
    cfg               = require('config'),
    chai              = require('chai'),
    converter         = require('csvtojson').Converter,
    EmailNotification = require('email-notification'),
    readJSON          = require('read-json'),
    Q                 = require('q'),
    reporter          = require('reporter'),
    utils             = require('./utils.js');

require('q-foreach2')(Q);

/*
 * Set up chai
 */
chai.should();

/*
 * Configs
 */
var timeout = cfg.test.timeout.functional;
var dataFileDir = '../data/'
var processedLabelId


/*
 * The actual tests
 */

before(function (done) {
  Q.nfcall(gmail.getLabelId,{
    labelName: cfg.processedLabelName,
    createIfNotExists: true
  })
  .then(function (labelId) {processedLabelId=labelId})

})

describe.only('Complete success of the inserts', function () {

  var dataFile = dataFileDir + 'completeSuccess.json'
  var testEvents

  before(function (done) {
    Q.nfcall(readJSON, dataFile)
    .then(function(jdata) {
      testEvents = jdata;
      var emailBody = createEmailBody({events: testEvents})
      return Q.nfcall(utils.sendNotificationEmail,{body: emailBody})
    })
    .then(function(empty) { return Q.nfcall(utils.runMainScript,null) })
    .fin(done)
    .done()
  })

  it('Inserts events into the calendar', function(done) { checkEventsCreated({events: testEvents}, done) })
  it('Marks the trigger email as read and processed', function(done) {checkTriggerUpdated({processedLabelId: processedLabelId}, done)})
  it('Sends out a report email with the correct body', function(done) {checkReport({ events: testEvents }, done)})

  after(function (done) {
    Q.nfcall(utils.cleanupEmails,null)
    .fin(done)
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

after(function (done) {
  Q.nfcall(gmail.deleteLabel,{labelId: processedLabelId}).fin(done)
})
