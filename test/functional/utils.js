'use strict'

var
    CalendarModel     = require('calendar-model'),
    cfg               = require('config'),
    GmailModel        = require('gmail-model')



/*
 * Personal mailbox
 */

var senderGmail = new gmailModel(cfg.test.personalGmail)


/**
 * Clean up the sent/received notification emails
 *
 * @param {object} params (currently unused)
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */ 
function cleanupNotificationEmails (params,cb) {

  var enSearchCriteria = 'to:' + cfg.test.notificationTo + ' subject: ' + cfg.emailNotification.subject

  // Get rid of the message sent by the sender
  Q.nfcall(senderGmail.listMessages, { freetextSearch: enSearchCriteria })
  .then(function(messages) {
    if (messages) {
      var messagesToTrash = []
      messages.foreach(function (el) { messagesToTrash.push(el.id) }
      return Q.nfcall(senderGmail.trashMessages,{messageIds: messagesToTrash})
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

  Q.nfcall(utils.sendNotificationEmail)
  .then(function() { return Q.nfcall(account()) })
  .then(function() { return Q.nfcall(cb()) })
  .fail(function(err) { cb(err) })
  .done()

}
