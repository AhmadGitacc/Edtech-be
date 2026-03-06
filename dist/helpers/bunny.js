"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideoToBunny = void 0;
const axios_1 = __importDefault(require("axios"));
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
/**
 * Uploads a video to Bunny.net Stream.
 * @param fileBuffer The binary data of the video file.
 * @param fileName The name of the file.
 * @returns The videoId if successful.
 */
const uploadVideoToBunny = async (fileBuffer, fileName) => {
    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
        throw new Error('Bunny.net API key or Library ID is missing in environment variables.');
    }
    try {
        // Step 1: Create the video object
        const createResponse = await axios_1.default.post(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, { title: fileName }, {
            headers: {
                AccessKey: BUNNY_API_KEY,
                'Content-Type': 'application/json',
                accept: 'application/json'
            }
        });
        const videoId = createResponse.data.guid;
        // Step 2: Upload the binary file
        await axios_1.default.put(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, fileBuffer, {
            headers: {
                AccessKey: BUNNY_API_KEY,
                'Content-Type': 'application/octet-stream',
                accept: 'application/json'
            }
        });
        return videoId;
    }
    catch (err) {
        console.error('Bunny.net Upload Error:', err.response?.data || err.message);
        throw new Error('Failed to upload video to Bunny.net');
    }
};
exports.uploadVideoToBunny = uploadVideoToBunny;
//# sourceMappingURL=bunny.js.map