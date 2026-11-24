@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-21.0.12
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d "%~dp0\..\backend"
echo Starting Order-to-Audit Backend on port 8080...
cmd.exe /c ""C:\Program Files\Apache\Maven\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run"

