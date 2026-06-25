$mavenDir = "apache-maven-3.9.6"
if (-Not (Test-Path $mavenDir)) {
    Write-Host "Maven not found. Downloading Apache Maven 3.9.6..."
    $url = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    $output = "maven.zip"
    Invoke-WebRequest -Uri $url -OutFile $output
    Write-Host "Extracting Maven..."
    Expand-Archive -Path $output -DestinationPath "."
    Remove-Item $output
    Write-Host "Maven installed successfully under ./$mavenDir"
} else {
    Write-Host "Maven is already installed."
}
