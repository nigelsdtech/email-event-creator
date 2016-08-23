'use strict'

var
    CalendarModel     = require('calendar-model'),
    cfg               = require('config'),
    GmailModel        = require('gmail-model'),
    Q                 = require('q')



/*
 * Various mail/calendar accounts
 */

// Test notification sender
var testerGmail = new gmailModel(cfg.test.testerGmail)

// Gmail of the main account
var gmail = new GmailModel(cfg.emailNotification)

// Calendar of the main account
var calendar = new CalendarModel({
    name:             cfg.account,
    calendarId:       'primary',
    clientSecretFile: cfg.auth.clientSecretFile,
    googleScopes:     cfg.auth.scopesCalendar,
    tokenDir:         cfg.auth.tokenFileDir,
    tokenFile:        cfg.auth.tokenFile
})


/**
 * Check events have been inserted in to the calendar
 *
 * @param {object} params
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */ 
function checkCalenderEventsCreated (params,cb) {

}

/**
 * Clean up the sent/received notification emails
 *
 * @param {object} params (currently unused)
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */ 
function cleanupEmails (params,cb) {

  var enSearchCriteria = 'to:' + cfg.test.notificationTo + ' subject: ' + cfg.emailNotification.subject

  // Get rid of the message sent by the sender
  Q.allSettled([
    Q.nfcall(testerGmail.listMessages, { freetextSearch: enSearchCriteria }),
    Q.nfcall(gmail.listMessages,         { freetextSearch: enSearchCriteria })
  ])
  .spread(function(senderMessages,recipientMessages) {

    var trashJobs = []

    // Add the sender's messages to the list of trash jobs
    if (senderMessages) {
      senderMessages.foreach(function (el) {
        trashJobs.push(Q.nfcall(testerGmail.trashMessages,{messageIds: [el.id]})
      }
    }

    // Add the recipients messages to the list of trash jobs
    if (recipientMessages) {
      recipientMessages.foreach(function (el) {
        trashJobs.push(Q.nfcall(gmail.trashMessages,{messageIds: [el.id]})
      }
    }

    if (trashJobs.length > 0) {
      return Q.allSettled(trashJobs)
    } else {
      Q.resolve(null)
    }
  })
  .then(function() { cb() })
  .fail(function(err) { cb(err) })
  .done()


}

/**
 * Sends a mock notification email
 *
 * @param {object} params
 * @param {string} params.body - email body
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */ 
function sendNotificationEmail (params, cb) {

  personalGmail.sendMessage({
    body: params.body
    subject: cfg.emailNotification.subject
    to: cfg.test.notificationTo
  }, function (err, cb) {
    cb(err)
  })

}

/**
 * Main script run
 *
 * @param {object} params (currently unused)
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */ 
function runMainScript (params,cb) {

  Q.nfcall(account)
  .then(function(empty){ cb(null) })
  .fail(function(err)  { cb(err) })
  .done()

}
