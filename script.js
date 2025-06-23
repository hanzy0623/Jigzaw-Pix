// --- 1. GET ALL NECESSARY DOM ELEMENTS ---
const uploadSection = document.getElementById('uploadSection');
const puzzleSection = document.getElementById('puzzleSection');
const editSection = document.getElementById('editSection');

const imageUpload = document.getElementById('imageUpload');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const previewImage = document.getElementById('previewImage');
const createPuzzleBtn = document.getElementById('createPuzzleBtn');
const backToUploadBtn = document.getElementById('backToUploadBtn');
const startOverBtn = document.getElementById('startOverBtn');

const difficultySelect = document.getElementById('difficulty');
const shufflePuzzleBtn = document.getElementById('shufflePuzzleBtn');
const puzzleArea = document.getElementById('puzzleArea');
const puzzleMessage = document.getElementById('puzzleMessage');

const outputCanvas = document.getElementById('outputCanvas');
const outputCtx = outputCanvas.getContext('2d');

const frameOptionButtons = document.querySelectorAll('.frame-option');
const frameColorInput = document.getElementById('frameColor');
const frameThicknessInput = document.getElementById('frameThickness');
const frameCustomizationDiv = document.querySelector('.frame-customization'); // For showing/hiding

const textInput = document.getElementById('textInput');
const textColorInput = document.getElementById('textColor');
const fontSizeInput = document.getElementById('fontSize');
const addTextBtn = document.getElementById('addTextBtn');

const downloadImageBtn = document.getElementById('downloadImageBtn');
const shareImageBtn = document.getElementById('shareImageBtn');

// --- 2. GLOBAL VARIABLES FOR GAME STATE ---
let uploadedImage = new Image(); // The original uploaded image
let puzzleSize = 600; // Fixed size for the puzzle area and puzzle pieces
let piecesPerSide = 4; // Default difficulty (4x4 = 16 pieces)
let puzzlePieces = []; // Array to store all puzzle piece objects
let snappedPiecesCount = 0; // Counter for solved pieces
let activePiece = null; // The piece currently being dragged
let offsetX, offsetY; // Mouse offset from piece top-left
let currentActiveFrame = 'none'; // Stores the currently selected frame style
let textsOnCanvas = []; // Stores text objects {text, x, y, color, size, isDragging}

// Constants for snapping tolerance (how close pieces need to be to snap)
const SNAP_TOLERANCE = 20;

// --- 3. UI STATE MANAGEMENT (SHOW/HIDE SECTIONS) ---
function showSection(sectionElement) {
    [uploadSection, puzzleSection, editSection].forEach(section => {
        section.classList.add('hidden');
    });
    sectionElement.classList.remove('hidden');
}

// Initial state: show upload section
showSection(uploadSection);

// --- 4. IMAGE UPLOAD HANDLING ---
imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();

        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.classList.remove('hidden');
            createPuzzleBtn.classList.remove('hidden');

            // Set the source for the global uploadedImage object
            uploadedImage.onload = () => {
                // Image is fully loaded, ready for puzzle generation
                console.log("Uploaded image loaded successfully.");
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = 'No file chosen';
        previewImage.classList.add('hidden');
        previewImage.src = '';
        createPuzzleBtn.classList.add('hidden');
        uploadedImage = new Image(); // Reset to empty Image object
    }
});

// --- 5. PUZZLE GENERATION ---
createPuzzleBtn.addEventListener('click', () => {
    if (uploadedImage && uploadedImage.src) {
        piecesPerSide = parseInt(difficultySelect.value); // Get selected difficulty
        showSection(puzzleSection);
        generateAndShufflePuzzle(uploadedImage, piecesPerSide);
    } else {
        alert("Please upload an image first!");
    }
});

shufflePuzzleBtn.addEventListener('click', () => {
    if (uploadedImage && uploadedImage.src) {
        piecesPerSide = parseInt(difficultySelect.value);
        generateAndShufflePuzzle(uploadedImage, piecesPerSide);
    }
});

backToUploadBtn.addEventListener('click', () => {
    showSection(uploadSection);
    // Clear puzzle area for next time
    puzzleArea.innerHTML = '';
    snappedPiecesCount = 0;
    puzzlePieces = [];
    puzzleMessage.classList.add('hidden');
    // Also reset upload preview if needed
    fileNameDisplay.textContent = 'No file chosen';
    previewImage.classList.add('hidden');
    createPuzzleBtn.classList.add('hidden');
});

