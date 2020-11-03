var doc, frame, timeline,
	docBKColor = '#999999',
	startBtnColor = '#99CCFF',
	startBtnTextColor = '#0000FF',
	minPieceWidth = 20, minPieceHeight = 20,
	rows, cols, bitmapBounds, pieceWidth, pieceHeight, circleRadius,
	libraryBitmapItem;
	
//fl.outputPanel.clear();

function processImageForPuzzle(bitmapInstance) {

	doc.backgroundColor = docBKColor;
	
	pieceWidth = bitmapInstance.width / rows;
	pieceHeight = bitmapInstance.height / cols;

	libraryBitmapItem = bitmapInstance.libraryItem;
	
	doc.selectNone();
	
	bitmapInstance.selected = true;

	bitmapBounds = {
		x: bitmapInstance.x, y: bitmapInstance.y,
		width: bitmapInstance.width,
		height: bitmapInstance.height
	}
	
	try {
		doc.breakApart();
	} catch(e) {
		fl.trace(e.message);
	}
	
	var oldObjectDrawingMode = fl.objectDrawingMode;	
	if (pieceWidth < minPieceWidth || pieceHeight < minPieceHeight) {
		throw('Minimum piece width should be ' + minPieceWidth + ' and height should be ' + minPieceHeight);
	}

	fl.objectDrawingMode = false;
	
	var maxSize = Math.min(pieceHeight, pieceWidth);
	circleRadius = (maxSize * 0.5) / 2;

	var stroke = doc.getCustomStroke('toolbar');
	stroke.thickness = 1;
	doc.setCustomStroke(stroke);

	// work-around for the problem that the first piece shapes are not merged properly
	createPiecesCols(bitmapBounds, pieceWidth, pieceHeight, rows, cols, circleRadius);
	createPiecesRows(bitmapBounds, pieceWidth, pieceHeight, rows, cols, circleRadius);
	createPiecesCols(bitmapBounds, pieceWidth, pieceHeight, rows, cols, circleRadius);
	createPiecesRows(bitmapBounds, pieceWidth, pieceHeight, rows, cols, circleRadius);
	//end workaround
	
	createPieceSymobls(rows, cols, pieceWidth, pieceHeight, bitmapBounds);
	removeNonSymbolsFromFrame(frame);
	createReferenceLayer();
	createGameEndSym();
	shufflePieces();
	addInitialPage();
	createScriptsLayer();
	fl.objectDrawingMode = oldObjectDrawingMode;
}

function createPiecesCols(bitmapBounds, pieceWidth, pieceHeight, rows, cols, circleRadius) {
	var currentX =  bitmapBounds.x + pieceWidth;
	for (var i = 0; i < cols-1; i++) {
		doc.addNewLine({x: currentX, y: -5},{x: currentX, y: doc.height+5}); 
		
		var left = currentX - circleRadius, right = left + (circleRadius * 2), 
			top = bitmapBounds.y + (pieceHeight / 2) - circleRadius, bottom = top + (circleRadius * 2);
		
		for (var j = 0; j < rows; j++) {
			fl.getDocumentDOM().addNewOval({left:left, top:top, right:right, bottom:bottom}, true);
			
			var clickX = (j == 0 || j % 2 == 0) ? left : right,
				clickY = top + circleRadius;
			deleteSelectionAt(clickX, clickY);
			
			clickX = left + circleRadius;
			deleteSelectionAt(clickX, clickY);
			
			top = ((j+1) * pieceHeight) + circleRadius + bitmapBounds.y;
			bottom = top + (circleRadius * 2);
		}
		
		currentX += pieceWidth;
	}
}

function createPiecesRows(bitmapBounds, pieceWidth, pieceHeight, rows, cols, circleRadius) {
	var currentY = bitmapBounds.y + pieceHeight;
	for (var i = 0; i < cols-1; i++) {
		doc.addNewLine({x: -5, y: currentY},{x: doc.width+5, y: currentY}); 
		
		var left = bitmapBounds.x + (pieceWidth / 2) - circleRadius, right = left + (circleRadius * 2),
			top = currentY - circleRadius, bottom = top + (circleRadius * 2);
		
		for (var j = 0; j < rows; j++) {
			fl.getDocumentDOM().addNewOval({left:left, top:top, right:right, bottom:bottom}, true);
			
			var clickY = (j == 0 || j % 2 == 0) ? top : bottom,
				clickX = left + circleRadius;
			deleteSelectionAt(clickX, clickY);
			
			clickY = top + circleRadius;
			deleteSelectionAt(clickX, clickY);

			
			left = ((j+1) * pieceWidth) + circleRadius + bitmapBounds.x;
			right = left + (circleRadius * 2);
		}
		
		currentY += pieceHeight;
	}
}

