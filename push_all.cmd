@echo off
set CURRENT_BRANCH=capacitor-mobile-app

echo Committing on %CURRENT_BRANCH%...
git add .
git commit -m "Refine hero layout, extract promo content, and update image sizing"
git push origin %CURRENT_BRANCH%

echo Merging into developer...
git checkout developer
git pull origin developer
git merge %CURRENT_BRANCH% -m "Merge %CURRENT_BRANCH% into developer (UI updates)"
git push origin developer

echo Merging into main...
git checkout main
git pull origin main
git merge developer -m "Merge developer into main (UI updates)"
git push origin main

echo Checking back out to %CURRENT_BRANCH%...
git checkout %CURRENT_BRANCH%

echo Done!
