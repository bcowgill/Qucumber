// http://jsbin.com/ofigok/28
// BDD Gherkin and QUnit prototyping
// TA37096
// v28 changed var markers to <> and added scenario ideas for using a table of input/output values
// v27 asynchronous test works
// v26 added async test and gives error
// v25 removed extraneous Parser
// v23 nearly done, just need async test function -- oh, and tabular data
// v24 added some documentation

/*jslint regexp: true, browser: true, sloppy: true, plusplus: true, maxerr: 1000, indent: 3 */

/*global BDD, asyncTest, console, expect, jQuery, module, ok, same, setTimeout, start, test, window */

/*
Object.prototype.getName = function() {
   var funcNameRegex = /function (.{1,})\(/;
   var results = (funcNameRegex).exec((this).constructor.toString());
   return (results && results.length > 1) ? results[1] : "";
};
*/

/*
   Qucumber()

   Constructor for BDD specifications
 */
Qucumber = function () {
   this.setProps({
      skipped: 0,
      scenario: { number: 0, name: ''},
      Specs: []
   });
   this.Rules = this.DefaultRules;
   return this;
};

Qucumber.prototype.typeName = 'Object Qucumber';

/*
   Qucumber.Parser

   Singleton Parser configuration for Qucumber
*/
Qucumber.prototype.Parser = {
   typeName: 'Object Qucumber.Parser',
   SCENARIO: 1,
   GIVEN: 3,
   WHEN: 5,
   THEN: 7,
   SKIP: 9,
//   AND: 11,
   Matcher: [
      'Scenario', /^\s*scenario\s*([\da-z][\):;,\.\-_\da-z]+)\s+(.*)$/i,
      'Given',    /^\s*given\s+(.*)$/i,
      'When',     /^\s*when\s+(.*)$/i,
      'Then',     /^\s*then\s+(.*)$/i,
      'Skip',     /^\s*(?:skip|todo)\s+(.*)$/i,
//      'and',      /^(?:and|also|but)\s+(.*)$/i, // don't really need to parse as we assume everything else is an and clause
      '-'
   ],
   '-': '-'
};
delete Qucumber.prototype.Parser['-'];

/*
   Qucumber.DefaultRules

   Singleton default Rules configuration for Qucumber.
   The default rules simply log all clauses.
*/
Qucumber.prototype.DefaultRules = {
   asyncWaitTime: 2000,
   Scenario: {
      '.': {
         scenario: '', // Will be populated at test time
         expect: 2,
         async: false,
         asyncWaitTime: 50,
         setup: function () {
            Qucumber.prototype.log(Qucumber.prototype.typeName + ".DefaultRules.Scenario[.].setup() " + this.scenario);
            same('setup', true);
         },
         teardown: function () {
            Qucumber.prototype.log(Qucumber.prototype.typeName + ".DefaultRules.Scenario[.].teardown() " + this.scenario);
            same('teardown', true);
         }
      }
   },
   Given: {
      '.': {
         expect: 1,
         run: function () {
            same('given', true);
         }
      }
   },
   When: {
      '.': {
         expect: 1,
         run: function () {
            same('when', true);
         }
      }
   },
   Then: {
      '.': {
         expect: 1,
         run: function () {
            same('then', true);
         }
      }
   }
};

// We need to save the real setTimeout function in case it is overridden
// The sinon.js testing framework is one example which overrides setTimeout()
Qucumber.prototype.setTimeout = setTimeout;

/*
   Qucumber.getTypeName(thing)

   returns the name of the type of thing:
   undefined, boolean, number, string, function, global
   Null, Object, Array, RegExp
   Object Qucumber

   If a non-native object has a typeName property then that will be returned.

*/
Qucumber.prototype.getTypeName = function (thing) {
   var type = typeof thing;

   if (type === 'object') {
      // http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
      type = Object.prototype.toString.call(thing).match(/^\[object (.*)\]$/)[1];
      if (type === 'Object' && typeof thing.typeName !== 'undefined') {
         type = thing.typeName;
      }
   }
   return type;
};

Qucumber.prototype.logType = function (what, thing) {
   this.log(what + ': ' + this.getTypeName(thing));
   return this;
};

Qucumber.prototype.log = function (what) {
//   console.log(what);
   return this;
};

Qucumber.prototype.warn = function (what) {
   console.log(what);
   return this;
};

Qucumber.prototype.trace = function (what) {
//   console.log(what);
   return this;
};