function createPieceSymobls(rows, cols, pieceWidth, pieceHeight) {
	doc.selectNone();
	
	for (var i = 0; i < rows; i++) {
		var y = (i * pieceHeight) + (pieceHeight / 2) + bitmapBounds. y ;
		for (var j = 0; j < cols; j++) {
			var x = (j * pieceWidth) + (pieceWidth / 2) + bitmapBounds.x;
			    index = (i * rows) + j + 1;
			
			doc.selectNone();
			doc.mouseClick({x: x, y: y}, true, false);
			if (i == 0 && j == 0) {
				// work-around for the problem that the first piece shapes are not merged properly
				doc.mouseClick({x: x + (pieceWidth/2) - (circleRadius / 2), y: y}, false, false);
				doc.mouseClick({x: x + (pieceWidth/2) + (circleRadius / 2), y: y}, false, false);
				doc.mouseClick({x: x, y: y + (pieceHeight/2) + (circleRadius / 2)}, false, false);
				doc.mouseClick({x: x, y: y + (pieceHeight/2) - (circleRadius / 2)}, false, false);
				//end workaround
			}
			var piece = doc.convertToSymbol('movie clip', 'p' + index, 'center');
			doc.selection[0].name = 'P' + index;
		}
	}
}

function removeNonSymbolsFromFrame(frame) {
	var elements = frame.elements;
	var symbolCount = 0;
	var unnamedElements = [];

	doc.selectNone();
	
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].elementType == 'shape') {
			unnamedElements.push(elements[i]);
		}
	}
	
	//delete unnamed elements
	while (unnamedElements.length > 0) {
		var element = unnamedElements.pop();
		element.selected = true;
	}	
	doc.deleteSelection();
}

function createReferenceLayer() {
	var timeline = doc.getTimeline(),
	 newLayer = null,
	 elements = null
	;

	timeline.layers[0].name = 'main';
	timeline.layers[0].locked = true;
	
	timeline.duplicateLayers();

	newLayer = timeline.layers[0].name == 'main' ? timeline.layers[1] : timeline.layers[0];
	newLayer.name = 'ref'
	elements = newLayer.frames[0].elements;
	
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].elementType == 'instance') {
			elements[i].name = elements[i].name.replace('P', 'R');
		}
	}	

	newLayer.visible = false;
	newLayer.locked = true;
}

function createGameEndSym() {
	var index = timeline.addNewLayer();
	var newLayer = timeline.layers[index];
	newLayer.name = 'gameover';

	var left = 172, top = 184, width = 440, height = 151;
	var fill = doc.getCustomFill('toolbar');
	fill.color = docBKColor;
	fill.style = "solid";
	doc.setCustomFill(fill);
	var rect = {left: left, right: (left+width), top: top, bottom: (top+height)};
	doc.addNewRectangle(rect,0);
	
	left = 197, top = 220, width = 402, height = 33;
	addText(197, 220, 402, 33, 'Congratulations on completing the puzzle!', 21, 'Arial', '#0000FF');
	addText(277, 265, 95, 33, 'You took', 21, 'Arial', '#0000FF');
	addText(372, 265, 150, 33, '', 21, 'Arial', '#0000FF');
	
	doc.selectNone();
	fl.selectTool('arrow');
	doc.mouseClick({x: 372+5, y:265+5}, true, false); //probably redundant, but to be safe
	doc.selection[0].name = 'time_txt';
	
	doc.setSelectionRect(rect); 
	doc.convertToSymbol('movie clip', 'end_sym', 'center');
	doc.selection[0].name = 'end_display';
	
	newLayer.visible = false;	
	newLayer.locked = true;
}

