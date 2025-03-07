import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Circle, Line, Image, Transformer } from 'react-konva';
import Konva from 'konva'; // Add this import
import 'animate.css';

function App() {
  const [elements, setElements] = useState([]);
  const [images, setImages] = useState([]);
  const [suggestedText, setSuggestedText] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [history, setHistory] = useState([{ elements: [], images: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const debounceTimeout = useRef(null);
  const [bannerSize, setBannerSize] = useState({ width: 600, height: 400 });
  const [showBorder, setShowBorder] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && stageRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = (rect.width - bannerSize.width * zoomLevel) / 2;
        const offsetY = (rect.height - bannerSize.height * zoomLevel) / 2;
        stageRef.current.x(offsetX > 0 ? offsetX : 0);
        stageRef.current.y(offsetY > 0 ? offsetY : 0);
        stageRef.current.scale({ x: zoomLevel, y: zoomLevel });
        stageRef.current.batchDraw();
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [bannerSize, zoomLevel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedId) handleDelete();
      if (e.ctrlKey && e.key === 'z') handleUndo();
      if (e.ctrlKey && e.key === 'y') handleRedo();
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(prev + 0.1, 3));
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyIndex]);

  const saveToHistory = (newElements, newImages) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...newElements], images: [...newImages] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
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
        const maxWidth = bannerSize.width - 40;
        const maxHeight = bannerSize.height - 40;
        const aspectRatio = img.width / img.height;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        const newImages = [...images, { 
          id: Date.now(), 
          src: img.src, 
          x: 20, 
          y: 20, 
          width, 
          height, 
          imageObj: img,
          animation: { type: null, duration: 1, delay: 0, iteration: 1 }
        }];
        setImages(newImages);
        saveToHistory(elements, newImages);
      };
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    const newElements = [...elements, { 
      id: Date.now(), 
      type: 'text', 
      x: 20, 
      y: 20, 
      text: 'New Text', 
      fontSize: 20, 
      fill: 'black',
      animation: { type: null, duration: 1, delay: 0, iteration: 1 }
    }];
    setElements(newElements);
    saveToHistory(newElements, images);
  };

  const addShape = (shapeType) => {
    let newShape;
    switch (shapeType) {
      case 'rectangle':
        newShape = { 
          id: Date.now(), 
          type: 'rect', 
          x: 20, 
          y: 20, 
          width: 100, 
          height: 50, 
          fill: 'blue',
          animation: { type: null, duration: 1, delay: 0, iteration: 1 }
        };
        break;
      case 'circle':
        newShape = { 
          id: Date.now(), 
          type: 'circle', 
          x: 70, 
          y: 70, 
          radius: 50, 
          fill: 'red',
          animation: { type: null, duration: 1, delay: 0, iteration: 1 }
        };
        break;
      case 'triangle':
        newShape = { 
          id: Date.now(), 
          type: 'line', 
          points: [50, 0, 100, 100, 0, 100], 
          x: 20, 
          y: 20, 
          fill: 'green', 
          closed: true,
          animation: { type: null, duration: 1, delay: 0, iteration: 1 }
        };
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

    if (type === 'text') {
      const scaleX = node.scaleX();
      const newFontSize = Math.round((newElements[index].fontSize || 20) * scaleX);
      newElements[index].fontSize = newFontSize;
      newElements[index].x = node.x();
      newElements[index].y = node.y();
    } else if (type === 'rect' || type === 'image') {
      newElements[index].width = Math.abs(node.width() * node.scaleX());
      newElements[index].height = Math.abs(node.height() * node.scaleY());
      newElements[index].x = node.x();
      newElements[index].y = node.y();
    } else if (type === 'circle') {
      newElements[index].radius = Math.abs(node.radius() * node.scaleX());
      newElements[index].x = node.x();
      newElements[index].y = node.y();
    } else if (type === 'line') {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      newElements[index].points = newElements[index].points.map((p, i) =>
        i % 2 === 0 ? p * scaleX : p * scaleY
      );
      newElements[index].x = node.x();
      newElements[index].y = node.y();
    }

    node.scaleX(1);
    node.scaleY(1);

    type === 'image' ? setImages(newElements) : setElements(newElements);
    node.getLayer().batchDraw();
    saveToHistory(type === 'image' ? elements : newElements, type === 'image' ? newElements : images);
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage() || (e.target instanceof Konva.Rect && e.target.attrs.fill === 'white')) {
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
    }, 300);
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; }
          #banner { position: relative; width: ${bannerSize.width}px; height: ${bannerSize.height}px; border: ${showBorder ? '1px solid #cccccc' : 'none'}; overflow: hidden; }
          .element { position: absolute; }
        </style>
      </head>
      <body>
        <div id="banner">
          ${elements
            .map((el) => {
              const animationClass = el.animation?.type ? `${el.animation.type} animate__animated` : '';
              const animationStyle = el.animation?.type
                ? `animation-duration: ${el.animation.duration}s; animation-delay: ${el.animation.delay}s; animation-iteration-count: ${el.animation.iteration};`
                : '';
              if (el.type === 'text') {
                return `<div class="element ${animationClass}" style="left: ${el.x}px; top: ${el.y}px; font-size: ${el.fontSize || 20}px; color: ${el.fill || 'black'}; ${animationStyle}">${el.text}</div>`;
              } else if (el.type === 'rect') {
                return `<div class="element ${animationClass}" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; background: ${el.fill}; ${el.stroke ? `border: 1px solid ${el.stroke};` : ''} ${animationStyle}"></div>`;
              } else if (el.type === 'circle') {
                return `<div class="element ${animationClass}" style="left: ${el.x}px; top: ${el.y}px; width: ${el.radius * 2}px; height: ${el.radius * 2}px; background: ${el.fill}; ${el.stroke ? `border: 1px solid ${el.stroke};` : ''} border-radius: 50%; ${animationStyle}"></div>`;
              } else if (el.type === 'line') {
                const points = el.points;
                let minX = Math.min(points[0], points[2], points[4]);
                let maxX = Math.max(points[0], points[2], points[4]);
                let minY = Math.min(points[1], points[3], points[5]);
                let maxY = Math.max(points[1], points[3], points[5]);
                const width = maxX - minX;
                const height = maxY - minY;
                const adjustedPoints = points
                  .map((p, i) => (i % 2 === 0 ? p - minX : p - minY))
                  .join(' ');
                return `<svg class="element ${animationClass}" style="left: ${el.x + minX}px; top: ${el.y + minY}px; width: ${width}px; height: ${height}px; ${animationStyle}" viewBox="0 0 ${width} ${height}"><polygon points="${adjustedPoints}" style="fill: ${el.fill}; ${el.stroke ? `stroke: ${el.stroke}; stroke-width: 1;` : ''}" /></svg>`;
              }
              return '';
            })
            .join('')}
          ${images
            .map((img) => {
              const animationClass = img.animation?.type ? `${img.animation.type} animate__animated` : '';
              const animationStyle = img.animation?.type
                ? `animation-duration: ${img.animation.duration}s; animation-delay: ${img.animation.delay}s; animation-iteration-count: ${img.animation.iteration};`
                : '';
              return `<img class="element ${animationClass}" src="${img.src}" style="left: ${img.x}px; top: ${img.y}px; width: ${img.width}px; height: ${img.height}px; ${animationStyle}" />`;
            })
            .join('')}
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
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <div className="w-52 bg-gray-200 p-4 flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-col gap-2">
          <label className="text-base">Banner Size</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="100"
              value={bannerSize.width}
              onChange={(e) => setBannerSize({ ...bannerSize, width: Number(e.target.value) })}
              className="w-20 p-1 rounded"
              placeholder="Width"
            />
            <span className="self-center">x</span>
            <input
              type="number"
              min="100"
              value={bannerSize.height}
              onChange={(e) => setBannerSize({ ...bannerSize, height: Number(e.target.value) })}
              className="w-20 p-1 rounded"
              placeholder="Height"
            />
          </div>
          <label className="flex items-center gap-2 text-base">
            <input 
              type="checkbox" 
              checked={showBorder}
              onChange={(e) => setShowBorder(e.target.checked)}
            />
            Show Border
          </label>
        </div>
        <button onClick={addText} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Text</button>
        <button onClick={handleAddImageClick} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Image</button>
        <div className="flex flex-col gap-2">
          <button onClick={() => addShape('rectangle')} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Rectangle</button>
          <button onClick={() => addShape('circle')} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Circle</button>
          <button onClick={() => addShape('triangle')} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Triangle</button>
        </div>
        <button onClick={handleUndo} disabled={historyIndex <= 0} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 disabled:opacity-50">Undo</button>
        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 disabled:opacity-50">Redo</button>
        <button onClick={handleExportPNG} className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Export as PNG</button>
        <button onClick={handleExportHTML} className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Export as HTML</button>
      </div>

      <div ref={containerRef} className="flex-1 bg-gray-100 overflow-auto p-4">
        <Stage
          ref={stageRef}
          width={bannerSize.width}
          height={bannerSize.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={bannerSize.width}
              height={bannerSize.height}
              fill="white"
              stroke={showBorder ? '#cccccc' : null}
              strokeWidth={showBorder ? 1 : 0}
            />
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
                    onTransformEnd={(e) => handleTransformEnd(e, String(el.id), 'text')}
                    onDblClick={() => {
                      const newText = prompt('Edit text:', el.text);
                      if (newText) {
                        const newElements = elements.map((item) => 
                          String(item.id) === String(el.id) ? { ...item, text: newText } : item
                        );
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
                    stroke={el.stroke || null}
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
                    stroke={el.stroke || null}
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
                    stroke={el.stroke || null}
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
                const selectedElement = elements.find(el => String(el.id) === selectedId);
                if (selectedElement?.type === 'text') {
                  return oldBox;
                }
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      <div className="w-64 bg-blue-100 p-4 flex-shrink-0 fixed right-0 top-0 h-screen overflow-y-auto">
        <h3 className="font-bold mb-2 text-base">AI Suggestions</h3>
        <button onClick={suggestText} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Suggest Text</button>
        <label className="mt-2 block">
          <span className="text-base">Upload Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-1 p-2"
            ref={fileInputRef}
            hidden
          />
        </label>
        {suggestedText && <p className="mt-2 text-gray-700">Suggestion: "{suggestedText}"</p>}

        {selectedId && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">Properties</h3>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-600 mb-2"
            >
              Delete
            </button>
            {!images.some((img) => String(img.id) === selectedId) && (
              <label className="block mb-2">
                <span className="text-base">Fill Color</span>
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
                <span className="text-base">Font Size</span>
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

            <div className="mt-4">
              <h3 className="font-bold mb-2">Animation</h3>
              <label className="block mb-2">
                <span className="text-base">Animation Type</span>
                <select
                  value={
                    (elements.find((el) => String(el.id) === selectedId)?.animation?.type ||
                    images.find((img) => String(img.id) === selectedId)?.animation?.type) || ''
                  }
                  onChange={(e) => {
                    const isImage = images.some((img) => String(img.id) === selectedId);
                    const updatedArray = handlePropertyChange('animation', {
                      ...(isImage
                        ? images.find((img) => String(img.id) === selectedId)?.animation
                        : elements.find((el) => String(el.id) === selectedId)?.animation),
                      type: e.target.value || null,
                    });
                    debounceSaveHistory(isImage ? elements : updatedArray, isImage ? updatedArray : images);
                  }}
                  className="mt-1 w-full p-1 text-base"
                >
                  <option value="">None</option>
                  <option value="animate__fadeIn">Fade In</option>
                  <option value="animate__bounce">Bounce</option>
                  <option value="animate__slideInLeft">Slide In Left</option>
                  <option value="animate__zoomIn">Zoom In</option>
                </select>
              </label>
              <label className="block mb-2">
                <span className="text-base">Duration (s)</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  defaultValue={
                    (elements.find((el) => String(el.id) === selectedId)?.animation?.duration ||
                    images.find((img) => String(img.id) === selectedId)?.animation?.duration) || 1
                  }
                  onChange={(e) => {
                    const isImage = images.some((img) => String(img.id) === selectedId);
                    const updatedArray = handlePropertyChange('animation', {
                      ...(isImage
                        ? images.find((img) => String(img.id) === selectedId)?.animation
                        : elements.find((el) => String(el.id) === selectedId)?.animation),
                      duration: Number(e.target.value),
                    });
                    debounceSaveHistory(isImage ? elements : updatedArray, isImage ? updatedArray : images);
                  }}
                  className="mt-1 w-full p-1"
                />
              </label>
              <label className="block mb-2">
                <span className="text-base">Delay (s)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  defaultValue={
                    (elements.find((el) => String(el.id) === selectedId)?.animation?.delay ||
                    images.find((img) => String(img.id) === selectedId)?.animation?.delay) || 0
                  }
                  onChange={(e) => {
                    const isImage = images.some((img) => String(img.id) === selectedId);
                    const updatedArray = handlePropertyChange('animation', {
                      ...(isImage
                        ? images.find((img) => String(img.id) === selectedId)?.animation
                        : elements.find((el) => String(el.id) === selectedId)?.animation),
                      delay: Number(e.target.value),
                    });
                    debounceSaveHistory(isImage ? elements : updatedArray, isImage ? updatedArray : images);
                  }}
                  className="mt-1 w-full p-1"
                />
              </label>
              <label className="block mb-2">
                <span className="text-base">Iterations</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    defaultValue={
                      (elements.find((el) => String(el.id) === selectedId)?.animation?.iteration ||
                      images.find((img) => String(img.id) === selectedId)?.animation?.iteration) || 1
                    }
                    onChange={(e) => {
                      const isImage = images.some((img) => String(img.id) === selectedId);
                      const updatedArray = handlePropertyChange('animation', {
                        ...(isImage
                          ? images.find((img) => String(img.id) === selectedId)?.animation
                          : elements.find((el) => String(el.id) === selectedId)?.animation),
                        iteration: Number(e.target.value),
                      });
                      debounceSaveHistory(isImage ? elements : updatedArray, isImage ? updatedArray : images);
                    }}
                    className="mt-1 w-full p-1"
                  />
                  <button
                    onClick={() => {
                      const isImage = images.some((img) => String(img.id) === selectedId);
                      const updatedArray = handlePropertyChange('animation', {
                        ...(isImage
                          ? images.find((img) => String(img.id) === selectedId)?.animation
                          : elements.find((el) => String(el.id) === selectedId)?.animation),
                        iteration: 'infinite',
                      });
                      debounceSaveHistory(isImage ? elements : updatedArray, isImage ? updatedArray : images);
                    }}
                    className="mt-1 bg-blue-500 text-white p-1 rounded hover:bg-blue-600 text-sm"
                  >
                    Infinite
                  </button>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;