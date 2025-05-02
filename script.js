// Global variables
let topVideo = null;
let bottomVideo = null;
let topVideoElement = null;
let bottomVideoElement = null;
let recordedChunks = [];
let mediaRecorder = null;
let canvasStream = null;

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
const canvas = document.getElementById('processing-canvas');
const ctx = canvas.getContext('2d');

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Video Merger Tool loaded');
    updateStatus('Welcome to Video Merger Tool');
    
    // Disable merge button until videos are uploaded
    mergeBtn.disabled = true;
    
    // Add event listeners
    topVideoInput.addEventListener('change', (e) => handleVideoUpload(e, 'top'));
    bottomVideoInput.addEventListener('change', (e) => handleVideoUpload(e, 'bottom'));
    mergeBtn.addEventListener('click', startMergeProcess);
    
    // Check for MediaRecorder support
    if (!window.MediaRecorder) {
        updateStatus('Your browser does not support the MediaRecorder API. Please try Chrome or Firefox.');
    }
});

// Function to handle video upload
function handleVideoUpload(event, position) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file is a video
    if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
    }
    
    console.log(`Uploaded ${position} video:`, file.name, file.type);
    
    // Create object URL for the video preview
    const videoBlob = URL.createObjectURL(file);
    const videoElement = position === 'top' ? topVideoPreview : bottomVideoPreview;
    videoElement.src = videoBlob;
    
    // Store video file and element reference
    if (position === 'top') {
        topVideo = videoBlob;
        topVideoElement = videoElement;
    } else {
        bottomVideo = videoBlob;
        bottomVideoElement = videoElement;
    }
    
    // When video metadata is loaded, check if we can enable the merge button
    videoElement.onloadedmetadata = checkEnableMergeButton;
}

// Check if both videos are uploaded and enable merge button if they are
function checkEnableMergeButton() {
    if (topVideo && bottomVideo && topVideoElement && bottomVideoElement) {
        if (topVideoElement.readyState >= 2 && bottomVideoElement.readyState >= 2) {
            // Get video dimensions
            const topWidth = topVideoElement.videoWidth;
            const topHeight = topVideoElement.videoHeight;
            const bottomWidth = bottomVideoElement.videoWidth;
            const bottomHeight = bottomVideoElement.videoHeight;
            
            console.log(`Top video dimensions: ${topWidth}x${topHeight}`);
            console.log(`Bottom video dimensions: ${bottomWidth}x${bottomHeight}`);
            
            // Check if videos have the same width
            if (topWidth !== bottomWidth) {
                updateStatus(`Warning: Videos have different widths (${topWidth} vs ${bottomWidth}). Results may be distorted.`);
            }
            
            // Enable merge button
            mergeBtn.disabled = false;
        }
    }
}

// Start the merge process
function startMergeProcess() {
    if (!topVideo || !bottomVideo) {
        alert('Please upload both videos first!');
        return;
    }
    
    // Disable UI while processing
    mergeBtn.disabled = true;
    progressContainer.style.display = 'block';
    updateStatus('Starting merge process...');
    
    // Prepare videos for merging
    prepareForMerging();
}

// Prepare videos for merging
function prepareForMerging() {
    // Reset recorded chunks
    recordedChunks = [];
    
    // Reset both videos to the beginning
    topVideoElement.currentTime = 0;
    bottomVideoElement.currentTime = 0;
    
    updateProgress(10);
    updateStatus('Preparing canvas...');
    
    // Get dimensions from the first video
    const videoWidth = topVideoElement.videoWidth;
    const videoHeight = topVideoElement.videoHeight;
    
    // Set canvas size to hold both videos stacked vertically
    canvas.width = videoWidth;
    canvas.height = videoHeight * 2; // Double height for stacked videos
    
    // Ensure videos are at the beginning and paused
    topVideoElement.pause();
    bottomVideoElement.pause();
    
    // Setup MediaRecorder with the canvas stream
    setupMediaRecorder();
}

