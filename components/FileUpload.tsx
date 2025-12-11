import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // Only accept excel files roughly
    const validFiles = files.filter(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    );
    setSelectedFiles(validFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`relative p-8 border-2 border-dashed rounded-xl transition-all duration-200 text-center ${
          dragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          className="hidden" 
          onChange={handleChange}
          accept=".xlsx,.xls,.csv"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-brand-100 rounded-full text-brand-600">
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">
              拖拽 Excel 表格到这里
            </p>
            <p className="text-sm text-slate-500 mt-1">
              支持多文件上传 (.xlsx, .xls)
            </p>
          </div>
          <button 
            onClick={() => inputRef.current?.click()}
            className="px-6 py-2 text-sm font-medium text-brand-600 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
          >
            点击选择文件
          </button>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-slate-700">已选择 {selectedFiles.length} 个文件:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet size={20} className="text-green-600" />
                  <span className="text-sm text-slate-600 truncate max-w-xs">{file.name}</span>
                </div>
                <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`w-full mt-4 py-3 px-4 rounded-lg text-white font-medium shadow-sm transition-all ${
              isProcessing 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 hover:shadow-md'
            }`}
          >
            {isProcessing ? '正在处理数据...' : '开始筛选与汇总'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