/*
   Qucumber.setProps(rObj, rToObj)

   A simple property copier to avoid blatting the original object.
   This is not a deep copy and is all that is needed here.

   rObj - the object whose shallow properties should be copied
   rToObj - optional object to copy into (defaults to 'this')

   Notes:
   See http://stackoverflow.com/questions/728360/copying-an-object-in-javascript
   for general problems with object copying.
*/
Qucumber.prototype.setProps = function (rObj, rToObj) {
   var key;
   rToObj = rToObj || this;
   for (key in rObj) {
      if (rObj.hasOwnProperty(key)) {
         if (typeof rObj[key] === 'undefined') {
            delete rToObj[key];
         } else {
            rToObj[key] = rObj[key];
         }
      }
   }
   return this;
};

/*
   Qucumber.newFromArray(rArray)

   Add Scenario/Given/When/Then specifications from an array of strings.
   Upper/lower case doesn't matter when parsing the keywords Scenario/Given/When/Then.
   All lines which do not begin with the keywords are considered as 'and' clauses.
   If a line begins with 'skip' it will be ignored (but logged.)
   All lines before the first matching scenario are skipped.
*/
Qucumber.prototype.newFromArray = function (rArray) {
   var idx, clause, scenario = ': ', skipping = false, Match;
   if (this.getTypeName(rArray) === 'Array') {
      for (idx = 0; idx < rArray.length; ++idx) {
         clause = rArray[idx];
         Match = clause.match(this.Parser.Matcher[this.Parser.SCENARIO]);
         if (Match && Match.length) {
            skipping = false;
            this.Specs.push(clause);
            this.Specs.push([]);
            scenario = 'from ' + clause + ': ';
         } else if (this.Specs.length === 0) {
            // No scenario name found yet. skip and log
            ++this.skipped;
            this.warn(this.typeName + ': Skipping unknown clause before any Scenario was seen: [' + clause + ']');
         } else if (clause.match(this.Parser.Matcher[this.Parser.SKIP])) {
            // skip scenario should skip entire scenario, not just the line
            Match = clause.match(this.Parser.Matcher[this.Parser.SKIP]);
            ++this.skipped;
            if (Match[1].match(/^\s*scenario/i)) {
               skipping = true;
               scenario = 'from ' + Match[1] + ': ';
            }
            this.warn(this.typeName + ': Skipping ' + (skipping ? 'scenario' : 'clause') + ': [' + clause + '] ' + (skipping ? '' : scenario));
         } else if (skipping) {
            ++this.skipped;
            this.warn(this.typeName + ': Skipping clause: [' + clause + '] ' + scenario);
         } else {
            this.Specs[this.Specs.length - 1].push(clause);
         }
      }
   }
   return this;
};

/*
   Qucumber.newFromHTML(jqmatch)

   Add Scenario/Given/When/Then specifications from the DOM.
   See newFromArray() for details of the specification syntax.

   jqmatch jquery selector string which selects all specifications to add.
      defaults to '.bdd-scenario,.bdd-spec' If you want to restrict the parser
      to all the specifications contained within a specifically identified element you would
      use '#bdd-tests .bdd-scenario,#bdd-tests .bdd-spec'

   Sample HTML structure:

      <div class="bdd-scenario">Scenario 1: Success Case
         <div class="bdd-spec bdd-given">Given the system in state |X|</div>
         <div class="bdd-spec bdd-given">and the screen is |horizontal|</div>
         <div class="bdd-spec bdd-when">When the user taps on |Y|</div>
         <div class="bdd-spec bdd-when">and the user turns the screen to |vertical|</div>
         <div class="bdd-spec bdd-then">Then the user sees |success|</div>
         <div class="bdd-spec bdd-then">and the user hears |Yes!|</div>
      </div>
      ...

   Note: Assumes jQuery is present.
*/
Qucumber.prototype.newFromHTML = function (jqmatch) {
   jqmatch = jqmatch || '.bdd-scenario,.bdd-spec';
   var idx, rNode, text, Specs = [], rDOMSpecs = jQuery(jqmatch);
   for (idx = 0; idx < rDOMSpecs.length; ++idx) {
      rNode = rDOMSpecs[idx];
      text = rDOMSpecs[idx].firstChild.textContent;
      text = text.replace(/^\s*/, '');
      text = text.replace(/\s*$/, '');
      //text = text.replace(/\s/g, '_');
      if (jQuery(rNode).hasClass('bdd-skip')) {
         this.warn(this.typeName + ': Skipping scenario with class bdd-skip: [' + text + ']');
      } else {
         Specs.push(text);
      }
   }
   this.newFromArray(Specs);
   return this;
};

