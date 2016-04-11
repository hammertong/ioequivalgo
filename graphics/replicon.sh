#!/bin/sh
# 
# QUESTO SCRIPT CREA UNO SCRIPT 'makeicon.sh' PER GENERARE TUTTE LE ICONE E GLI SPLASH SCREEN
# -------------------------------------------------------------------------------------------
# - DEVE ESSERE LANCIATO DALLA ROOT DIR DEL PROGETTO PHONEGAP
#   sh replicon.sh
# - NELLA ROOT INSERIRE 2 FILES:
# 		1) icon.png     (quadrato dimensione consigliata 512x512 px)
#		2) splash.png   (consigliato di larghezza nn superiore a 300px)
# - LANCIARE sh makeicon.sh
#
echo "convert icon.png --resize 128 www/icon.png" > makeicon.sh
for file in $(find . -name '*.png' -or -name '*.jpg')
do
  w=`convert $file -print "%w" /dev/null`
  h=`convert $file -print "%h" /dev/null`
  if [ "$w" == "$h" ]
  then
    convert $file -print "convert icon.png -resize %w $file\n" /dev/null >> makeicon.sh
  else              
    echo "convert -size ${w}x${h} xc:white empty.png" >> makeicon.sh 
	echo "composite -dissolve 60% -gravity Center splash.png empty.png $file" >> makeicon.sh    
	#convert $file -print "convert -size %wx%h xc:white $file\n" /dev/null >> makeicon.sh	    
  fi
done 

