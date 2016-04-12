#!/bin/sh
#
# SCRIPT PER LA GENERAZIONE DELLE SCREENSHOTS DA CARICARE SU APPLE STORE
# SCREENSHOTS DI ORIGINE CREATE DA IPHONE 5s
# ORIGINE: 4 pollici (640 x 1136)
#


[ -d "iphone/3.5 pollici" ] || mkdir "iphone/3.5 pollici"
[ -d "iphone/4.7 pollici" ] || mkdir "iphone/4.7 pollici"
[ -d "iphone/5.5 pollici" ] || mkdir "iphone/5.5 pollici"

for i in 1 2 3 4 5 6 7
do

  # creazione screnshot per device 3.5 pollici (600 x 900)   
  convert -size 640x960 xc:white empty.png
  convert "iphone/4 pollici/STEP-$i.jpg" -resize 500 +profile "*" new.png
  composite -gravity Center new.png empty.png  "iphone/3.5 pollici/STEP-$i.png"
  
  # creazione screnshot per device 4.7 pollici (750 x 1334)  
  convert -size 750x1334 xc:white empty.png
  composite -gravity Center "iphone/4 pollici/STEP-$i.jpg" empty.png  "iphone/4.7 pollici/STEP-$i.png"
  
  # creazione screnshot per device 5.5 pollici (1242 x 2208)
  convert -size 1242x2208 xc:white empty.png
  convert "iphone/4 pollici/STEP-$i.jpg" -resize 900 +profile "*" new.png
  composite -gravity Center new.png empty.png  "iphone/5.5 pollici/STEP-$i.png"
  
done

rm -f empty.png
rm -f new.png

