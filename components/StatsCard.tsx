import React, { useState } from 'react';
import { Filter, Database, Ban, CheckCircle2, Home, Store, RotateCw, Reply, AlertTriangle, Users, Copy, Check, X, MousePointerClick } from 'lucide-react';
import { FilterStats } from '../types';

interface StatsCardProps {
  stats: FilterStats;
}

interface SelectedCourier {
  name: string;
  count: number;
  trackingNumbers: string[];
}

const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedDetail, setCopiedDetail] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<SelectedCourier | null>(null);

  // Copy all couriers summary (Name: Count)
  const handleCopySummary = async () => {
    const text = stats.courierStats
      .map(c => `${c.name}：${c.count}件`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Copy specific courier details (List of tracking numbers)
  const handleCopyDetail = async () => {
    if (!selectedCourier) return;

    const text = `${selectedCourier.name} - 需处理邮件 (${selectedCourier.count}件):\n${selectedCourier.trackingNumbers.join('\n')}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDetail(true);
      setTimeout(() => setCopiedDetail(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <Database size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">总处理行数</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalRows}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Filter size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">识别为菜鸟邮件</p>
            <p className="text-2xl font-bold text-slate-900">{stats.cainiaoRows}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <Ban size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">已剔除机构</p>
            <p className="text-2xl font-bold text-slate-900">{stats.excludedRows}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 ring-2 ring-green-500 ring-offset-2">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">最终有效数据</p>
            <p className="text-2xl font-bold text-green-600">{stats.finalCount}</p>
          </div>
        </div>
      </div>

      {/* Detailed Delivery Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="mb-2 p-2 bg-indigo-50 rounded-full text-indigo-600">
            <Home size={20} />
          </div>
          <p className="text-xs text-slate-500 mb-1">按址投递</p>
          <p className="text-xl font-bold text-indigo-600">{stats.deliveryStats.address}</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="mb-2 p-2 bg-orange-50 rounded-full text-orange-600">
            <Store size={20} />
          </div>
          <p className="text-xs text-slate-500 mb-1">驿站投递</p>
          <p className="text-xl font-bold text-orange-600">{stats.deliveryStats.station}</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="mb-2 p-2 bg-purple-50 rounded-full text-purple-600">
            <RotateCw size={20} />
          </div>
          <p className="text-xs text-slate-500 mb-1">再投邮件</p>
          <p className="text-xl font-bold text-purple-600">{stats.deliveryStats.redelivery}</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="mb-2 p-2 bg-rose-50 rounded-full text-rose-600">
            <Reply size={20} />
          </div>
          <p className="text-xs text-slate-500 mb-1">退回邮件</p>
          <p className="text-xl font-bold text-rose-600">{stats.deliveryStats.returned}</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
          <div className="mb-2 p-2 bg-slate-100 rounded-full text-slate-600">
            <AlertTriangle size={20} />
          </div>
          <p className="text-xs text-slate-500 mb-1">异常邮件</p>
          <p className="text-xl font-bold text-slate-600">{stats.deliveryStats.exception}</p>
        </div>
      </div>

      {/* Courier Stats Section */}
      {stats.courierStats.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-2">
                <Users className="text-slate-600" size={20} />
                <h3 className="font-semibold text-slate-800">投递员揽投情况 ({stats.courierStats.length}人)</h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded ml-2">
                  <MousePointerClick size={12} className="inline mr-1" />
                  点击姓名查看单号
                </span>
              </div>
              <button
                onClick={handleCopySummary}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  copiedSummary 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {copiedSummary ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedSummary ? '已复制汇总' : '复制汇总'}</span>
              </button>
            </div>
            
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {stats.courierStats.map((item, index) => (
                <button 
                  key={index} 
                  onClick={() => setSelectedCourier(item)}
                  className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100 hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm transition-all cursor-pointer group text-left w-full"
                >
                  <span className="text-sm font-medium text-slate-700 truncate mr-2 group-hover:text-brand-700" title={item.name}>{item.name}</span>
                  <span className="text-sm font-bold text-brand-600 bg-brand-50 group-hover:bg-white px-2 py-0.5 rounded-full">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modal for Courier Details */}
          {selectedCourier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800">{selectedCourier.name}</h3>
                    <p className="text-sm text-slate-500">共 {selectedCourier.count} 件菜鸟邮件</p>
                  </div>
                  <button 
                    onClick={() => setSelectedCourier(null)}
                    className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto bg-slate-50/50">
                  <ul className="space-y-1">
                    {selectedCourier.trackingNumbers.map((num, idx) => (
                      <li key={idx} className="font-mono text-sm text-slate-700 bg-white px-3 py-2 rounded border border-slate-100 select-all hover:border-brand-200">
                        {num}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end space-x-3">
                   <button 
                    onClick={() => setSelectedCourier(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    关闭
                  </button>
                  <button
                    onClick={handleCopyDetail}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-all ${
                      copiedDetail
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-brand-600 hover:bg-brand-700'
                    }`}
                  >
                    {copiedDetail ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedDetail ? '已复制单号' : '一键复制单号'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatsCard;
