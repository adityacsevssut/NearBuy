git add .
git commit -m "Fix vendor location storage and sync"
git push origin capacitor-mobile-app
git checkout developer
git pull origin developer
git merge capacitor-mobile-app -m "Merge capacitor-mobile-app into developer"
git push origin developer
git checkout main
git pull origin main
git merge developer -m "Merge developer into main"
git push origin main
git checkout capacitor-mobile-app
