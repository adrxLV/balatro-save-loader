import { processFile, processJSON } from './balatro-save-loader.js';
import { profileTabs } from './profileUI.js';
import { guessFileType, handleKnownArrays } from './saveLogic.js';
import { saveTabs } from './saveUI.js';
import { settingsTabs } from './settingsUI.js';
import { renderTabs } from './tabs.js';
import { unknownTabs } from './unknownUI.js';

const file = document.getElementById('file');
const download = document.getElementById('download');
const dataDiv = document.getElementById('data');
const buttonDiv = document.getElementById('buttons');
const fileUploadArea = document.getElementById('file-upload-area');
const contentArea = document.getElementById('content-area');

let data = null;
let filename = 'save.jkr';
let saveEverything = null;

function setCanClose(canClose) {
    download.disabled = !canClose;
    if (canClose) {
        download.classList.remove('loading');
    }
}

function showContentArea() {
    if (contentArea) {
        contentArea.style.display = 'block';
        contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function hideContentArea() {
    if (contentArea) {
        contentArea.style.display = 'none';
    }
}

function updateFileUploadArea(hasFile) {
    if (!fileUploadArea) return;
    
    if (hasFile) {
        const icon = fileUploadArea.querySelector('.file-upload-icon');
        const text = fileUploadArea.querySelector('.file-upload-text');
        const hint = fileUploadArea.querySelector('.file-upload-hint');
        
        if (icon) icon.textContent = '✅';
        if (text) text.innerHTML = `<strong>File loaded:</strong> ${filename}`;
        if (hint) hint.textContent = 'Click to choose a different file';
        
        fileUploadArea.style.borderColor = 'var(--success-color)';
        fileUploadArea.style.backgroundColor = 'rgb(16 185 129 / 0.1)';
    } else {
        const icon = fileUploadArea.querySelector('.file-upload-icon');
        const text = fileUploadArea.querySelector('.file-upload-text');
        const hint = fileUploadArea.querySelector('.file-upload-hint');
        
        if (icon) icon.textContent = '📁';
        if (text) text.innerHTML = '<strong>Choose a save file</strong> or drag and drop';
        if (hint) hint.textContent = 'Supports .jkr, .dat and other Balatro save formats';
        
        fileUploadArea.style.borderColor = '';
        fileUploadArea.style.backgroundColor = '';
    }
}

function setupDragAndDrop() {
    if (!fileUploadArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, unhighlight, false);
    });

    fileUploadArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        fileUploadArea.classList.add('drag-over');
    }

    function unhighlight() {
        fileUploadArea.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            file.files = files;
            readFile();
        }
    }
}

function initUI() {
    // File input change handler
    file?.addEventListener('change', readFile);

    // Click handler for file upload area
    fileUploadArea?.addEventListener('click', () => {
        file?.click();
    });

    // Setup drag and drop
    setupDragAndDrop();

    // Download button handler
    download?.addEventListener('click', () => {
        if (!data) return;
        
        download.classList.add('loading');
        download.innerHTML = '<span class="spinner"></span> Processing...';
        
        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                saveEverything?.();
                const buffer = processJSON(data);
                const blob = new Blob([buffer], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                
                // Reset button state
                download.innerHTML = '<span class="download-icon">⬇️</span> Download Modified Save';
                download.classList.remove('loading');
            } catch (error) {
                console.error('Download error:', error);
                download.innerHTML = '<span>❌</span> Download Failed';
                setTimeout(() => {
                    download.innerHTML = '<span class="download-icon">⬇️</span> Download Modified Save';
                    download.classList.remove('loading');
                }, 2000);
            }
        }, 100);
    });

    setCanClose(false);
    updateFileUploadArea(false);
    hideContentArea();

    if (file?.files?.length) {
        readFile();
    }
}

function readFile() {
    const reader = new FileReader();
    reader.onload = (e) => {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer instanceof ArrayBuffer) {
            try {
                window.debugData = data = processFile(arrayBuffer);
                handleKnownArrays(data);
                filename = file?.files?.[0]?.name || filename;
                
                updateFileUploadArea(true);
                showContentArea();
                
                const type = guessFileType(data, filename);
                let tabs = unknownTabs;
                switch (type) {
                    case 'save':
                        tabs = saveTabs;
                        break;
                    case 'profile':
                        tabs = profileTabs;
                        break;
                    case 'settings':
                        tabs = settingsTabs;
                        break;
                }
                const tabData = renderTabs(tabs, { dataDiv, data, type }, buttonDiv, dataDiv);
                tabData.setCanClose = setCanClose;
                setCanClose(true);
                saveEverything = tabData.saveCurrent;
            } catch (e) {
                console.error(e);
                dataDiv.innerHTML = `
                    <div class="card" style="border-color: var(--error-color); background-color: rgb(239 68 68 / 0.05);">
                        <h3 style="color: var(--error-color); margin-top: 0;">❌ Error loading file</h3>
                        <p><strong>Error:</strong> ${e.message}</p>
                        <p>Please make sure you're uploading a valid Balatro save file.</p>
                    </div>
                `;
                showContentArea();
                updateFileUploadArea(false);
            }
        }
    };
    reader.readAsArrayBuffer(file?.files?.[0]);
}

initUI();