# Video Merger Tool

A browser-based tool that allows you to merge two videos vertically - with the color video on top and the mask video on the bottom.

## Features

- Upload and merge two videos with ease
- Client-side processing (no server uploads needed)
- Support for both MP4 and MOV input formats
- Output as MP4 with combined height
- Responsive design that works on various screen sizes

## Demo

Access the live demo at [this Page](https://earnest-babka-a1157d.netlify.app/)

## How It Works

This tool uses FFmpeg.js to process and merge videos entirely in your browser. When you upload two videos, it:

1. Converts both videos to a compatible format
2. Stacks them vertically using the `vstack` filter
3. Provides a preview and download link for the merged video

## Use Cases

- Combining instructional content with demonstrations
- Creating before/after video comparisons
- Merging synchronized video footage from different angles
- Making split-screen presentations

## Requirements

- Both videos should have the same length, resolution, and aspect ratio
- Works best with modern browsers (Chrome, Firefox, Edge)
- Requires browser that supports WebAssembly

## Local Development

### Running the app locally

1. Clone this repository
2. Run a local web server (Python example below)

```bash
python3 -m http.server 8000
```

Or use the included server with CORS headers for better compatibility:

```bash
python3 server.py
```

3. Open your browser to http://localhost:8000 or http://localhost:9999 (if using server.py)

## Browser Compatibility

This tool requires a modern browser with WebAssembly support. For best results:

- Use Chrome, Firefox, or Edge
- Safari may have limited compatibility
- Enable JavaScript

## Limitations

- Processing large videos may be slow or cause browser memory issues
- Maximum video resolution depends on your device's capabilities
- Both videos must have the same width for optimal results

## License

MIT License

## Credits

- [FFmpeg.js](https://github.com/ffmpegwasm/ffmpeg.wasm) - WebAssembly port of FFmpeg