function createScriptsLayer() {
	var index = timeline.addNewLayer();
	var newLayer = timeline.layers[index];
	newLayer.name = 'scripts';
	var numPieces = rows * cols;

	var code = 'if (!window.hasOwnProperty(\'AnimatePuzzleManager\') || !window.AnimatePuzzleManager) {\n' +
				'    alert(\'Error displaying the puzzle. Could not find AnimatePuzzleManager.\' + \n' + 
			    '    \'\\n\\nDid you forget to globally include puzzle_manager.js in Actions panel?\');\n'+
				'    stage.removeAllChildren();\n' +
				'    return;\n' +
				'}\n\n' +	
			'var _this = this;\n' +
			'this.end_display.visible = false;\n' +

			'this.start_btn.addEventListener(\'click\', function(evt) {\n' +
			'    _this.start_btn.visible = false;\n' +
			'    _this.start_image.visible = false;\n' +
			'});\n' +
			'var puzzleManager = new AnimatePuzzleManager(' + 
				numPieces + ', ' + bitmapBounds.x + ', ' + bitmapBounds.y + ', ' + 
				bitmapBounds.width + ', ' + bitmapBounds.height + ', lib, function(evt) {\n' +
			'    var timeTaken = Math.round(evt.time_taken / 60);\n' + 
			'    _this.end_display.visible = true;\n' +
			'    _this.end_display.time_txt.text = timeTaken + \' minutes\';\n' +
			'});\n\nthis.stop();';

	newLayer.frames[0].actionScript = code;
	newLayer.locked = true;
	
}

function addText(left, top, width, height, text, size, face, color) {
	doc.addNewText({left: left, top: top, right: (left+width), bottom: (top+height)}, text);
	doc.mouseClick({x: left, y: top}, true, false);
	doc.setElementTextAttr('size', size);
	doc.setElementTextAttr('face', face);
	doc.setElementTextAttr('fillColor', color);
}

function getRandomNumber (min, max) {
	return Math.random() * (max - min) + min; 
}

function shufflePieces() {
	var mainLayerIndex = timeline.findLayerIndex('main');
	if (mainLayerIndex == undefined) {
		throw 'Could not find \'main\' layer';
	};
	
	timeline.setSelectedLayers(Number(mainLayerIndex));
	timeline.layers[mainLayerIndex].locked = false;

	var left = bitmapBounds.x, top = bitmapBounds.y, width = bitmapBounds.width, height = bitmapBounds.height;
	var rect = {left: left, right: (left+width), top: top, bottom: (top+height)};	

	var fill = doc.getCustomFill('toolbar');
	fill.style = 'noFill';
	doc.setCustomFill(fill);	
	
	var stroke = doc.getCustomStroke('toolbar');
	stroke.color = '#0000FF';
	stroke.thickness = 4;
	doc.setCustomStroke(stroke);
	
	doc.addNewRectangle(rect, 0);

	var minX = bitmapBounds.x + (pieceWidth / 2),
		maxX = bitmapBounds.x + bitmapBounds.width - (pieceWidth / 2),
		minY = bitmapBounds.y + (pieceHeight / 2),
		maxY = bitmapBounds.y + bitmapBounds.height - (pieceHeight / 2);

	var elements = timeline.layers[mainLayerIndex].frames[0].elements;
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].elementType == 'instance') {
			elements[i].x = getRandomNumber(minX, maxX);
			elements[i].y = getRandomNumber(minY, maxY);
		}
	}
	
	timeline.layers[mainLayerIndex].locked = true;
}

function addInitialPage() {
	var index = timeline.addNewLayer('startgame');
	var newLayer = timeline.layers[index];

	var fill = doc.getCustomFill('toolbar');
	fill.style = 'solid';
	fill.color = '#FFFFFF';
	doc.setCustomFill(fill);
	doc.addNewRectangle({left: 0, right: doc.width, top: 0, bottom: doc.height}, 0);
	
	doc.addItem({x: bitmapBounds.x, y: bitmapBounds.y}, libraryBitmapItem);
	var instance = newLayer.frames[0].elements[1];
	instance.x = bitmapBounds.x;
	instance.y = bitmapBounds.y;
	
	doc.selectNone();
	//setSelectedFrames fail randomly, especially here
	//timeline.setSelectedFrames(0,1, true);
	
	//so a work-around
	selectAllInFrame(newLayer.frames[0]);
	
	var sym = doc.convertToSymbol('movie clip', 'start_image', 'center');
	doc.selection[0].name = 'start_image';	
	newLayer.locked = true;
	
	// create button layer
	index = timeline.addNewLayer('start_btn');
	newLayer = timeline.layers[index];
	
	//add button rect
	fill.color = startBtnColor;
	doc.setCustomFill(fill);	
	var stroke = doc.getCustomStroke('toolbar');
	stroke.color = startBtnTextColor;
	stroke.thickness = 2;
	doc.setCustomStroke(stroke);
	var width = 122, height = 38,
		x = (doc.width / 2) - (width/2),
		y = doc.height - (height + 20);
	doc.addNewRectangle({left: x, right: x + width, top: y, bottom: y + height}, 0);	
	
	//add button text
	addText(x+3, y+7, width, height, 'Start Puzzle', 21, 'Arial', '#0000FF');	
	
	//timeline.setSelectedFrames(0,1);
	selectAllInFrame(newLayer.frames[0]);

	
	sym = doc.convertToSymbol('movie clip', 'start_btn', 'center');
	doc.selection[0].name = 'start_btn';	
	newLayer.locked = true;	
}