startOverBtn.addEventListener('click', () => {
    // Reset editing section elements
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    currentActiveFrame = 'none';
    textsOnCanvas = [];
    textInput.value = '';
    textColorInput.value = '#000000';
    fontSizeInput.value = '40';
    frameOptionButtons.forEach(btn => btn.classList.remove('selected'));
    document.querySelector('.frame-option[data-frame="none"]').classList.add('selected');
    frameCustomizationDiv.classList.add('hidden'); // Hide frame customization
    frameColorInput.value = '#FFD700'; // Reset frame color
    frameThicknessInput.value = '15'; // Reset frame thickness

    showSection(uploadSection);
    // Clear puzzle area
    puzzleArea.innerHTML = '';
    snappedPiecesCount = 0;
    puzzlePieces = [];
    puzzleMessage.classList.add('hidden');
    // Reset upload preview
    fileNameDisplay.textContent = 'No file chosen';
    previewImage.classList.add('hidden');
    createPuzzleBtn.classList.add('hidden');
    uploadedImage = new Image(); // Reset to empty Image object
});


function generateAndShufflePuzzle(image, piecesPerSide) {
    puzzleArea.innerHTML = ''; // Clear previous pieces
    puzzlePieces = []; // Reset pieces array
    snappedPiecesCount = 0;
    puzzleMessage.classList.add('hidden');

    const pieceWidth = puzzleSize / piecesPerSide;
    const pieceHeight = puzzleSize / piecesPerSide;

    // Adjust canvas dimensions to maintain aspect ratio of the image while fitting puzzleArea
    let imgRatio = image.width / image.height;
    let canvasWidth = puzzleSize;
    let canvasHeight = puzzleSize;

    if (imgRatio > 1) { // Image is wider than tall
        canvasHeight = puzzleSize / imgRatio;
    } else if (imgRatio < 1) { // Image is taller than wide
        canvasWidth = puzzleSize * imgRatio;
    }

    // Set puzzle area size to match scaled canvas, but maintain max 600px
    puzzleArea.style.width = `${Math.min(canvasWidth, 600)}px`;
    puzzleArea.style.height = `${Math.min(canvasHeight, 600)}px`;
    puzzleArea.style.border = 'none'; // Remove dashed border after image is loaded
    puzzleArea.style.backgroundImage = 'none'; // Clear any background ghost image

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;

    // Draw the entire image onto a temporary canvas, scaled to fit puzzleArea dimensions
    tempCtx.drawImage(image, 0, 0, image.width, image.height, 0, 0, tempCanvas.width, tempCanvas.height);

    for (let row = 0; row < piecesPerSide; row++) {
        for (let col = 0; col < piecesPerSide; col++) {
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;
            const pieceCtx = pieceCanvas.getContext('2d');

            // Draw the specific segment of the image onto the piece canvas
            pieceCtx.drawImage(
                tempCanvas, // Source canvas
                col * pieceWidth, // Source X
                row * pieceHeight, // Source Y
                pieceWidth, // Source Width
                pieceHeight, // Source Height
                0, 0, // Destination X, Y
                pieceWidth, // Destination Width
                pieceHeight // Destination Height
            );

            const pieceElement = document.createElement('div');
            pieceElement.classList.add('puzzle-piece');
            pieceElement.style.width = `${pieceWidth}px`;
            pieceElement.style.height = `${pieceHeight}px`;
            pieceElement.style.backgroundImage = `url(${pieceCanvas.toDataURL()})`; // Use data URL as background
            pieceElement.style.backgroundSize = 'cover'; // Ensure image covers piece area

            // Store the correct target position (for snapping)
            pieceElement.dataset.correctX = col * pieceWidth;
            pieceElement.dataset.correctY = row * pieceHeight;
            pieceElement.dataset.row = row; // Store row and col for easy debugging/reference
            pieceElement.dataset.col = col;

            // Random initial position within the puzzle area
            let randomX = Math.random() * (puzzleArea.offsetWidth - pieceWidth);
            let randomY = Math.random() * (puzzleArea.offsetHeight - pieceHeight);

            pieceElement.style.left = `${randomX}px`;
            pieceElement.style.top = `${randomY}px`;

            // Add drag and drop listeners
            addDragListeners(pieceElement);

            puzzleArea.appendChild(pieceElement);
            puzzlePieces.push(pieceElement);
        }
    }
}

