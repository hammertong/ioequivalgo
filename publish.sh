#!/bin/sh

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
  
  rsync -avz --recursive --delete webapp/ ios/www/
  rsync -avz --recursive --delete webapp/ android/www/

  echo publish in app development projects ...  
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  cp -f tmp.js android/www/js/index.js
  cp -f tmp.js ios/www/js/index.js
  
  rm -f tmp.js

elif [ "$1" == "prod" ] 
then

  echo publish in production environment ...
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  curl -T webapp/js/data.js ftp://www.farmastampati.mobi/www/preview/www/js/data.js --user Administrator:Phitofarma21\!
  curl -T webapp/query.xml ftp://www.farmastampati.mobi/www/preview/www/query.xml --user Administrator:Phitofarma21\!
  curl -T tmp.js ftp://www.farmastampati.mobi/www/preview/www/js/index.js --user Administrator:Phitofarma21\!
  curl -T webapp/index.html ftp://www.farmastampati.mobi/www/preview/www/index.html --user Administrator:Phitofarma21\!
  
  rm -f tmp.js

elif [ "$1" == "test" ] 
then

  echo publish in test  environment ...
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  curl -T webapp/js/data.js ftp://www.farmastampati.mobi/www/preview/www2/js/data.js --user Administrator:Phitofarma21\!
  curl -T webapp/query.xml ftp://www.farmastampati.mobi/www/preview/www2/query.xml --user Administrator:Phitofarma21\!
  curl -T tmp.js ftp://www.farmastampati.mobi/www/preview/www2/js/index.js --user Administrator:Phitofarma21\!
  curl -T webapp/index.html ftp://www.farmastampati.mobi/www/preview/www2/index.html --user Administrator:Phitofarma21\!
  
  rm -f tmp.js
  
elif [ "$1" == "dev" ] 
then

  echo publish in development environment ...
  echo minify javascript code ...
  uglifyjs webapp/js/index.js -m toplevel --reserved "$RESERVED" > tmp.js
  
  curl -T webapp/js/data.js ftp://www.farmastampati.mobi/www/preview/www3/js/data.js --user Administrator:Phitofarma21\!
  curl -T webapp/query.xml ftp://www.farmastampati.mobi/www/preview/www3/query.xml --user Administrator:Phitofarma21\!
  curl -T tmp.js ftp://www.farmastampati.mobi/www/preview/www3/js/index.js --user Administrator:Phitofarma21\!
  curl -T webapp/index.html ftp://www.farmastampati.mobi/www/preview/www3/index.html --user Administrator:Phitofarma21\!
  
  rm -f tmp.js  
  
elif [ "$1" == "dev-debug" ] 
then

  echo publish in development environment ...
  echo transfer in debug mode ...
  
  curl -T webapp/js/data.js ftp://www.farmastampati.mobi/www/preview/www3/js/data.js --user Administrator:Phitofarma21\!
  curl -T webapp/query.xml ftp://www.farmastampati.mobi/www/preview/www3/query.xml --user Administrator:Phitofarma21\!
  curl -T webapp/js/index.js ftp://www.farmastampati.mobi/www/preview/www3/js/index.js --user Administrator:Phitofarma21\!
  curl -T webapp/index.html ftp://www.farmastampati.mobi/www/preview/www3/index.html --user Administrator:Phitofarma21\!
  
else

  echo "Usage: "
  echo "$0 [ app | prod | test | dev | dev-debug ]"
  echo ""
  
fi