function deleteSelectionAt(x, y) {
	doc.selectNone();
	doc.mouseClick({x: x, y:y}, true, false);
	doc.deleteSelection();			
}


function selectAllInFrame(frame) {
	doc.selectNone();
	for (var i = 0; i < frame.elements.length; i++) {
		frame.elements[i].selected = true;
	}
}

function setCenterOutputInPublishSettings() {
	var publishProfile = doc.exportPublishProfileString();

	publishProfile = publishProfile.replace('<Property name="centerStage">false</Property>', '<Property name="centerStage">true</Property>');

	doc.importPublishProfileString(publishProfile);	
}

function importImage() {
	alert('In the next step, select the image to be imported for the puzzle.\n\nMake sure you resize the image to desired size before you import.');
	var file = fl.browseForFileURL("open", "Select an Image", "Image Files (*.png, *.jepg, *.jpg)", "png;jpeg;jpg");
	if (!file)
		return false;
	
	doc.importFile(file, true);
	return true;
}

function startWithNewDocument() {
	doc = fl.createDocument('htmlcanvas');
	if (!importImage())
		return false;
	timeline = doc.getTimeline();

	var item = doc.library.items[0]; 

	doc.addItem({x:0,y: 0}, item);	
	bitmapInstance = timeline.layers[0].frames[0].elements[0];

	if (doc.width < (bitmapInstance.width + 50))
		doc.width = bitmapInstance.width + 50;

	if (doc.height < (bitmapInstance.height + 50))
		doc.height = bitmapInstance.height + 50;	
	
	bitmapInstance.x = (doc.width - bitmapInstance.width) / 2;
	bitmapInstance.y = (doc.height - bitmapInstance.height) / 2;
	
	timeline.setSelectedFrames(0,1);
	frame = timeline.layers[0].frames[0];
	doc.selectNone();
	
	askNumRowsCols();
	processImageForPuzzle(bitmapInstance);
	
	return true;
}

function askNumRowsCols() {
	var numRows = prompt("Number of Rows into which pircture is to be devided");
	if (numRows != null) {
		rows = Number(numRows);
	} else {
		rows = 5;
	}
	var numCols = prompt("Number of Columns into which pircture is to be devided");
	if (numCols != null) {
		cols = Number(numCols);
	} else {
		cols = 5;
	}	
	
	return {rows: rows, cols: cols};
}

function startWithExistingDoc() {
	doc = fl.getDocumentDOM();
	if (doc.timelines[0].layerCount > 1) {
		alert('Document has more than one layer. Make sure you have only one layer with bitmap on the first frame of the layer');
		return;
	}
		
	doc = fl.getDocumentDOM();
	timeline = doc.getTimeline();
	frame = doc.timelines[0].layers[0].frames[0]
	doc.selectNone();
	
	for (var i = 0; i < frame.elements.length; i++) {
		var element = frame.elements[i];
		if (element.elementType == 'instance' && element.instanceType == 'bitmap') {
			askNumRowsCols();
			processImageForPuzzle(element);
			break;
		}
	}	
	
	return true;
}

function showGlobalScriptImportMessage() {
	var message = 'Your puzzle project is created. There is one last step remaining.\n' + 
				'Open Actions editor by pressing F9 (click on stage if stage does not have focus).\n' + 
				'Expand Global section. Click on Include\n' +
				'Click \'+\' icon to add new acript. Select \'Add a File...\' option.\n' +
				'Browse to the location of puzzle_manager.js and select that file.\n' + 
				'Close Actions panel and test your project';
	fl.trace(message);
	alert(message + '\n\nThis message is also printed in the Output window for your reference');
}

function start() {
	var optionSelected = prompt('Type 1 for new document and 2 for existing document or the puzzle');

	var ret = false;
	
	if (optionSelected === '1') {
		ret = startWithNewDocument();
	}
	else if (optionSelected == '2') {
		ret = startWithExistingDoc();
	}
	else if (optionSelected != null) {
		alert('Invalid option');
	}
	
	if (ret) {
		setCenterOutputInPublishSettings();
		showGlobalScriptImportMessage();
	}
}

start();