/*
   Qucumber.queueTests(rRules)

   Queues the specifications for testing using the rules provided.
*/
Qucumber.prototype.queueTests = function (rRules) {
   var idx, clause, count = 0, Match;
   this.Rules = rRules || this.DefaultRules;
   for (idx = 0; idx < this.Specs.length; idx = idx + 2) {
      clause = this.Specs[idx];
      Match = clause.match(this.Parser.Matcher[this.Parser.SCENARIO]);
      if (Match && Match.length) {
         ++count;
         this.queueScenario(Match[1], Match[2], this.Specs[idx + 1]);
      } else {
         this.warn(this.typeName + '.run: ERROR: clause is not a scenario: ' + clause);
      }
   }
   this.log(this.typeName + '.queueTests: ' + count + ' scenarios queued, test runs will commence');
   return this;
};

/*
   Qucumber.queueScenario(name, number, raSpecs)

   Queue the tests for one scenario. QUnit will run them in its own time.

   number - The scenario 'number'. This can be non-numeric like 1.2-a)iii
   name - The scenario name
   raSpecs - The array of Given/When/Then clauses that make up the scenario specification

   Assumes that the module() qunit method is available.
*/
Qucumber.prototype.queueScenario  = function (number, name, raSpecs) {
   var spec = this, scenario, expected, rScenario, rSpecRules, rcTest, waitTime;

   this.scenario = { number: number, name: name };

   number = number === undefined ? "" : " " + number;
   number = number.replace(/:+$/, '');
   scenario = "Scenario" + number + ": " + name;
   spec.log(this.typeName + '.queueScenario: Scenario [' + number + '] [' + name + ']');

   rScenario = this.getScenarioRule(scenario, name);
   rSpecRules = this.getSpecRules(raSpecs);
   expected = rScenario.expect + rSpecRules.expect;
   spec.log(this.typeName + '.queueScenario: expect ' + expected + (rScenario.async ? ' asynchronous' : ''));

   module("Scenario" + number, rScenario);
   rcTest = function () {
      var self = this;
      expect(expected);
      spec.runScenario(rSpecRules, self);
   };
   if (rScenario.async) {
      waitTime = rScenario.asyncWaitTime || this.Rules.asyncWaitTime;
      this.testAsync(name, rcTest, waitTime);
   } else {
      test(name, rcTest);
   }
};

/*
   Qucumber.testAsync(scenario, rcTest, waitTime)

   Run a test using the QUnit asyncTest() to allow for ajax calls or other
   asynchronous behaviour to happen before checking the test results.

   scenario - the name of the scenario (the part after the scenario number)
   rcTest - the function to call to perform the test
   waitTime - optional wait time in ms before resuming the test plan
*/
Qucumber.prototype.testAsync = function (scenario, rcTest, waitTime) {
   var self = this;
   asyncTest(scenario + ' [ASYNC]', function () {
      // How long to wait for tests to complete before resume testing
      waitTime = waitTime || self.DefaultRules.asyncWaitTime;
      self.log(self.typeName + ".asyncTest: " + scenario + " with waitTime " + waitTime);

      rcTest.call(this);

      // Wait for the tests to complete before continuing on the test plan
      self.setTimeout.call(window, function () {
         self.log(self.typeName + ".asyncTest: Timeout: resume testing for " + scenario);
         start();
      }, waitTime);
   });
};

/*
   Qucumber.runScenario(rSpecRules, rTestContext)

   rSpecRules - Object containing specification rules to execute.
      .Tests - the array of rules for each given/when/then in the specification
         .clause, .run, .Params - the test clause name, run function and parameters to pass to the function.
   rTestContext - The QUnit test context in which the test is running.
      contains the setup and teardown function as well as any this.members created
      when setup was called.
*/
Qucumber.prototype.runScenario = function (rSpecRules, rTestContext) {
   var self = this, idx, rTest;

   function makeErrorCallback(clause) {
      return function () {
         self.warn(self.typeName + ".runScenario: ERROR in test plan rules: no 'run' function for clause: " + clause);
      };
   }

   for (idx = 0; idx < rSpecRules.Tests.length; ++idx) {
      rTest = rSpecRules.Tests[idx];
      this.log(this.typeName + '.runScenario: ' + rTest.clause);
      if (rTest.run) {
         ok(true, rTest.clause);
      } else {
         ok(false, rTest.clause);
         rTest.run = makeErrorCallback(rTest.clause);
      }
      rTest.run.apply(rTestContext, rTest.Params);
   }
};

