import React, { useState, useRef } from 'react';
import { Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ImageUploadComponent = ({className}) => {
    const [images, setImages] = useState([]);
    const [dragOverUpload, setDragOverUpload] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const fileInputRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Sample images để demo
    // const sampleImages = [
    //     "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop"
    // ];

    // React.useEffect(() => {
    //     // Load sample images
    //     const loadedImages = sampleImages.map((url, index) => ({
    //         id: Date.now() + index,
    //         url: url,
    //         name: `image-${index + 1}.jpg`
    //     }));
    //     setImages(loadedImages);
    // }, []);

    const handleFileSelect = (files) => {
        const newImages = Array.from(files).map(file => ({
            id: Date.now() + Math.random(),
            url: URL.createObjectURL(file),
            name: file.name,
            file: file
        }));
        setImages(prev => [...prev, ...newImages].slice(0, 10));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOverUpload(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOverUpload(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOverUpload(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
    };

    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    // Drag and drop reordering functions
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverImage = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeaveImage = () => {
        setDragOverIndex(null);
    };

    const handleDropImage = (e, dropIndex) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];

        // Remove dragged image from its original position
        newImages.splice(draggedIndex, 1);

        // Insert at new position
        const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
        newImages.splice(adjustedDropIndex, 0, draggedImage);

        setImages(newImages);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <Card className={className}>
            <CardHeader><CardTitle>Upload Media</CardTitle></CardHeader>
            <CardContent>
                <div className="mx-auto">
                    {/* Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-20 mb-8 text-center transition-colors ${dragOverUpload
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center">
                            <Button
                                onClick={handleUploadClick}
                            >
                                <Upload size={20} />
                                Select photos
                            </Button>
                            <p className="text-gray-500 mt-4">
                                or drag photos here<br />
                                <span className="text-sm">(Up to 10 photos)</span>
                            </p>
                        </div>

                        <Input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                    </div>

                    {/* Image Gallery */}
                    {images.length > 0 && (
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-medium text-gray-800">
                                    Uploaded Images ({images.length}/10)
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => scroll('left')}
                                        className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => scroll('right')}
                                        className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            <div
                                ref={scrollContainerRef}
                                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {images.map((image, index) => (
                                    <div
                                        key={image.id}
                                        className={`relative flex-shrink-0 rounded-lg overflow-hidden cursor-move transition-all duration-200 ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                                            } ${dragOverIndex === index ? 'ring-2 ring-blue-400' : ''
                                            }`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOverImage(e, index)}
                                        onDragLeave={handleDragLeaveImage}
                                        onDrop={(e) => handleDropImage(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className="w-48 h-36 bg-gray-200 relative group">
                                            <img
                                                src={image.url}
                                                alt={image.name}
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />

                                            {/* Delete button */}
                                            <button
                                                onClick={() => removeImage(image.id)}
                                                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-90"
                                            >
                                                <X size={16} />
                                            </button>

                                            {/* Drag indicator */}
                                            <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex gap-0.5">
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    {images.length > 1 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                            Drag and drop images to reorder them
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ImageUploadComponent;