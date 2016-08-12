'use strict'

var
    CalendarModel     = require('calendar-model'),
    cfg               = require('config'),
    chai              = require('chai'),
    converter         = require('csvtojson').Converter,
    EmailNotification = require('email-notification'),
    sinon             = require('sinon'),
    Account           = require('../../../lib/Account.js');

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

  this.timeout(timeout);

  var
      account,
      accountName,
      calendarModelStub,
      enGmStub,
      enHbpStub


  before(function () {

    enHbpStub = sinon.stub(EmailNotification.prototype,'hasBeenProcessed');
    enGmStub = sinon.stub(EmailNotification.prototype,'getMessage');
    //calendarModelStub = sinon.stub(CalendarModel.prototype,'');

    accountName = "personalTest"

    account = new Account({
      account: accountName
    });

  });

  describe('handleError', function () {


    it('calls the callback with a specific error string', function () {
      var spy = sinon.spy()
      account.handleError('TestError',spy)
      spy.calledWithExactly('Account.js [' + accountName + ']: Error: TestError').should.be.true
    });

  });


  describe('process', function () {

    var handleErrStub

    before(function() {
      handleErrStub = sinon.stub(Account.prototype,'handleError');
    })

    describe('checking processing is required', function () {
      it('calls handleError if the EN api fails', function () {
        enHbpStub.yields('TestError enHbp failed');
        account.process(null,stubFn)
        handleErrStub.calledWithExactly('TestError enHbp failed',stubFn).should.be.true
        enHbpStub.reset()
      });
   
   
      it('bails if a message has already been processed')

    })


    describe('when processing is required', function () {

      var converterStub

      before(function() {
        enHbpStub.yields(null,false)
      })

      it('calls handleError if EN getMessage fails', function () {
        enGmStub.yields('TestError enGm failed');
        account.process(null,stubFn)
        handleErrStub.calledWithExactly('TestError enGm failed',stubFn).should.be.true
      });

      describe('and the email has been retrieved', function () {

        var converterStub,
            emailBody

	var data = [
          { description: "Fly to Dubai", end: { dateTime: '2016-12-18 09:00', timeZone: 'GMT' },
            start: { dateTime: '2016-12-18 20:20', timeZone: 'GST' }, summary: 'LHR-> DXB' },
          { description: "Fly to Bombay", end: { dateTime: '2016-12-19 03:40', timeZone: 'GST' },
            start: { dateTime: '2016-12-18 22:45', timeZone: 'IST' }, summary: 'DXB -> BOM' },
          { description: "Fly back to Dubai", end: { dateTime: '2017-01-07 18:15', timeZone: 'IST' },
            start: { dateTime: '2017-01-07 17:00', timeZone: 'GST' }, summary: 'BOM -> DXB' },
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

        it('calls handleError if the conversion fails', function () {
	  var err = 'TestError converterStub failed'
          converterStub.yields(err);
          account.process(null,stubFn)
          handleErrStub.calledWithExactly('Error converting CSV to JSON - '+err,stubFn).should.be.true
        });

        describe('and the conversion is successful', function () {
   
          it('calls handleError if the calendar creation fails')
   
        })

        after(function() {
          converterStub.reset();
        })
      })
    });
  });

  after(function () {

    account = null
    //calendarModelStub.reset()
    enHbpStub.reset()

  });

});
