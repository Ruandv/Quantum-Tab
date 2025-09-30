#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Creates a zip file from the dist folder with the format:
 * Quantum_Tab-yyMMdd_packageVersion.zip
 */
function createPublishZip() {
    try {
        // Read package.json to get current version
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const version = packageJson.version;

        // Format current date as yyMMdd
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const dateString = `${year}${month}${day}`;

        // Create zip filename
        const zipFileName = `Quantum_Tab-${dateString}_${version}.zip`;
        const zipPath = path.join(__dirname, '..', zipFileName);

        // Remove existing zip file if it exists
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
            console.log(`Removed existing zip file: ${zipFileName}`);
        }

        // Check if dist folder exists
        const distPath = path.join(__dirname, '..', 'dist');
        if (!fs.existsSync(distPath)) {
            throw new Error('dist folder not found. Please run "npm run build" first.');
        }

        console.log(`Creating zip file: ${zipFileName}`);
        console.log(`Package version: ${version}`);
        console.log(`Date: ${dateString}`);

        // Create zip file using PowerShell on Windows or zip on Unix
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // Use PowerShell Compress-Archive on Windows
            const powershellCommand = `Compress-Archive -Path "dist\\*" -DestinationPath "${zipFileName}" -CompressionLevel Optimal -Force`;
            execSync(`powershell -Command "${powershellCommand}"`, { 
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit' 
            });
        } else {
            // Use zip command on Unix-like systems
            execSync(`cd dist && zip -r "../${zipFileName}" .`, { 
                shell: '/bin/bash',
                stdio: 'inherit' 
            });
        }

        // Verify zip file was created
        if (fs.existsSync(zipPath)) {
            const stats = fs.statSync(zipPath);
            const fileSizeInBytes = stats.size;
            const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
            
            console.log(`✅ Successfully created ${zipFileName} (${fileSizeInMB} MB)`);
            console.log(`📁 Location: ${zipPath}`);
        } else {
            throw new Error('Zip file was not created successfully');
        }

    } catch (error) {
        console.error('❌ Error creating zip file:', error.message);
        process.exit(1);
    }
}

// Run the function
createPublishZip();