// Setup the MediaRecorder to capture the canvas
function setupMediaRecorder() {
    updateProgress(20);
    updateStatus('Setting up recorder...');
    
    try {
        // Get the canvas stream
        canvasStream = canvas.captureStream(30); // 30 FPS
        
        // Create MediaRecorder with browser-compatible options
        const options = { mimeType: getSupportedMimeType() };
        mediaRecorder = new MediaRecorder(canvasStream, options);
        
        // Event handlers for MediaRecorder
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleRecordingStop;
        
        // Start the merging process
        startMerging();
    } catch (error) {
        console.error('MediaRecorder setup error:', error);
        updateStatus('Error: Your browser does not support the required video recording features.');
        mergeBtn.disabled = false;
    }
}

// Get a supported MIME type for the MediaRecorder
function getSupportedMimeType() {
    // Prioritize MP4 if available
    const types = [
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
    ];
    
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            console.log('Using MIME type:', type);
            return type;
        }
    }
    
    return 'video/webm'; // Default fallback
}

// Handle data available from MediaRecorder
function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

// Handle recording stop event
function handleRecordingStop() {
    updateProgress(90);
    updateStatus('Finalizing video...');
    
    // Create blob from recorded chunks
    const mimeType = getSupportedMimeType();
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Set appropriate file extension based on MIME type
    let fileExtension = 'mp4'; // Default to mp4 as requested
    if (mimeType.includes('webm')) {
        fileExtension = 'webm';
        console.log('Using WebM format as MP4 is not supported in this browser');
    }
    
    // Display the result
    resultContainer.style.display = 'block';
    mergedVideoPreview.src = url;
    downloadLink.href = url;
    downloadLink.download = `merged-video.${fileExtension}`;
    
    // Clean up
    if (canvasStream) {
        canvasStream.getTracks().forEach(track => track.stop());
    }
    
    updateProgress(100);
    updateStatus(`Merge complete! You can now download as .${fileExtension}`);
    mergeBtn.disabled = false;
}

// Start the merging process
function startMerging() {
    updateProgress(30);
    updateStatus('Starting video merge...');
    
    // Get the duration of the shorter video
    const duration = Math.min(topVideoElement.duration, bottomVideoElement.duration);
    
    // Start recording
    mediaRecorder.start(1000); // Capture in 1-second chunks
    
    // Start playing the videos
    topVideoElement.play();
    bottomVideoElement.play();
    
    // Start drawing frames to the canvas
    drawFrames();
    
    // Set a timeout to stop recording based on video duration
    setTimeout(() => {
        stopMerging();
    }, duration * 1000 + 500); // Add a small buffer
}

// Draw frames from both videos to the canvas
function drawFrames() {
    // Draw frames only if videos are playing and recorder is active
    if (topVideoElement.paused || bottomVideoElement.paused || !mediaRecorder || mediaRecorder.state === 'inactive') {
        return;
    }
    
    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the top video at the top of the canvas
    ctx.drawImage(topVideoElement, 0, 0, canvas.width, canvas.height / 2);
    
    // Draw the bottom video at the bottom half of the canvas
    ctx.drawImage(bottomVideoElement, 0, canvas.height / 2, canvas.width, canvas.height / 2);
    
    // Update progress based on video current time
    const progress = (topVideoElement.currentTime / topVideoElement.duration) * 60;
    updateProgress(30 + progress);
    
    // Schedule the next frame
    requestAnimationFrame(drawFrames);
}

// Stop the merging process
function stopMerging() {
    // Stop the videos
    topVideoElement.pause();
    bottomVideoElement.pause();
    
    // Stop the recorder if it's active
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Helper function to update status message
function updateStatus(message) {
    console.log(message);
    progressText.textContent = message;
}

// Helper function to update progress bar
function updateProgress(percent) {
    progressBarFill.style.width = `${percent}%`;
}
