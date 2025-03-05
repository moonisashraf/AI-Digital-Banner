import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Circle, Line, Image, Transformer } from 'react-konva';

function App() {
  const [elements, setElements] = useState([]);
  const [images, setImages] = useState([]);
  const [suggestedText, setSuggestedText] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [stageHeight, setStageHeight] = useState(0);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [history, setHistory] = useState([{ elements: [], images: [] }]); // Initial state in history
  const [historyIndex, setHistoryIndex] = useState(0); // Start at 0 with initial state
  const debounceTimeout = useRef(null); // For debouncing color changes

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageWidth(rect.width);
        setStageHeight(rect.height || Math.min(window.innerHeight, 600));
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedId) handleDelete();
      if (e.ctrlKey && e.key === 'z') handleUndo();
      if (e.ctrlKey && e.key === 'y') handleRedo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyIndex]);

  const saveToHistory = (newElements, newImages) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...newElements], images: [...newImages] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    console.log('Saved to history:', newHistory[newHistory.length - 1]); // Debug log
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const newImages = [...images, { id: Date.now(), src: img.src, x: 50, y: 50, width: 100, height: 100, imageObj: img }];
        setImages(newImages);
        saveToHistory(elements, newImages);
      };
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    const newElements = [...elements, { id: Date.now(), type: 'text', x: 50, y: 50, text: 'New Text', fontSize: 20, fill: 'black' }];
    setElements(newElements);
    saveToHistory(newElements, images);
  };

  const addShape = (shapeType) => {
    let newShape;
    switch (shapeType) {
      case 'rectangle':
        newShape = { id: Date.now(), type: 'rect', x: 50, y: 50, width: 100, height: 50, fill: 'blue', stroke: 'black' };
        break;
      case 'circle':
        newShape = { id: Date.now(), type: 'circle', x: 50, y: 50, radius: 50, fill: 'red', stroke: 'black' };
        break;
      case 'triangle':
        newShape = { id: Date.now(), type: 'line', points: [50, 0, 100, 100, 0, 100], x: 50, y: 50, fill: 'green', closed: true, stroke: 'black' };
        break;
      default:
        return;
    }
    const newElements = [...elements, newShape];
    setElements(newElements);
    saveToHistory(newElements, images);
  };

  const suggestText = () => {
    const suggestions = ['Shop Now!', 'Limited Offer!', 'Get Started'];
    setSuggestedText(suggestions[Math.floor(Math.random() * 3)]);
  };

  const handleSelect = (e) => {
    e.cancelBubble = true;
    const node = e.target;
    const id = node.id();
    setSelectedId(id);

    if (transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne(`#${id}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        console.error('Node not found for ID:', id);
      }
    }
  };

  const handleDragEnd = (e, id, type) => {
    const newElements = type === 'image' ? [...images] : [...elements];
    const index = type === 'image' ? images.findIndex((img) => String(img.id) === id) : elements.findIndex((el) => String(el.id) === id);
    newElements[index].x = e.target.x();
    newElements[index].y = e.target.y();
    type === 'image' ? setImages(newElements) : setElements(newElements);
    saveToHistory(type === 'image' ? elements : newElements, type === 'image' ? newElements : images);
  };

  const handleTransformEnd = (e, id, type) => {
    const node = e.target;
    const newElements = type === 'image' ? [...images] : [...elements];
    const index = type === 'image' ? images.findIndex((img) => String(img.id) === id) : elements.findIndex((el) => String(el.id) === id);

    if (type === 'rect' || type === 'image') {
      newElements[index].width = Math.abs(node.width() * node.scaleX());
      newElements[index].height = Math.abs(node.height() * node.scaleY());
    } else if (type === 'circle') {
      newElements[index].radius = Math.abs(node.radius() * node.scaleX());
    } else if (type === 'line') {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      newElements[index].points = newElements[index].points.map((p, i) =>
        i % 2 === 0 ? p * scaleX : p * scaleY
      );
    }

    newElements[index].x = node.x();
    newElements[index].y = node.y();

    node.scaleX(1);
    node.scaleY(1);

    type === 'image' ? setImages(newElements) : setElements(newElements);
    node.getLayer().batchDraw();
    saveToHistory(type === 'image' ? elements : newElements, type === 'image' ? newElements : images);
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  };

  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePropertyChange = (key, value) => {
    const isImage = images.some((img) => String(img.id) === selectedId);
    const arrayToUpdate = isImage ? images : elements;
    const setter = isImage ? setImages : setElements;

    if (isImage && key === 'fill') return;

    const updatedArray = arrayToUpdate.map((el) =>
      String(el.id) === selectedId ? { ...el, [key]: value } : el
    );
    setter(updatedArray);

    if (stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        node.setAttr(key, value);
        node.getLayer().batchDraw();
      }
    }
    return updatedArray;
  };

  const debounceSaveHistory = (newElements, newImages) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      saveToHistory(newElements, newImages);
    }, 300); // 300ms debounce
  };

  const handleDelete = () => {
    const isImage = images.some((img) => String(img.id) === selectedId);
    const arrayToUpdate = isImage ? images : elements;
    const setter = isImage ? setImages : setElements;

    const updatedArray = arrayToUpdate.filter((el) => String(el.id) !== selectedId);
    setter(updatedArray);
    setSelectedId(null);

    if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
    saveToHistory(isImage ? elements : updatedArray, isImage ? updatedArray : images);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements(prevState.elements);
      setImages(prevState.images);
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
      console.log('Undo to:', prevState); // Debug log
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements(nextState.elements);
      setImages(nextState.images);
      setHistoryIndex(historyIndex + 1);
      setSelectedId(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
      console.log('Redo to:', nextState); // Debug log
    }
  };

  const handleExportPNG = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ mimeType: 'image/png', quality: 1 });
      const link = document.createElement('a');
      link.download = 'banner-design.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Banner Design</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; }
          #banner { position: relative; width: ${stageWidth}px; height: ${stageHeight}px; border: 1px solid #000; overflow: hidden; }
          .element { position: absolute; }
        </style>
      </head>
      <body>
        <div id="banner">
          ${elements.map(el => {
            if (el.type === 'text') {
              return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; font-size: ${el.fontSize || 20}px; color: ${el.fill || 'black'};">${el.text}</div>`;
            } else if (el.type === 'rect') {
              return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; background: ${el.fill}; border: 1px solid ${el.stroke || 'black'};"></div>`;
            } else if (el.type === 'circle') {
              return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.radius * 2}px; height: ${el.radius * 2}px; background: ${el.fill}; border: 1px solid ${el.stroke || 'black'}; border-radius: 50%;"></div>`;
            } else if (el.type === 'line') {
              return `<svg class="element" style="left: ${el.x}px; top: ${el.y}px;" width="100" height="100"><polygon points="${el.points.join(' ')}" style="fill: ${el.fill}; stroke: ${el.stroke || 'black'}; stroke-width: 1;" /></svg>`;
            }
            return '';
          }).join('')}
          ${images.map(img => {
            return `<img class="element" src="${img.src}" style="left: ${img.x}px; top: ${img.y}px; width: ${img.width}px; height: ${img.height}px;" />`;
          }).join('')}
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = 'banner-design.html';
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-x-hidden bg-white">
      <div className="w-full lg:w-52 bg-gray-200 p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 flex-shrink-0">
        <button onClick={addText} className="bg-blue-500 text-white p-1 sm:p-2 rounded hover:bg-blue-600 text-sm sm:text-base">
          Add Text
        </button>
        <button onClick={handleAddImageClick} className="bg-blue-500 text-white p-1 sm:p-2 rounded hover:bg-blue-600 text-sm sm:text-base">
          Add Image
        </button>
        <div className="flex flex-col gap-2">
          <button onClick={() => addShape('rectangle')} className="bg-blue-500 text-white p-1 sm:p-2 rounded hover:bg-blue-600 text-sm sm:text-base">
            Add Rectangle
          </button>
          <button onClick={() => addShape('circle')} className="bg-blue-500 text-white p-1 sm:p-2 rounded hover:bg-blue-600 text-sm sm:text-base">
            Add Circle
          </button>
          <button onClick={() => addShape('triangle')} className="bg-blue-500 text-white p-1 sm:p-2 rounded hover:bg-blue-600 text-sm sm:text-base">
            Add Triangle
          </button>
        </div>
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="bg-gray-500 text-white p-1 sm:p-2 rounded hover:bg-gray-600 text-sm sm:text-base disabled:opacity-50"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="bg-gray-500 text-white p-1 sm:p-2 rounded hover:bg-gray-600 text-sm sm:text-base disabled:opacity-50"
        >
          Redo
        </button>
        <button
          onClick={handleExportPNG}
          className="bg-green-500 text-white p-1 sm:p-2 rounded hover:bg-green-600 text-sm sm:text-base"
        >
          Export as PNG
        </button>
        <button
          onClick={handleExportHTML}
          className="bg-green-500 text-white p-1 sm:p-2 rounded hover:bg-green-600 text-sm sm:text-base"
        >
          Export as HTML
        </button>
      </div>

      <div ref={containerRef} className="flex-1 bg-white border overflow-hidden p-2 sm:p-4">
        <Stage
          ref={stageRef}
          width={stageWidth || 600}
          height={stageHeight || 400}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {elements.map((el) => (
              <React.Fragment key={el.id}>
                {el.type === 'text' ? (
                  <Text
                    id={String(el.id)}
                    x={el.x}
                    y={el.y}
                    text={el.text}
                    fontSize={el.fontSize || 20}
                    fill={el.fill || 'black'}
                    draggable
                    onDragEnd={(e) => handleDragEnd(e, String(el.id), 'element')}
                    onDblClick={() => {
                      const newText = prompt('Edit text:', el.text);
                      if (newText) {
                        const newElements = elements.map((item) => (String(item.id) === String(el.id) ? { ...item, text: newText } : item));
                        setElements(newElements);
                        saveToHistory(newElements, images);
                      }
                    }}
                    onClick={handleSelect}
                    onTap={handleSelect}
                  />
                ) : el.type === 'rect' ? (
                  <Rect
                    id={String(el.id)}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill={el.fill}
                    stroke={el.stroke}
                    draggable
                    onDragEnd={(e) => handleDragEnd(e, String(el.id), 'element')}
                    onTransformEnd={(e) => handleTransformEnd(e, String(el.id), 'rect')}
                    onClick={handleSelect}
                    onTap={handleSelect}
                  />
                ) : el.type === 'circle' ? (
                  <Circle
                    id={String(el.id)}
                    x={el.x}
                    y={el.y}
                    radius={el.radius}
                    fill={el.fill}
                    stroke={el.stroke}
                    draggable
                    onDragEnd={(e) => handleDragEnd(e, String(el.id), 'element')}
                    onTransformEnd={(e) => handleTransformEnd(e, String(el.id), 'circle')}
                    onClick={handleSelect}
                    onTap={handleSelect}
                  />
                ) : el.type === 'line' ? (
                  <Line
                    id={String(el.id)}
                    points={el.points}
                    x={el.x}
                    y={el.y}
                    fill={el.fill}
                    stroke={el.stroke}
                    closed={el.closed}
                    draggable
                    onDragEnd={(e) => handleDragEnd(e, String(el.id), 'element')}
                    onTransformEnd={(e) => handleTransformEnd(e, String(el.id), 'line')}
                    onClick={handleSelect}
                    onTap={handleSelect}
                  />
                ) : null}
              </React.Fragment>
            ))}
            {images.map((img) => (
              <Image
                key={img.id}
                id={String(img.id)}
                image={img.imageObj}
                x={img.x}
                y={img.y}
                width={img.width}
                height={img.height}
                draggable
                onDragEnd={(e) => handleDragEnd(e, String(img.id), 'image')}
                onTransformEnd={(e) => handleTransformEnd(e, String(img.id), 'image')}
                onClick={handleSelect}
                onTap={handleSelect}
              />
            ))}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      <div className="w-full lg:w-64 bg-blue-100 p-2 sm:p-4 flex-shrink-0">
        <h3 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">AI Suggestions</h3>
        <button onClick={suggestText} className="bg-blue-500 text-white p-1 sm:p-2 rounded hover:bg-blue-600 text-sm sm:text-base">
          Suggest Text
        </button>
        <label className="mt-2 block">
          <span className="text-sm sm:text-base">Upload Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-1 p-1 sm:p-2 text-sm sm:text-base"
            ref={fileInputRef}
          />
        </label>
        {suggestedText && <p className="mt-1 sm:mt-2 text-gray-700 text-sm sm:text-base">Suggestion: "{suggestedText}"</p>}

        {selectedId && (
          <div className="mt-4">
            <h3 className="font-bold mb-2 text-sm sm:text-base">Properties</h3>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white p-1 sm:p-2 rounded hover:bg-red-600 text-sm sm:text-base mb-2"
            >
              Delete
            </button>
            {!images.some((img) => String(img.id) === selectedId) && (
              <label className="block mb-2">
                <span className="text-sm sm:text-base">Fill Color</span>
                <input
                  type="color"
                  defaultValue={elements.find((el) => String(el.id) === selectedId)?.fill || '#000000'}
                  onChange={(e) => {
                    const updatedArray = handlePropertyChange('fill', e.target.value);
                    debounceSaveHistory(updatedArray, images);
                  }}
                  className="mt-1 w-full"
                />
              </label>
            )}
            {elements.find((el) => String(el.id) === selectedId)?.type === 'text' && (
              <label className="block mb-2">
                <span className="text-sm sm:text-base">Font Size</span>
                <input
                  type="number"
                  min="10"
                  defaultValue={elements.find((el) => String(el.id) === selectedId)?.fontSize || 20}
                  onChange={(e) => {
                    const updatedArray = handlePropertyChange('fontSize', Number(e.target.value));
                    saveToHistory(updatedArray, images);
                  }}
                  className="mt-1 w-full p-1"
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;