const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');

async function createImageWithText(text) {
    try {
        // Create a canvas to draw the background image and text
        const canvas = createCanvas(600, 120);
        const ctx = canvas.getContext('2d');

        // Configure text properties
        ctx.font = '60px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate text position
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;

        // Draw the text
        ctx.fillText(text, textX, textY);

        // Convert canvas to Buffer
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Failed to create the image:', error);
    }
}

module.exports = {
    createImageWithText
  };