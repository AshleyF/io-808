#!/bin/bash
if [ "$TRAVIS_BRANCH" == "master" -a "$TRAVIS_PULL_REQUEST" == "false" ]; then
    rm -rf docs || exit 0;
    mkdir docs;
    npm run build;
    cp CNAME docs/CNAME
    ( cd docs
     git init
     git config user.name "Travis-CI"
     git config user.email "vincentriemer@gmail.com"
     git add .
     git commit -m "Deployed to Github Pages"
     git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1
    )
fi