#!/bin/bash
rm release/Qucumber.tar.gz
find . -name '*.bak' -exec rm {} \;
tar cvzf release/Qucumber.tar.gz README.md 0-test-bdd.html Qucumber.js test-plan.js

