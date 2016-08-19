'use strict'

var
    CalendarModel     = require('calendar-model'),
    cfg               = require('config'),
    chai              = require('chai'),
    converter         = require('csvtojson').Converter,
    EmailNotification = require('email-notification'),
    reporter          = require('reporter'),
    sinon             = require('sinon'),
    account           = require('../../../lib/Account.js');

/*
 * Set up chai
 */
chai.should();


var timeout = cfg.test.timeout.unit;


// Some utilities
var stubFn = function () {}


/*
 * The actual tests
 */

describe('Account.js', function () {

  var
      cbStub,
      hEStub


  before(function () {

    cbStub = sinon.stub();
    hEStub = sinon.stub(reporter,'handleError');
  });


  describe('process function', function () {

    this.timeout(timeout);

    before(function () {
      account.configure(null)
    });

    describe('checking processing is required', function (done) {

      var enHbpStub

      before(function() {
        enHbpStub = sinon.stub(EmailNotification.prototype,'hasBeenProcessed');
      })

      describe('and the EN api fails', function (done) {

        var errMsg = 'TestError enHbp failed'

        before(function (done) {
          enHbpStub.yields(errMsg);
          account.process(null, function(err) { cbStub(err); done() })
        });

        it('calls handleError',                 function () { hEStub.calledWithExactly({errMsg: errMsg}).should.be.true })
        it('returns the error to the callback', function () { cbStub.calledWithExactly(errMsg          ).should.be.true })

        after(function() {
            cbStub.reset()
            enHbpStub.reset()
            hEStub.reset()
        })
      })

      describe('and the email has already been processed', function (done) {

        var enGmStub

        before(function (done) {
          enHbpStub.yields(null,true);
          enGmStub = sinon.stub(EmailNotification.prototype,'getMessage');
          account.process(null, function(err) { cbStub(err); done() })
        });

        it('bails without retrieving the email',  function () { enGmStub.called.should.be.false })
        it('calls the callback without an error', function () { cbStub.calledWithExactly(null).should.be.true })

        after(function() {
            cbStub.reset()
            enGmStub.restore()
            enHbpStub.reset()
        })
      })

      describe('and retrieving the email', function () {

        var enGmStub

        before(function() {
          enHbpStub.yields(null,false)
          enGmStub = sinon.stub(EmailNotification.prototype,'getMessage');
        })


        describe('and the EN getMessage api fails', function (done) {

          var errMsg = 'TestError enGm failed'

          before(function (done) {
            enGmStub.yields(errMsg);
            account.process(null, function(err) { cbStub(err); done() })
          });

          it('calls handleError',                 function () { hEStub.calledWithExactly({errMsg: errMsg}).should.be.true })
          it('returns the error to the callback', function () { cbStub.calledWithExactly(errMsg          ).should.be.true })

          after(function() {
              cbStub.reset()
              enGmStub.reset()
              hEStub.reset()
          })

        })


        describe('and converting the CSV data to JSON', function () {

          var converterStub,
              emailBody

          var data = [
            { description: "Fly to DXB",   end: {dateTime: '2016-12-18 09:00', timeZone: 'GMT'}, start: {dateTime: '2016-12-18 20:20', timeZone: 'GST'}, summary: 'LHR->DXB' },
            { description: "Fly to BOM",   end: {dateTime: '2016-12-19 03:40', timeZone: 'GST'}, start: {dateTime: '2016-12-18 22:45', timeZone: 'IST'}, summary: 'DXB->BOM' },
            { description: "Fly from DXB", end: {dateTime: '2017-01-07 18:15', timeZone: 'IST'}, start: {dateTime: '2017-01-07 17:00', timeZone: 'GST'}, summary: 'BOM->DXB' },
          ]


          before(function() {


            var emailBody  = "Start|StartTimeZone|End|EndTimeZone|Title|Desc|"

            for (var i = 0; i < data.length; i++) {
              var d = data[i]
              emailBody += "\n" + d.start.dateTime + "|" + d.start.timeZone
              emailBody += "|"  + d.end.dateTime   + "|" + d.end.timeZone
              emailBody += "|"  + d.summary        + "|" + d.description + "|"
            }

            enGmStub.yields(null,{ payload: {body: emailBody} });

            converterStub = sinon.stub(converter.prototype,'fromString');

          })

          describe('and the conversion fails', function (done) {

            var errMsg = 'TestError converterStub failed'

            before(function (done) {
              converterStub.yields(errMsg);
              account.process(null, function(err) { cbStub(err); done() })
            });

            it('calls handleError',                 function () { hEStub.calledWithExactly({errMsg: errMsg}).should.be.true })
            it('returns the error to the callback', function () { cbStub.calledWithExactly(errMsg          ).should.be.true })

            after(function() {
                cbStub.reset()
                converterStub.reset()
                enGmStub.reset()
                hEStub.reset()
            })
          })

          describe('and inserting into the calendar', function () {

            var calendarStub

            before(function() {
              calendarStub = sinon.stub(CalendarModel.prototype,'addEventToGoogle');
              converterStub.yields(null,data);
            })

            describe('and the calendar insert fails', function (done) {

              var errMsg = 'TestError calendar insert failed'

              before(function (done) {
                calendarStub.yields(errMsg)
                account.process(null, function(err) { cbStub(err); done() })
              });

              it('calls handleError',                 function () { hEStub.calledWithExactly({errMsg: errMsg}).should.be.true })
              it('returns the error to the callback', function () { cbStub.calledWithExactly(errMsg          ).should.be.true })

              after(function() {
                  calendarStub.reset()
                  cbStub.reset()
                  hEStub.reset()
              })

            })

            describe('and updating labels on the notification email', function (done) {

              var enULStub

              before(function() {
                calendarStub.yields(null,data);
                enULStub = sinon.stub(EmailNotification.prototype,'updateLabels');
              })

              describe('and the label update fails', function (done) {
   
                var errMsg = 'TestError label update failed'
   
                before(function (done) {
                  enULStub.yields(errMsg)
                  account.process(null, function(err) { cbStub(err); done() })
                });
   
                it('calls handleError',                 function () { hEStub.calledWithExactly({errMsg: errMsg}).should.be.true })
                it('returns the error to the callback', function () { cbStub.calledWithExactly(errMsg          ).should.be.true })
   
                after(function() {
                    cbStub.reset()
                    enULStub.reset()
                    hEStub.reset()
                })
   
              })

              describe('and sending out the completion notice', function (done) {
   
                var rptStub
   
                before(function(done) {
                  enULStub.yields(null,'This is an email with updated labels');
                  rptStub = sinon.stub(reporter,'sendCompletionNotice');
                  account.process(null, function(err) { cbStub(err); done() })
                })

                it('calls the reporter', function () { rptStub.called.should.be.true })

                after(function() {
                    cbStub.reset()
                    hEStub.reset()
                    rptStub.reset()
                })
   
              })


              after(function() {
                  cbStub.reset()
                  enULStub.reset()
                  hEStub.reset()
              })

            }) // updating labels on the notification email

            after(function() {
              calendarStub.restore();
            })

          }) // inserting into the calendar

          after(function() {
            converterStub.restore();
          })
        }) // converting the CSV to JSON


        after(function() {
          enGmStub.restore()
        })

      }) // retrieving the email

      after(function() {
        enHbpStub.restore()
      })
    }); //checking processing is required
  }); // process function

  after(function () {

    cbStub.reset();
    hEStub.reset();

  });

});
