import React, { useState, useEffect } from 'react';
import { PackageSearch, Download, RefreshCw, AlertCircle, HelpCircle, LogOut } from 'lucide-react';
import FileUpload from './components/FileUpload';
import StatsCard from './components/StatsCard';
import ActivationScreen from './components/ActivationScreen';
import { processExcelFiles, exportToExcel } from './utils/excelService';
import { ProcessedMailItem, FilterStats } from './types';
import { VALID_LICENSES } from './utils/validLicenses';

function App() {
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [data, setData] = useState<ProcessedMailItem[]>([]);
  const [stats, setStats] = useState<FilterStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check license on mount
  useEffect(() => {
    const license = localStorage.getItem('app_license_key');
    // Check if the stored license is in our valid list
    if (license && VALID_LICENSES.includes(license)) {
      setIsActivated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processExcelFiles(files);
      setData(result.data);
      setStats(result.stats);
    } catch (err) {
      console.error(err);
      setError("处理文件时发生错误，请检查文件格式是否正确。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) return;
    exportToExcel(data, `菜鸟邮件汇总_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleReset = () => {
    setData([]);
    setStats(null);
    setError(null);
  };

  const handleLogout = () => {
    // Hidden feature to remove license for testing: Alt + Click Logout
    if (window.confirm('确定要清除激活状态并退出吗？这将需要重新输入激活码。')) {
        localStorage.removeItem('app_license_key');
        setIsActivated(false);
    }
  };

  if (checkingAuth) {
    return null; // Or a loading spinner
  }

  if (!isActivated) {
    return <ActivationScreen onActivate={() => setIsActivated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <PackageSearch size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">揽投部特快专递 · 菜鸟邮件筛选系统</h1>
            <h1 className="text-xl font-bold text-slate-900 sm:hidden">菜鸟邮件筛选</h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded border border-brand-100 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                已激活商业版
             </div>
             <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                title="退出/清除授权"
             >
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Section (Hidden if data is present) */}
        {!stats && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center max-w-2xl">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">上传每日报表</h2>
              <p className="text-slate-600 text-lg">
                拖拽三个揽投部的 Excel 表格到下方。系统将自动筛选出单号 <span className="font-mono bg-slate-200 px-1 rounded">13</span> 开头，
                尾号为 <span className="font-mono bg-slate-200 px-1 rounded">16, 31, 32, 34</span> 的邮件，
                并自动剔除“康巴什蒙欣”、“正意”和“盈馨”揽投部。
              </p>
            </div>
            <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
          </div>
        )}

        {/* Results Section */}
        {stats && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={handleReset}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw size={18} />
                <span>重新上传</span>
              </button>
              <button 
                onClick={handleExport}
                disabled={data.length === 0}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg shadow-sm hover:shadow transition-all font-medium ${
                  data.length === 0 
                  ? 'bg-slate-300 text-white cursor-not-allowed' 
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                <Download size={20} />
                <span>导出 Excel 汇总表</span>
              </button>
            </div>

            <StatsCard stats={stats} />

            {/* Warning if no data found */}
            {stats.cainiaoRows === 0 && (
              <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="text-amber-600 mt-1" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-2">未筛选出任何数据？</h3>
                    <p className="text-amber-700 mb-4">
                      系统在您上传的文件中没有找到符合条件的邮件。这可能是因为列名不匹配导致的。
                    </p>
                    
                    <div className="bg-white/50 p-4 rounded-lg border border-amber-100 mb-4">
                      <p className="text-sm font-semibold text-amber-900 mb-1">系统识别到的所有列名：</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.detectedHeaders.length > 0 ? (
                          stats.detectedHeaders.map((h, i) => (
                            <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-mono">
                              {h}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">未识别到任何列名（文件可能为空或格式不支持）</span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-amber-800">
                      <p className="font-semibold">请检查 Excel 表格：</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>必须包含含有 <strong>“邮件号”</strong> 或 <strong>“单号”</strong> 字样的列。</li>
                        <li>必须包含含有 <strong>“收寄机构”</strong> 字样的列以进行剔除。</li>
                        <li>请确保邮件号是以文本格式存储，而不是科学计数法（如 1.3E+12）。</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800">数据预览 (前 100 条)</h3>
                <span className="text-xs text-slate-500">仅展示部分数据，完整数据请点击导出</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">邮件号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">收件人地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">接收时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">投递员</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">签收方式</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">反馈情况</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {data.slice(0, 100).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600 font-mono">
                          {row.trackingNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 max-w-xs truncate" title={row.recipientAddress}>
                          {row.recipientAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {row.receptionTime || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {row.courier || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {row.signMethod || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !row.feedback ? 'bg-slate-100 text-slate-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {row.feedback || '无'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          暂无符合条件的数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;