// --- 6. DRAG AND DROP LOGIC ---
function addDragListeners(piece) {
    let isDragging = false;

    piece.addEventListener('mousedown', (e) => {
        if (piece.classList.contains('snapped')) return; // Don't drag snapped pieces

        isDragging = true;
        activePiece = piece;
        activePiece.classList.add('dragging');

        // Calculate offset of mouse from piece's top-left corner
        offsetX = e.clientX - piece.getBoundingClientRect().left;
        offsetY = e.clientY - piece.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !activePiece) return;

        // Calculate new position relative to the puzzle area
        const puzzleRect = puzzleArea.getBoundingClientRect();
        let newX = e.clientX - offsetX - puzzleRect.left;
        let newY = e.clientY - offsetY - puzzleRect.top;

        // Clamp positions to keep pieces within puzzle area boundaries
        newX = Math.max(0, Math.min(newX, puzzleArea.offsetWidth - activePiece.offsetWidth));
        newY = Math.max(0, Math.min(newY, puzzleArea.offsetHeight - activePiece.offsetHeight));

        activePiece.style.left = `${newX}px`;
        activePiece.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging && activePiece) {
            isDragging = false;
            activePiece.classList.remove('dragging');
            checkSnap(activePiece);
            activePiece = null;
        }
    });

    // Touch events for mobile
    piece.addEventListener('touchstart', (e) => {
        if (piece.classList.contains('snapped')) return;
        e.preventDefault(); // Prevent scrolling
        isDragging = true;
        activePiece = piece;
        activePiece.classList.add('dragging');
        const touch = e.touches[0];
        offsetX = touch.clientX - piece.getBoundingClientRect().left;
        offsetY = touch.clientY - piece.getBoundingClientRect().top;
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || !activePiece) return;
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const puzzleRect = puzzleArea.getBoundingClientRect();
        let newX = touch.clientX - offsetX - puzzleRect.left;
        let newY = touch.clientY - offsetY - puzzleRect.top;

        newX = Math.max(0, Math.min(newX, puzzleArea.offsetWidth - activePiece.offsetWidth));
        newY = Math.max(0, Math.min(newY, puzzleArea.offsetHeight - activePiece.offsetHeight));

        activePiece.style.left = `${newX}px`;
        activePiece.style.top = `${newY}px`;
    });

    document.addEventListener('touchend', () => {
        if (isDragging && activePiece) {
            isDragging = false;
            activePiece.classList.remove('dragging');
            checkSnap(activePiece);
            activePiece = null;
        }
    });
}

// --- 7. SNAPPING AND COMPLETION CHECK ---
function checkSnap(piece) {
    const correctX = parseFloat(piece.dataset.correctX);
    const correctY = parseFloat(piece.dataset.correctY);

    const currentX = piece.offsetLeft;
    const currentY = piece.offsetTop;

    // Check if the current position is within the snap tolerance of the correct position
    if (Math.abs(currentX - correctX) < SNAP_TOLERANCE &&
        Math.abs(currentY - correctY) < SNAP_TOLERANCE) {

        // Snap the piece to the exact correct position
        piece.style.left = `${correctX}px`;
        piece.style.top = `${correctY}px`;
        piece.classList.add('snapped'); // Mark as snapped
        snappedPiecesCount++;

        // If all pieces are snapped, puzzle is complete
        if (snappedPiecesCount === puzzlePieces.length) {
            puzzleMessage.textContent = "🥳 Puzzle Solved! Great Job! 🥳";
            puzzleMessage.classList.remove('hidden');
            setTimeout(() => {
                showSection(editSection);
                drawSolvedPuzzleOnCanvas(); // Draw for editing
            }, 1500); // Give a little time for message to be seen
        }
    }
}

// --- 8. DRAWING SOLVED PUZZLE ON EDITING CANVAS ---
function drawSolvedPuzzleOnCanvas() {
    // Calculate output canvas dimensions based on image aspect ratio
    let imgRatio = uploadedImage.width / uploadedImage.height;
    let canvasWidth = 600; // Max width
    let canvasHeight = 600; // Max height

    if (imgRatio > 1) { // Image is wider than tall
        canvasHeight = 600 / imgRatio;
    } else if (imgRatio < 1) { // Image is taller than wide
        canvasWidth = 600 * imgRatio;
    }

    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;

    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height); // Clear canvas
    outputCtx.drawImage(uploadedImage, 0, 0, uploadedImage.width, uploadedImage.height, 0, 0, outputCanvas.width, outputCanvas.height);
    puzzleSolvedImage = outputCanvas.toDataURL(); // Save a base version for redrawing edits

    // Apply current frame and texts
    applyCurrentEdits();
}

