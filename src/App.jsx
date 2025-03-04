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
  const fileInputRef = useRef(null); // Ref for the file input

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
        setImages([...images, { id: Date.now(), src: img.src, x: 50, y: 50, width: 100, height: 100, imageObj: img }]);
      };
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    setElements([...elements, { id: Date.now(), type: 'text', x: 50, y: 50, text: 'New Text', fontSize: 20, fill: 'black' }]);
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
    setElements([...elements, newShape]);
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
    const index = type === 'image' ? images.findIndex((img) => img.id === id) : elements.findIndex((el) => el.id === id);
    newElements[index].x = e.target.x();
    newElements[index].y = e.target.y();
    type === 'image' ? setImages(newElements) : setElements(newElements);
  };

  const handleTransformEnd = (e, id, type) => {
    const node = e.target;
    const newElements = type === 'image' ? [...images] : [...elements];
    const index = type === 'image' ? images.findIndex((img) => img.id === id) : elements.findIndex((el) => el.id === id);

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

  // Function to trigger file input click
  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Programmatically trigger the file input
    }
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
                    onDragEnd={(e) => handleDragEnd(e, el.id, 'element')}
                    onDblClick={() => {
                      const newText = prompt('Edit text:', el.text);
                      if (newText) {
                        setElements(elements.map((item) => (item.id === el.id ? { ...item, text: newText } : item)));
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
                    onDragEnd={(e) => handleDragEnd(e, el.id, 'element')}
                    onTransformEnd={(e) => handleTransformEnd(e, el.id, 'rect')}
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
                    onDragEnd={(e) => handleDragEnd(e, el.id, 'element')}
                    onTransformEnd={(e) => handleTransformEnd(e, el.id, 'circle')}
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
                    onDragEnd={(e) => handleDragEnd(e, el.id, 'element')}
                    onTransformEnd={(e) => handleTransformEnd(e, el.id, 'line')}
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
                onDragEnd={(e) => handleDragEnd(e, img.id, 'image')}
                onTransformEnd={(e) => handleTransformEnd(e, img.id, 'image')}
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
            ref={fileInputRef} // Keep the ref for programmatic triggering
          />
        </label>
        {suggestedText && <p className="mt-1 sm:mt-2 text-gray-700 text-sm sm:text-base">Suggestion: "{suggestedText}"</p>}
      </div>
    </div>
  );
}

export default App;