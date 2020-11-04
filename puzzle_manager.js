//Author : Ram Kulkarni
//Repository : https://github.com/ramkulkarni1/Animate-Puzzle-Creator

(function() {

    function _puzzleManager(numPieces, xArg, yArg, widthArg, heightArg, lib, puzzleDoneCallback) {
        var self = this;
        var pieceCount = 0,
        pieces = [], refsPieces = [],
        imageRect = null,
        mismatchTolerance = 5,
        firstPieceMoved = false,
        startTime,
        selectionRect = null,
        resizeHandleRadius = 5,
        selectionHandleColor = 'red'
        ;
    
        function _init() {
            pieceCount = numPieces;
            imageRect = {x: xArg, y: yArg, width: widthArg, height: heightArg}
            window._lib = lib;

            hideReferencePieces();
            addEventListenerForPieces();

            stage.on('stagemousedown', function(evt) {
                if (selectionRect && !stage.getObjectUnderPoint(evt.stageX, evt.stageY)) {
                    selectionRect.parent.removeChild(selectionRect);
                    selectionRect = null;
                }
            });
            
            for (var i = 1; i <= pieceCount; i++) {
                pieces[i-1] = eval('exportRoot.P'+i);
                refsPieces[i-1] = eval('exportRoot.R'+i);
            }
            
            shufflePieces();
        }

        function hideReferencePieces() {
            for (var i = 1; i <= pieceCount; i++) {
                eval('exportRoot.R'+i+'.visible = false');
            }	
        }

        function addEventListenerForPieces() {
            for (var i = 1; i <= pieceCount; i++) {
                addEventListener(eval('exportRoot.P'+i));
            }	
        }   
        
        function addEventListener(piece) {
            piece.on('pressmove', function(evt) {
                removeSelectionRect();
                if (!piece.hasOwnProperty('moveStartedAt') || piece.moveStartedAt == null) {
                    piece.moveStartedAt = { x: piece.x, y: piece.y };
                    bringPieceToTop(piece);
                }
                piece.x = evt.stageX;
                piece.y = evt.stageY;
                evt.stopPropagation();
                evt.preventDefault();
            });
            
            piece.on('pressup', function(evt) {
                if (!firstPieceMoved) {
                    startTime = new Date().getTime();
                    firstPieceMoved = true;
                }

                if (pieceInImageArea(piece)) {
                    var refPiece = refPieceAt(piece);
                    if (refPiece != null) {
                        piece.x = refPiece.x;
                        piece.y = refPiece.y;
                        piece.rotation = 0;
                        removeSelectionRect();
                    }
                }
                if (checkAllPiecesMatched() && puzzleDoneCallback) {
                    var timeTaken = (new Date().getTime() - startTime) / 1000;
                    puzzleDoneCallback({time_taken: timeTaken});
                }
                piece.moveStartedAt = null;
            });

            piece.on('click', function(evt) {
                bringPieceToTop(piece);
                drawPieceRotationRect(piece);
                evt.stopPropagation();
                evt.preventDefault();
            });
        }

        function bringPieceToTop(piece) {
            if (piece.parent.children[piece.parent.children.length-2] !== piece) {
                piece.parent.swapChildren(piece, piece.parent.children[piece.parent.children.length-2]);
                stage.update();
            }
        }

        function refPieceAt(piece) {
            var refPiece = refsPieces[pieces.indexOf(piece)];
            if (Math.abs(piece.x - refPiece.x) <= mismatchTolerance && 
                Math.abs(piece.y - refPiece.y) <= mismatchTolerance) {
                    return refPiece;
                }
            return null;
        }    

        function pieceInImageArea(piece) {
            return rectsIntersect(getPieceBoundingRect(piece), imageRect);
        }    

        function getPieceBoundingRect(piece) {
            var rect = piece.nominalBounds;
            rect.x = piece.x - (rect.width / 2);
            rect.y = piece.y - (rect.height / 2);
            return rect;
        }

        function rectsIntersect(rect1, rect2) {
            var result =  pointInRect(rect1.x, rect1.y, rect2) ||
                pointInRect(rect1.x, rect1.y + rect1.height, rect2) ||
                pointInRect(rect1.x + rect1.width, rect1.y, rect2) ||
                pointInRect(rect1.x + rect1.width, 
                            rect1.y + rect1.height, rect2);
            return result;
        }    

        function pointInRect(x, y, rect) {
            return x >= rect.x && x <= rect.x + rect.width && 
                    y >= rect.y && y <= rect.y + rect.height;
        } 
        
        function checkAllPiecesMatched() {
            for (var i = 0; i < pieceCount; i++) {
                if (pieces[i].x != refsPieces[i].x || pieces[i].y != refsPieces[i].y)
                    return false;
            }
            return true;
        }    

        function drawPieceRotationRect(piece, color='blue') {
            removeSelectionRect();

            selectionRect = new createjs.Container();
            var rectShape = new createjs.Shape();
            var rect = getPieceBoundingRect(piece);
            rect.x = - 1 * (rect.width / 2) ; rect.y = - 1 * (rect.height / 2);
            rectShape.graphics.beginStroke(color).drawRect(rect.x, rect.y, rect.width, rect.height).endStroke();
            selectionRect.addChild(rectShape);
            piece.addChild(selectionRect);

            addResizeHandle(rect.x,rect.y, piece);
            addResizeHandle(rect.x + rect.width,rect.y, piece);
            addResizeHandle(rect.x,rect.y + rect.height, piece);
            addResizeHandle(rect.x + rect.width,rect.y + rect.height, piece);

            stage.update();
            return selectionRect;
        }

        function getAngleBetweenVectors(x1, y1, x2, y2) {
            var sineAngle = ((x1 * y2) - (x2 * y1)) / 
                (Math.sqrt((x1 * x1) + (y1 * y1)) * Math.sqrt((x2 * x2) + (y2 * y2)));
            return Math.asin(sineAngle) * (180/Math.PI); 
        }

        function registerPieceRotationListener(rotationHandle, piece) {
            rotationHandle.on('pressmove', function(evt) {
                if (!rotationHandle.hasOwnProperty('moveStartedAt') || rotationHandle.moveStartedAt == null) {
                    rotationHandle.moveStartedAt = { x: evt.stageX, y: evt.stageY };
                    rotationHandle.direction = null;
                } else if (evt.stageX != rotationHandle.moveStartedAt.x || 
                            evt.stageY != rotationHandle.moveStartedAt.y) {

                    var rotationChange = getAngleBetweenVectors(
                        piece.x - rotationHandle.moveStartedAt.x, piece.y - rotationHandle.moveStartedAt.y, 
                        piece.x - evt.stageX, piece.y - evt.stageY);
                    
                    if (Math.abs(rotationChange) >= 1) {
                        piece.rotation = (piece.rotation + (rotationChange)) % 360 ;
    
                        stage.update();
                        rotationHandle.moveStartedAt.x = evt.stageX;
                        rotationHandle.moveStartedAt.y = evt.stageY;
                    }

                }
                evt.preventDefault();    
                evt.stopPropagation();
            });
            
            rotationHandle.on('pressup', function(evt) {
                rotationHandle.moveStartedAt = null;
                rotationHandle.direction = null;
            });            
        }

        function removeSelectionRect() {
            if (selectionRect) {
                selectionRect.parent.removeChild(selectionRect);
                selectionRect = null;            
            }
        }

        function addResizeHandle(x, y, piece) {
            rotationHandlesize = new createjs.Shape(
                new createjs.Graphics().beginFill(selectionHandleColor)
                    .drawCircle(x,y,resizeHandleRadius));
            selectionRect.addChild(rotationHandlesize);            
            registerPieceRotationListener(rotationHandlesize, piece);             
        }

        function shufflePieces() {
            for (var i = pieces.length-1; i > 0; i--) {
                var swapIndex = Math.floor(Math.random() * (i + 1));
                swapPieceLocation(pieces, i, swapIndex); 
            }
        }        
        
        function swapPieceLocation(ary, i, j) {
            var tempX = ary[i].x, tempY = ary[i].y;
            ary[i].x = ary[j].x;
            ary[i].y = ary[j].y;
            ary[i].rotation = getRandomNumber(0, 360);
            ary[j].x = tempX;
            ary[j].y = tempY;
            ary[j].rotation = getRandomNumber(0, 360);
        }

        function getRandomNumber (min, max) {
            return Math.random() * (max - min) + min; 
        }

        self._drawRect = function(rect, color, parent=exportRoot) {
            parent.addChild(rectShape);
            return rectShape;
        }          

        _init();
    }

    window.AnimatePuzzleManager = _puzzleManager;
})();