// --- 9. FRAME SELECTION AND CUSTOMIZATION ---
frameOptionButtons.forEach(button => {
    button.addEventListener('click', () => {
        frameOptionButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        currentActiveFrame = button.dataset.frame;

        // Show/hide frame customization based on selection
        if (currentActiveFrame === 'none') {
            frameCustomizationDiv.classList.add('hidden');
        } else {
            frameCustomizationDiv.classList.remove('hidden');
        }
        applyCurrentEdits(); // Redraw canvas with new frame
    });
});

frameColorInput.addEventListener('input', applyCurrentEdits);
frameThicknessInput.addEventListener('input', applyCurrentEdits);

function applyCurrentEdits() {
    // Redraw the base image
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    const baseImage = new Image();
    baseImage.onload = () => {
        outputCtx.drawImage(baseImage, 0, 0, outputCanvas.width, outputCanvas.height);
        drawFrame(); // Draw frame on top
        drawTexts(); // Draw texts on top of frame
    };
    baseImage.src = uploadedImage.src; // Use the original uploaded image as the base
}

function drawFrame() {
    const color = frameColorInput.value;
    const thickness = parseInt(frameThicknessInput.value);
    const w = outputCanvas.width;
    const h = outputCanvas.height;

    outputCtx.strokeStyle = color;
    outputCtx.lineWidth = thickness;

    switch (currentActiveFrame) {
        case 'none':
            // No frame drawn
            break;
        case 'simple':
            outputCtx.strokeRect(thickness / 2, thickness / 2, w - thickness, h - thickness);
            break;
        case 'dotted':
            outputCtx.setLineDash([thickness * 2, thickness * 2]); // Dashes and gaps
            outputCtx.strokeRect(thickness / 2, thickness / 2, w - thickness, h - thickness);
            outputCtx.setLineDash([]); // Reset line dash
            break;
        case 'fancy':
            // Draw four corners
            outputCtx.save(); // Save context state
            outputCtx.strokeStyle = color;
            outputCtx.lineWidth = thickness * 0.8; // Slightly thinner
            outputCtx.beginPath();

            const cornerSize = Math.min(w, h) / 6; // Size of the corner embellishment

            // Top-left
            outputCtx.moveTo(thickness, thickness);
            outputCtx.lineTo(thickness, cornerSize);
            outputCtx.moveTo(thickness, thickness);
            outputCtx.lineTo(cornerSize, thickness);

            // Top-right
            outputCtx.moveTo(w - thickness, thickness);
            outputCtx.lineTo(w - thickness, cornerSize);
            outputCtx.moveTo(w - thickness, thickness);
            outputCtx.lineTo(w - cornerSize, thickness);

            // Bottom-right
            outputCtx.moveTo(w - thickness, h - thickness);
            outputCtx.lineTo(w - thickness, h - cornerSize);
            outputCtx.moveTo(w - thickness, h - thickness);
            outputCtx.lineTo(w - cornerSize, h - thickness);

            // Bottom-left
            outputCtx.moveTo(thickness, h - thickness);
            outputCtx.lineTo(thickness, h - cornerSize);
            outputCtx.moveTo(thickness, h - thickness);
            outputCtx.lineTo(cornerSize, h - thickness);

            outputCtx.stroke();
            outputCtx.restore(); // Restore context state
            break;
    }
}

// --- 10. TEXT ADDITION AND DRAGGING ---
addTextBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
        // Add new text object (initially centered)
        textsOnCanvas.push({
            text: text,
            x: outputCanvas.width / 2,
            y: outputCanvas.height / 2,
            color: textColorInput.value,
            size: parseInt(fontSizeInput.value),
            isDragging: false // Flag for dragging text
        });
        textInput.value = ''; // Clear input
        applyCurrentEdits(); // Redraw with new text
    } else {
        alert("Please enter some text!");
    }
});

function drawTexts() {
    textsOnCanvas.forEach(textObj => {
        outputCtx.fillStyle = textObj.color;
        outputCtx.font = `${textObj.size}px 'Quicksand'`;
        outputCtx.textAlign = 'center';
        outputCtx.textBaseline = 'middle'; // Center text vertically
        outputCtx.fillText(textObj.text, textObj.x, textObj.y);
    });
}

// Text dragging logic (similar to puzzle pieces but on canvas directly)
let activeText = null;
let textOffsetX, textOffsetY;

