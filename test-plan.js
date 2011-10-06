/*jslint regexp: true, browser: true, sloppy: true, plusplus: true, maxerr: 1000, indent: 3 */

/*global BDD, Plan, Specs, console, document, jQuery, ok, same, testTypes, window */

//==============================================================================================

var Specs = [
   'todo scenario: kick the tyres',
   'given: there are tyres on the car',
   'scenario 1.2-a)iii something or other',
   'scenario 1.2-34.a.5: kick the tyres',
   'given the system is in state <X>',
   'and the checkbox <active> is <checked>',
   'when the user clicks on <submit>',
   'then the system prints <okay>',
   'and the log says <what>',
   'skip and the debugger is invoked',
   'even the birds are happy',
   'todo scenario: totally skipped kick the tyres',
   'given: there are tyres on the car'
];

/*
   The test plan. Can contains Plan wide constants. Must contain Scenario, Given, When, Then
   to describe how to execute test clauses.

   Scenario contains an object whose keys are regex strings and whose values are an object which
   should contain the number of tests to expect in the setup/teardown functions as well as the
   setup() and teardown() functions themselves.

   Given/When/Then contains an object whose keys are also regex strings and whose values are an object
   which should contain the number of tests to expect in the test as well as the 'run' function to
   execute the tests. When the run function is called, the 'this' variable has access to the Scenario
   name, expect, setup and teardown functions as well as any this variables created during the test setup.

*/
var Plan = {
   'asyncWaitTime': 300,
   'CONSTANT': 24,
   'Scenario': {
      '^kick the tyres': {
         'async': true,
         'asyncWaitTime': 50,
         'expect': 0,
         'setup': function () {
            this.varForTest = 42; // should be visible in the Given/When/Then handlers
            console.log("scenario setup() " + this.scenario);
         },
         'teardown': function () {
            console.log("scenario teardown() " + this.scenario);
         }
      },
      '.': {
         'expect': 2,
         'setup': function () {
            console.log("scenario setup() " + this.scenario);
            ok(true, 'setup() ' + this.scenario);
         },
         'teardown': function () {
            console.log("scenario teardown() " + this.scenario);
            ok(true, 'teardown() ' + this.scenario);
         }
      },
      '-': '-'
   },
   'Given': {
      'the system is in state <([^>]+)>': {
         expect: 4,
         run: function (state) {
            console.log("system.setState(" + state + ")");

            // Access to scenario name is through this.scenario
            same(this.scenario, this.scenario, 'this.scenario: should be');
            // Tests in a Given should assert that the precondition is correct
            same(state, 'X', "system.getState() should be");
            // Check that the vars from scenario setup are visible
            same(this.varForTest, 42, "this.varForTest from setup() should be");
            // Access constants for entire test plan
            same(Plan.CONSTANT, 24, "Plan.CONSTANT should be");
         }
      },
      'the system in state <([^>]+)>': {
         expect: 1,
         run: function (state) {
            console.log("system.setState(" + state + ")");
            // Tests in a Given should assert that the precondition is correct
            same(state, 'X', "system.getState() should be");
         }
      },
      'the checkbox <([^>]+)> is <([^>]+)>': {
         expect: 1,
         run: function (name, checked) {
            console.log("system.setCheckbox(" + name + ", " + checked + ")");
            same(checked, checked, "system.getCheckbox(" + name + ") should be");
         }
      },
      'the screen is <([^>]+)>': {
         expect: 1,
         run: function (orientation) {
            console.log("system.setScreenOrientation(" + orientation + ")");
            same(orientation, orientation, "system.getScreenOrientation() should be");
         }
      },
      '-': '-'
   },
   'When': {
      'the user clicks on <([^>]+)>': {
         expect: 0,
         run: function (name) {
            console.log("system.click(" + name + ")");
            // Not usually any tests in a When clause
         }
      },
      'the user taps on <([^>]+)>': {
         expect: 0,
         run: function (name) {
            console.log("system.tap(" + name + ")");
         }
      },
      'the user turns the screen to <([^>]+)>': {
         expect: 0,
         run: function (orientation) {
            console.log("system.setOrientation(" + orientation + ")");
         }
      },
      '-': '-'
   },
   'Then': {
      'the system prints <([^>]+)>': {
         expect: 1,
         run: function (output) {
            console.log("matches(system.output, /" + output + "/)");
            // Tests in the Then clause are the actual test cases
            same(output, output, "system.output should match");
         }
      },
      'the log says <([^>]+)>': {
         expect: 1,
         run: function (log) {
            console.log("matches(system.log, /" + log + "/)");
            same(log, log, "system.log should match");
         }
      },
      'even the birds are happy': {
         expect: 1,
         run: function () {
            console.log("same(System.birds.getEmotions(), 'happy')");
            same('happy', 'happy', "System.birds.getEmotions() should be");
         }
      },
      'the user sees <([^>]+)>': {
         expect: 1,
         run: function (text) {
            console.log("matches(system.screenText, /" + text + "/)");
            same(text, text, "system.screenText() should match");
         }
      },
      'the user hears <([^>]+)>': {
         expect: 1,
         run: function (text) {
            console.log("matches(system.spokenOutput, /" + text + "/)");
            same(text, text, "system.spokenOutput() should match");
         }
      },
      '-': '-'
   }
};
delete Plan.Scenario['-'];
delete Plan.Given['-'];
delete Plan.When['-'];
delete Plan.Then['-'];

jQuery(document).ready(function () {
   var noRules, rSpecs;
   jQuery('#bdd-spec').html(Specs.join("<br>"));

   noRules = { Scenario: {}, Given: {}, When: {}, Then: {} };

   rSpecs = new Qucumber().newFromArray(Specs).newFromHTML('#bdd-tests .bdd-scenario,#bdd-tests .bdd-spec');
   rSpecs.log(rSpecs.Specs).queueTests(Plan);
});

function testTypes() {
   var rSpecs = new Qucumber([]);

   rSpecs.logType();
   rSpecs.logType(null, null);
   rSpecs.logType(false, false);
   rSpecs.logType(true, true);
   rSpecs.logType(0, 0);
   rSpecs.logType(1, 1);
   rSpecs.logType(1.1234, 1.1234);
   rSpecs.logType(NaN, NaN);
   rSpecs.logType("''", '');
   rSpecs.logType('[]', []);
   rSpecs.logType('{}', {});
   rSpecs.logType('function', function () {});
   rSpecs.logType('/as/i', /as/i);
   rSpecs.logType('window', window);
   rSpecs.logType('Object', Object);
   rSpecs.logType('Object.prototype', Object.prototype);
   rSpecs.logType('console', console);
   rSpecs.logType('BDD.Spec', BDD.Spec);
   rSpecs.logType('new Qucumber()', rSpecs);
   rSpecs.logType('Qucumber.Parser', rSpecs.Parser);
}

