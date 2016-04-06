@echo off
set cp=lib\annotations.jar
set cp=%cp%;lib\commons-logging-1.2.jar
set cp=%cp%;lib\findbugs.jar
set cp=%cp%;lib\log4j-1.3alpha-7.jar
java -cp %cp% -jar portforward.jar 0.0.0.0:8080 127.0.0.1:60510