/*
   Qucumber.getScenarioRule(scenario, name)

   Find the scenario test rule which matches the scenario

   scenario - the full scenario name
   name - the scenario name minus the 'scenario' and 'number'
      i.e. if "Scenario 1: test it" then name is 'test it'
*/
Qucumber.prototype.getScenarioRule = function (scenario, name) {
   var rScenario = this.getBestMatch('Scenario', name);
   rScenario.scenario = scenario;
   return rScenario;
};

/*
   Qucumber.getSpecRules(raSpecs)

   Parse the array of given/when/then clauses for a specification and match
   them against the testing rules so that all testing callbacks are identified.

   raSpecs - a plain array of given/when/then specification strings.
*/
// search scenarios to find best match for setup/teardown
// and to compute expected tests
Qucumber.prototype.getSpecRules = function (raSpecs) {
   var idx, lastType = 'Given', rClause, rRule, rRules = { expect: 0, Tests: [] };
   for (idx = 0; idx < raSpecs.length; ++idx) {
      rClause = this.parseClause(lastType, raSpecs[idx]);
      if (rClause.type !== 'Skip') {
         // Look up best matching rule for the clause
         lastType = rClause.type;
         rRule = this.getClauseRule(rClause.type, rClause.params);
         if (rRule) {
            rRules.expect += 1 + rRule.expect;
            rRules.Tests.push(rRule);
         }
      }
   }
   return rRules;
};

Qucumber.prototype.parseClause = function (lastType, clause) {
   var idx, rRegex, Match, type, rClause = { type: undefined, params: '' };
   for (idx = this.Parser.GIVEN; idx < this.Parser.Matcher.length; idx += 2) {
      rRegex = this.Parser.Matcher[idx];
      type = this.Parser.Matcher[idx - 1];
      Match = clause.match(rRegex);
      if (Match && Match.length) {
         rClause.type = type === 'and' ? lastType : type;
         if (type !== 'Skip') {
            rClause.params = Match[1];
         } else {
            this.warn(this.typeName + '.parseClause: WARN: skip found: ' + clause);
         }
         break;
      }
   }
   if (rClause.type === undefined) {
      rClause.type = lastType;
      rClause.params = clause;
   }
   if (rClause.type !== 'Skip') {
      this.trace(this.typeName + '.parseClause: type: ' + rClause.type + ' params: ' + rClause.params);
   }
   return rClause;
};

Qucumber.prototype.getClauseRule = function (type, clause) {
   var rRule = this.getBestMatch(type, clause);
   rRule.clause = type + ' ' + clause;
   rRule.expect = rRule.expect || 0;
   return rRule;
};

Qucumber.prototype.getBestMatch = function (type, clause) {
   var key, rRegex, matchLength = 0, Match, Matches = [], rRule = {};

   for (key in this.Rules[type]) {
      if (this.Rules[type].hasOwnProperty(key)) {
         rRegex = new RegExp(key, 'i');
         Match = clause.match(rRegex);
         if (Match && Match.length) {
            if (Match[0].length > matchLength) {
               Matches = [ key ];
               matchLength = Match[0].length;
               rRule.key = key;
               Match.shift();
               rRule.Params = Match;
            } else if (Match[0].length === matchLength) {
               Matches.push(key);
            }
         }
      }
   }
   if (Matches.length > 1) {
      this.warn(this.typeName + '.getBestMatch: WARN: multiple ' + type + ' rules match clause [' + clause + '] only the first match will be used');
      for (key = 0; key < Matches.length; ++key) {
         this.warn(this.typeName + '.getBestMatch: WARN: rule #' + key + ': ' + Matches[key]);
      }
   }
   if (matchLength) {
      this.setProps(this.Rules[type][rRule.key], rRule);
   } else {
      this.warn(this.typeName + '.getBestMatch: WARN: no ' + type + ' rules match clause [' + clause + '], will use default rule.');
      this.setProps(this.DefaultRules[type]['.'], rRule);
      rRule.key = '.';
      rRule.Params = [];
   }
   return rRule;
};
