# ================================================================
# Smart Hospital QMS - Complete Project Generator
# Run this in PowerShell from your Smart-Queue-System folder
# ================================================================
$ErrorActionPreference = "Stop"
$root = Get-Location
Write-Host "Smart Hospital QMS - Generating project..." -ForegroundColor Cyan

function cf($p, $c) {
    $fp = Join-Path $root $p; $d = Split-Path $fp -Parent
    if ($d -and !(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    [System.IO.File]::WriteAllText($fp, $c, [System.Text.Encoding]::UTF8)
    Write-Host "  + $p" -ForegroundColor DarkGray
}

# Clean old Vite files
@('src','public','node_modules','index.html','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','.oxlintrc.json','bun.lock','setup-part1.ps1','setup-project.ps1') | ForEach-Object {
    $p = Join-Path $root $_; if (Test-Path $p) { Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue }
}

# ============ ROOT ============
cf ".gitignore" "target/`n*.class`n*.jar`nnode_modules/`nfrontend/build/`n.env`n*.log`n.idea/`n.vscode/"

cf "pom.xml" @"
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.2.5</version><relativePath/></parent>
    <groupId>com.qms</groupId><artifactId>smart-hospital-qms</artifactId><version>1.0.0</version><packaging>pom</packaging><name>Smart Hospital QMS</name>
    <modules>
        <module>eureka-server</module><module>api-gateway</module><module>auth-service</module><module>user-service</module>
        <module>appointment-service</module><module>queue-service</module><module>medical-service</module><module>notification-service</module>
    </modules>
    <properties><java.version>21</java.version><spring-cloud.version>2023.0.1</spring-cloud.version></properties>
    <dependencyManagement><dependencies>
        <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-dependencies</artifactId><version>`$`{spring-cloud.version`}</version><type>pom</type><scope>import</scope></dependency>
    </dependencies></dependencyManagement>
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>
"@

Write-Host "`nDone! Now run: setup-backend.ps1" -ForegroundColor Green
Write-Host "Then run: setup-frontend.ps1" -ForegroundColor Green
