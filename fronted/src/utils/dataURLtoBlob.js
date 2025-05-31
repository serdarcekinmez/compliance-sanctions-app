




// utils/dataURLtoBlob.js
// Utility function to convert Data URL to Blob

/**
 * Converts a data URL string to a Blob object
 * Useful for handling screenshots and image data
 * 
 * @param {string} dataURL - The data URL to convert
 * @returns {Blob} - The resulting Blob object
 */
const dataURLtoBlob = (dataURL) => {
    // Split the data URL at the comma to get the base64 data
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const byteString = atob(parts[1]);
    
    // Convert base64 to raw binary data held in a string
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    // Create a blob with the binary data
    return new Blob([ab], { type: contentType });
  };
  
  export default dataURLtoBlob;