outputCanvas.addEventListener('mousedown', (e) => {
    // Check if clicking on existing text
    const rect = outputCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    textsOnCanvas.forEach(textObj => {
        // A rough hit test for text (more accurate if we measure text width)
        outputCtx.font = `${textObj.size}px 'Quicksand'`;
        const textMetrics = outputCtx.measureText(textObj.text);
        const textWidth = textMetrics.width;
        const textHeight = textObj.size; // Approximation for height

        const textLeft = textObj.x - textWidth / 2;
        const textRight = textObj.x + textWidth / 2;
        const textTop = textObj.y - textHeight / 2;
        const textBottom = textObj.y + textHeight / 2;

        if (mouseX >= textLeft && mouseX <= textRight &&
            mouseY >= textTop && mouseY <= textBottom) {
            activeText = textObj;
            activeText.isDragging = true;
            textOffsetX = mouseX - textObj.x;
            textOffsetY = mouseY - textObj.y;
        }
    });
});

outputCanvas.addEventListener('mousemove', (e) => {
    if (activeText && activeText.isDragging) {
        const rect = outputCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        activeText.x = mouseX - textOffsetX;
        activeText.y = mouseY - textOffsetY;
        applyCurrentEdits(); // Redraw canvas as text moves
    }
});

outputCanvas.addEventListener('mouseup', () => {
    if (activeText) {
        activeText.isDragging = false;
        activeText = null;
    }
});

// Same for touch events
outputCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    const rect = outputCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    textsOnCanvas.forEach(textObj => {
        outputCtx.font = `${textObj.size}px 'Quicksand'`;
        const textMetrics = outputCtx.measureText(textObj.text);
        const textWidth = textMetrics.width;
        const textHeight = textObj.size;

        const textLeft = textObj.x - textWidth / 2;
        const textRight = textObj.x + textWidth / 2;
        const textTop = textObj.y - textHeight / 2;
        const textBottom = textObj.y + textHeight / 2;

        if (touchX >= textLeft && touchX <= textRight &&
            touchY >= textTop && touchY <= textBottom) {
            activeText = textObj;
            activeText.isDragging = true;
            textOffsetX = touchX - textObj.x;
            textOffsetY = touchY - textObj.y;
        }
    });
});

outputCanvas.addEventListener('touchmove', (e) => {
    if (activeText && activeText.isDragging) {
        e.preventDefault();
        const rect = outputCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        activeText.x = touchX - textOffsetX;
        activeText.y = touchY - textOffsetY;
        applyCurrentEdits();
    }
});

outputCanvas.addEventListener('touchend', () => {
    if (activeText) {
        activeText.isDragging = false;
        activeText = null;
    }
});


// --- 11. DOWNLOAD FUNCTIONALITY ---
downloadImageBtn.addEventListener('click', () => {
    if (outputCanvas.getContext('2d').getImageData(0, 0, outputCanvas.width, outputCanvas.height).data.every(val => val === 0)) {
        alert("Nothing to download yet! Solve a puzzle first.");
        return;
    }
    const dataURL = outputCanvas.toDataURL('image/png'); // Get image as data URL
    const a = document.createElement('a'); // Create a temporary link element
    a.href = dataURL;
    a.download = 'whimsical_puzzle_masterpiece.png'; // Suggested file name
    document.body.appendChild(a);
    a.click(); // Programmatically click the link to trigger download
    document.body.removeChild(a); // Remove the link
});

// --- 12. SHARE FUNCTIONALITY (Web Share API) ---
shareImageBtn.addEventListener('click', async () => {
    if (outputCanvas.getContext('2d').getImageData(0, 0, outputCanvas.width, outputCanvas.height).data.every(val => val === 0)) {
        alert("Nothing to share yet! Solve a puzzle first.");
        return;
    }

    // Convert canvas content to a Blob (file-like object)
    outputCanvas.toBlob(async (blob) => {
        if (blob) {
            const files = [new File([blob], 'whimsical_puzzle.png', { type: 'image/png' })];

            // Check if Web Share API is available and can share files
            if (navigator.canShare && navigator.canShare({ files })) {
                try {
                    await navigator.share({
                        files: files,
                        title: 'My Whimsical Puzzle Masterpiece!',
                        text: 'Check out the puzzle I created and customized!',
                        url: window.location.href // Link back to your app
                    });
                    console.log('Shared successfully');
                } catch (error) {
                    console.error('Error sharing:', error);
                    alert('Could not share directly. You can download and share manually!');
                }
            } else {
                // Fallback for browsers/platforms that don't support Web Share API or file sharing
                alert('Your browser/device does not support direct sharing with image. Please download your masterpiece and share it manually!');
                // Optionally, trigger download here:
                downloadImageBtn.click();
            }
        } else {
            alert('Failed to prepare image for sharing.');
        }
    }, 'image/png');
});

// Initial selection for frame to ensure "None" is default and selected class is applied
document.querySelector('.frame-option[data-frame="none"]').classList.add('selected');
