#!/bin/sh
zip -r ../IoEquivalgo-`date +%Y%m%d`.zip * -x "*android/platforms/android/build/*" -x "*ios/platforms/ios/build/*" 

