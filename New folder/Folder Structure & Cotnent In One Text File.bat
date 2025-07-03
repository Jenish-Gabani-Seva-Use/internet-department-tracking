@echo off
REM ======= CONFIGURATION ========
set "TITLE_FILE_NAME=Folder Structure & Content In One Text File.txt"
set "TEXT_EXTENSIONS=.txt .csv .log .html .htm .xml .bat .ini .md .json .js .css .py .php .java .cpp .cs .sql"

REM ======= IGNORE SETTINGS - ADD YOUR FOLDERS AND FILES HERE =======
REM Add folder names you want to ignore (separate with spaces)
set "IGNORE_FOLDERS=Backup .git testing temp build dist"

REM Add file names you want to ignore (separate with spaces) 
set "IGNORE_FILES==123 package-lock config .gitignore"

REM ======= END CONFIGURATION =====

REM Get current folder path
set "CURRENT_DIR=%~dp0"
set "OUTPUT_FILE=%CURRENT_DIR%%TITLE_FILE_NAME%"

REM Delete old output file if exists
if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"

setlocal EnableDelayedExpansion

REM Write the TITLE at the top of the file
echo Folder listing for: %CURRENT_DIR% > "%OUTPUT_FILE%"
echo Generated on: %DATE% %TIME% >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

REM Write the folder + file hierarchy (filtered)
echo ===== FOLDER TREE ===== >> "%OUTPUT_FILE%"
call :ShowTree "%CURRENT_DIR%" 0 >> "%OUTPUT_FILE%"
echo ===== END OF TREE ===== >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

REM Process file contents
echo ===== FILE CONTENTS ===== >> "%OUTPUT_FILE%"
call :ProcessFolder "%CURRENT_DIR%" ""
echo ===== END OF FILE CONTENTS ===== >> "%OUTPUT_FILE%"

endlocal

echo.
echo ===================================
echo Done! Full dump created: %OUTPUT_FILE%
echo ===================================
pause
goto :eof

REM ======= FUNCTION TO SHOW FILTERED TREE =======
:ShowTree
setlocal EnableDelayedExpansion
set "FOLDER_PATH=%~1"
set "LEVEL=%~2"
set "INDENT="

REM Create indentation
for /L %%i in (1,1,%LEVEL%) do set "INDENT=!INDENT!    "

REM Show current folder name
for %%F in ("%FOLDER_PATH%") do echo !INDENT!%%~nxF\

REM Process subfolders
for /D %%D in ("%FOLDER_PATH%\*") do (
    set "SKIP_FOLDER="
    set "FOLDER_NAME=%%~nxD"
    
    REM Check if folder should be ignored
    for %%I in (%IGNORE_FOLDERS%) do (
        if /I "!FOLDER_NAME!"=="%%I" set "SKIP_FOLDER=1"
    )
    
    if not defined SKIP_FOLDER (
        set /A "NEXT_LEVEL=%LEVEL%+1"
        call :ShowTree "%%D" !NEXT_LEVEL!
    ) else (
        echo !INDENT!    [IGNORED] !FOLDER_NAME!\
    )
)

REM Show files in current folder
for %%F in ("%FOLDER_PATH%\*.*") do (
    if not "%%~nxF"=="%TITLE_FILE_NAME%" if not "%%~nxF"=="%%~nx0" (
        set "SKIP_FILE="
        set "FILE_NAME=%%~nF"
        set "FILE_NAME_EXT=%%~nxF"
        
        REM Check if file should be ignored
        for %%I in (%IGNORE_FILES%) do (
            if /I "!FILE_NAME!"=="%%I" set "SKIP_FILE=1"
            if /I "!FILE_NAME_EXT!"=="%%I" set "SKIP_FILE=1"
        )
        
        if not defined SKIP_FILE (
            echo !INDENT!    %%~nxF
        ) else (
            echo !INDENT!    [IGNORED] %%~nxF
        )
    )
)

endlocal
goto :eof

REM ======= FUNCTION TO PROCESS FOLDERS RECURSIVELY =======
:ProcessFolder
setlocal EnableDelayedExpansion
set "FOLDER_PATH=%~1"
set "REL_PATH=%~2"

REM Process files in current folder
for %%F in ("%FOLDER_PATH%\*.*") do (
    if not "%%~nxF"=="%TITLE_FILE_NAME%" if not "%%~nxF"=="%%~nx0" (
        set "SKIP_FILE="
        set "FILE_NAME=%%~nF"
        set "FILE_NAME_EXT=%%~nxF"
        set "FULL_REL_PATH=!REL_PATH!%%~nxF"
        
        REM Check if file should be ignored
        for %%I in (%IGNORE_FILES%) do (
            if /I "!FILE_NAME!"=="%%I" set "SKIP_FILE=1"
            if /I "!FILE_NAME_EXT!"=="%%I" set "SKIP_FILE=1"
        )
        
        if not defined SKIP_FILE (
            REM Check if it is a text file
            set "IS_TEXT_FILE="
            for %%E in (%TEXT_EXTENSIONS%) do (
                if /I "%%~xF"=="%%E" set "IS_TEXT_FILE=1"
            )
            
            echo. >> "%OUTPUT_FILE%"
            echo ================================================= >> "%OUTPUT_FILE%"
            echo FILE: !FULL_REL_PATH! >> "%OUTPUT_FILE%"
            echo ================================================= >> "%OUTPUT_FILE%"
            echo. >> "%OUTPUT_FILE%"
            
            if "!IS_TEXT_FILE!"=="1" (
                if exist "%%F" (
                    for %%S in ("%%F") do if %%~zS GTR 0 (
                        type "%%F" >> "%OUTPUT_FILE%" 2>nul
                        if errorlevel 1 (
                            echo [Error reading file] >> "%OUTPUT_FILE%"
                        )
                    ) else (
                        echo [Empty file] >> "%OUTPUT_FILE%"
                    )
                ) else (
                    echo [File not accessible] >> "%OUTPUT_FILE%"
                )
            ) else (
                echo [Binary file - skipped] >> "%OUTPUT_FILE%"
            )
            
            echo. >> "%OUTPUT_FILE%"
            echo ================================================= >> "%OUTPUT_FILE%"
            echo END OF FILE: !FULL_REL_PATH! >> "%OUTPUT_FILE%"
            echo ================================================= >> "%OUTPUT_FILE%"
            
            echo Processed: !FULL_REL_PATH!
        )
    )
)

REM Process subfolders recursively
for /D %%D in ("%FOLDER_PATH%\*") do (
    set "SKIP_FOLDER="
    set "FOLDER_NAME=%%~nxD"
    set "SUB_REL_PATH=!REL_PATH!%%~nxD\"
    
    REM Check if folder should be ignored
    for %%I in (%IGNORE_FOLDERS%) do (
        if /I "!FOLDER_NAME!"=="%%I" set "SKIP_FOLDER=1"
    )
    
    if not defined SKIP_FOLDER (
        call :ProcessFolder "%%D" "!SUB_REL_PATH!"
    ) else (
        echo Skipped folder: !SUB_REL_PATH!
    )
)

endlocal
goto :eof