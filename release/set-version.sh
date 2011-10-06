#!/bin/bash
# Update the version number in those files which contain one.
export RELEASE_VERSION=$1

find . -name '*.bak' -exec rm {} \; > /dev/null
if [ "x$RELEASE_VERSION" == "x" ]; then
   echo You need to provide a version number to set
   grep \$Id `find . -type f | grep -v set-version.sh`
   exit 1
fi

echo Setting VERSION to $RELEASE_VERSION

grep -l \$Id `find . -type f` | grep -v set-version\.sh | grep -v jscoverage-report > version.lst
perl -i.bak -pne 's{(VERSION \x27? : \s* \x27?) \s* [0-9\.]*(\s+\$Id)[^\$]*\$}{${1}$ENV{"RELEASE_VERSION"}$2\$}xms' `cat version.lst`
grep \$Id `cat version.lst`
