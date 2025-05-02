// Global variables
let topVideo = null;
let bottomVideo = null;

// Initialize FFmpeg
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

// DOM Elements
const topVideoInput = document.getElementById('top-video-input');
const bottomVideoInput = document.getElementById('bottom-video-input');
const topVideoPreview = document.getElementById('top-video-preview');
const bottomVideoPreview = document.getElementById('bottom-video-preview');
const mergeBtn = document.getElementById('merge-btn');
const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');
const resultContainer = document.getElementById('result');
const mergedVideoPreview = document.getElementById('merged-video-preview');
const downloadLink = document.getElementById('download-link');

// When document is loaded, initialize FFmpeg
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing FFmpeg');
    updateStatus('Loading FFmpeg...');
    
    try {
        // Create FFmpeg instance
        ffmpeg = createFFmpeg({ log: true });
        
        // Load ffmpeg.wasm
        await ffmpeg.load();
        console.log('FFmpeg loaded successfully!');
        updateStatus('FFmpeg ready! You can now upload videos');
        
        // Enable upload buttons
        topVideoInput.disabled = false;
        bottomVideoInput.disabled = false;
    } catch (error) {
        console.error('FFmpeg loading error:', error);
        updateStatus('Error loading FFmpeg. Please try a different browser.');
    }
});

// Function to show status messages
function updateStatus(message) {
    console.log(message);
    progressText.textContent = message;
}



// Handle file uploads
topVideoInput.addEventListener('change', (e) => handleVideoUpload(e, 'top'));
bottomVideoInput.addEventListener('change', (e) => handleVideoUpload(e, 'bottom'));

function handleVideoUpload(event, position) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
    }
    
    console.log(`Uploaded ${position} video:`, file.name, file.type);
    
    const video = position === 'top' ? topVideoPreview : bottomVideoPreview;
    const videoBlob = URL.createObjectURL(file);
    
    video.src = videoBlob;
    
    if (position === 'top') {
        topVideo = file;
    } else {
        bottomVideo = file;
    }
    
    // Enable merge button if both videos are uploaded
    if (topVideo && bottomVideo) {
        mergeBtn.disabled = false;
    }
}

// Handle merge button click
mergeBtn.addEventListener('click', async () => {
    if (!topVideo || !bottomVideo) {
        alert('Please upload both videos first!');
        return;
    }
    
    try {
        // Disable UI while processing
        mergeBtn.disabled = true;
        progressContainer.style.display = 'block';
        updateStatus('Starting merge process...');
        
        // Process and merge videos
        const mergedVideoURL = await mergeVideos();
        
        // Show result
        resultContainer.style.display = 'block';
        mergedVideoPreview.src = mergedVideoURL;
        downloadLink.href = mergedVideoURL;
        updateStatus('Merge complete! You can now preview and download.');
        
    } catch (error) {
        console.error('Error while merging videos:', error);
        updateStatus(`Error: ${error.message || 'Failed to merge videos'}`);
        alert('Error occurred while merging videos. Please check console for details.');
    } finally {
        // Re-enable UI
        mergeBtn.disabled = false;
    }
});

// Function to merge videos
async function mergeVideos() {
    // Check if FFmpeg is loaded
    if (!ffmpeg) {
        updateStatus('Loading FFmpeg...');
        try {
            ffmpeg = createFFmpeg({ log: true });
            await ffmpeg.load();
        } catch (error) {
            updateStatus('Failed to load FFmpeg');
            throw new Error('Could not load FFmpeg');
        }
    }
    
    // Update progress
    updateProgress(5);
    updateStatus('Preparing videos for processing...');
    
    try {
        // Input filenames with safe extensions
        const topVideoName = 'top_video.mp4';
        const bottomVideoName = 'bottom_video.mp4';
        const outputName = 'merged.mp4';
        
        // We'll need to convert MOV files to MP4 first
        const topVideoExt = topVideo.name.split('.').pop().toLowerCase();
        const bottomVideoExt = bottomVideo.name.split('.').pop().toLowerCase();
        
        updateStatus('Writing top video to memory...');
        ffmpeg.FS('writeFile', 'top_input', await fetchFile(topVideo));
        updateProgress(20);
        
        updateStatus('Writing bottom video to memory...');
        ffmpeg.FS('writeFile', 'bottom_input', await fetchFile(bottomVideo));
        updateProgress(30);
        
        // Convert both videos to MP4 format first (this will handle MOV files)
        updateStatus('Converting top video to MP4 format...');
        await ffmpeg.run(
            '-i', 'top_input',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-c:a', 'aac',
            topVideoName
        );
        updateProgress(40);
        
        updateStatus('Converting bottom video to MP4 format...');
        await ffmpeg.run(
            '-i', 'bottom_input',
            '-c:v', 'libx264',
            '-preset', 'ultrafast', 
            '-c:a', 'aac',
            bottomVideoName
        );
        updateProgress(50);
        
        // Now stack the videos vertically
        updateStatus('Stacking videos vertically...');
        await ffmpeg.run(
            '-i', topVideoName,
            '-i', bottomVideoName,
            '-filter_complex', 'vstack=inputs=2[v]',
            '-map', '[v]',
            '-map', '0:a?',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-preset', 'ultrafast',
            outputName
        );
        
        updateProgress(85);
        updateStatus('Processing complete, preparing download...');
        
        // Read the output file
        const data = ffmpeg.FS('readFile', outputName);
        
        // Create URL for the output video
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        updateProgress(100);
        
        return url;
    } catch (error) {
        console.error('Detailed merge error:', error);
        throw error;
    }
}

// Update progress bar
function updateProgress(percent) {
    progressBarFill.style.width = `${percent}%`;
}
