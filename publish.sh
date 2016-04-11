#!/bin/sh
[ -f .credentials ] || {
  echo "FTP_REMOTE=ftp://www.farmastampati.mobi/www" > .credentials  
  echo "FTP_USER=Administrator" >> .credentials    
  echo "Type Administrator's FTP_PASS, followed by [ENTER]:"
  read pass
  echo "FTP_PASS=$pass" >> .credentials  
}

. .credentials

#::
#:: copy to app project or transfer file on web server
#::
#//
#//  begin configurable section
#//

RESERVED=require,exports,cordova
RESERVED=$RESERVED,app
RESERVED=$RESERVED,OnClickAutocomplete,msgbox,goback,selectionMap_,setPage
export RESERVED

#//
#//  end configurable section
#//

if [ "$1" == "app" ] 
then
  
  #rsync -avz --recursive --delete webapp/ ios/www/
  #rsync -avz --recursive --delete webapp/ android/www/

  rm -rf ios/www
  [ -d ios/www ] || mkdir ios/www
  cp -a webapp/* ios/www

  rm -rf android/www
  [ -d android/www ] || mkdir android/www
  cp -a webapp/* android/www

  echo publish in app development projects ...  
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  cp -f tmp.js android/www/js/index.js
  cp -f tmp.js ios/www/js/index.js

  cp -f webapp/js/config-prod.js android/www/js/config.js
  cp -f webapp/js/config-prod.js ios/www/js/config.js

  echo "updating android app version number ..." 
  xmllint --xpath "*[local-name()='widget']/@version" android/config.xml | sed -e "s/-/_/g;s/^/var /g;s/$/\;/g;s/version/app_version/g" >> android/www/js/config.js
  xmllint --xpath "*[local-name()='widget']/@android-versionCode" android/config.xml | sed -e "s/-/_/g;s/^/var /g;s/$/\;/g" >> android/www/js/config.js

  echo "updating ios app version number ..." 
  xmllint --xpath "*[local-name()='widget']/@version" ios/config.xml | sed -e "s/-/_/g;s/^/var /g;s/$/\;/g;s/version/app_version/g" >> ios/www/js/config.js
  xmllint --xpath "*[local-name()='widget']/@ios-CFBundleVersion" ios/config.xml | sed -e "s/-/_/g;s/^/var /g;s/$/\;/g" >> ios/www/js/config.js

  echo unpacking ios icons and splash screens ...
  unzip -oq graphics/ios_icons.zip -d "ios/platforms/ios/Io Equivalgo/Resources/"
  unzip -oq graphics/ios_splash.zip -d "ios/platforms/ios/Io Equivalgo/Resources/"

  rm -f tmp.js

elif [ "$1" == "prod" ] 
then

  echo publish in production environment ...
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  curl -T webapp/js/data.js $FTP_REMOTE/preview/www/js/data.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/query.xml $FTP_REMOTE/preview/www/query.xml --user $FTP_USER:$FTP_PASS
  curl -T webapp/js/config-prod.js $FTP_REMOTE/preview/www/js/config.js --user $FTP_USER:$FTP_PASS
  curl -T tmp.js $FTP_REMOTE/preview/www/js/index.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/index.html $FTP_REMOTE/preview/www/index.html --user $FTP_USER:$FTP_PASS  

  rm -f tmp.js

elif [ "$1" == "test" ] 
then

  echo publish in test  environment ...
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  curl -T webapp/js/data.js $FTP_REMOTE/preview/www2/js/data.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/query.xml $FTP_REMOTE/preview/www2/query.xml --user $FTP_USER:$FTP_PASS
  curl -T webapp/js/config-prod.js $FTP_REMOTE/preview/www2/js/config.js --user $FTP_USER:$FTP_PASS
  curl -T tmp.js $FTP_REMOTE/preview/www2/js/index.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/index.html $FTP_REMOTE/preview/www2/index.html --user $FTP_USER:$FTP_PASS
  
  rm -f tmp.js
  
elif [ "$1" == "dev" ] 
then

  echo publish in development environment ...
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  curl -T webapp/js/data.js $FTP_REMOTE/preview/www3/js/data.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/query.xml $FTP_REMOTE/preview/www3/query.xml --user $FTP_USER:$FTP_PASS
  curl -T webapp/js/config-dev.js $FTP_REMOTE/preview/www3/js/config.js --user $FTP_USER:$FTP_PASS  
  curl -T tmp.js $FTP_REMOTE/preview/www3/js/index.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/index.html $FTP_REMOTE/preview/www3/index.html --user $FTP_USER:$FTP_PASS
  
  rm -f tmp.js
  
elif [ "$1" == "dev-debug" ] 
then

  echo publish in development environment ...
  echo transfer in debug mode ...
  
  curl -T webapp/js/data.js $FTP_REMOTE/preview/www3/js/data.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/query.xml $FTP_REMOTE/preview/www3/query.xml --user $FTP_USER:$FTP_PASS
  curl -T webapp/js/config-dev.js $FTP_REMOTE/preview/www3/js/config.js --user $FTP_USER:$FTP_PASS  
  curl -T webapp/js/index.js $FTP_REMOTE/preview/www3/js/index.js --user $FTP_USER:$FTP_PASS
  curl -T webapp/index.html $FTP_REMOTE/preview/www3/index.html --user $FTP_USER:$FTP_PASS

elif [ "$1" == "dev-android" ] 
then

  echo publish android version on debug environment ...    

  curl -T android/platforms/android/build/outputs/apk/android-debug.apk $FTP_REMOTE/preview/www3/android-debug.apk --user $FTP_USER:$FTP_PASS
  curl -T backend/vs/FarmastampatiMobi/download.aspx $FTP_REMOTE/preview/www3/download.aspx --user $FTP_USER:$FTP_PASS
  curl -T backend/vs/FarmastampatiMobi/android.html $FTP_REMOTE/preview/www3/android.html --user $FTP_USER:$FTP_PASS
  curl -T backend/vs/FarmastampatiMobi/android.jpg $FTP_REMOTE/preview/www3/android.jpg --user $FTP_USER:$FTP_PASS

elif [ "$1" == "vs" ] 
then

  rm -rf backend/vs/FarmastampatiMobi/www
  [ -d backend/vs/FarmastampatiMobi/www ] || mkdir backend/vs/FarmastampatiMobi/www
  cp -a webapp/* backend/vs/FarmastampatiMobi/www
  cp -f android/platforms/android/build/outputs/apk/android-debug.apk backend/vs/FarmastampatiMobi/android-debug.apk

else

  echo "Usage: "
  echo "$0 [ app | prod | test | dev | dev-debug | dev-android | vs ]"
  echo ""
  
fi

