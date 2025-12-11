import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, CreditCard, AlertOctagon } from 'lucide-react';
import { VALID_LICENSES } from '../utils/validLicenses';

interface ActivationScreenProps {
  onActivate: () => void;
}

const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivate }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    
    // 严格检查：必须在允许的列表中
    if (VALID_LICENSES.includes(cleanCode)) {
      localStorage.setItem('app_license_key', cleanCode); // 保存激活状态
      onActivate();
    } else {
      setError('无效的激活码。请核对后重新输入，或联系管理员获取正版授权。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-700">
        <div className="bg-slate-800 p-6 text-center border-b border-slate-700">
          <div className="mx-auto bg-brand-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-brand-500/30">
            <Lock className="text-brand-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">商业授权激活</h1>
          <p className="text-slate-400 mt-2 text-sm">揽投部特快专递 · 菜鸟邮件筛选系统</p>
        </div>

        <div className="p-8 bg-slate-50">
          <div className="space-y-4 mb-8">
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start space-x-3 text-slate-700">
                  <ShieldCheck className="text-brand-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-semibold">正版保护</p>
                    <p className="text-xs text-slate-500">本软件受商业版权保护，仅限授权用户使用。</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-slate-700">
                  <CreditCard className="text-brand-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-semibold">一机一码</p>
                    <p className="text-xs text-slate-500">请输入您的专属激活码，激活后永久有效。</p>
                  </div>
                </div>
             </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="license" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                请输入产品密钥
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                </div>
                <input
                  type="text"
                  id="license"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-10 pr-3 py-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all uppercase placeholder:normal-case font-mono text-slate-800 bg-white shadow-sm"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  autoComplete="off"
                />
              </div>
              {error && (
                <div className="mt-3 flex items-start space-x-2 text-red-600 animate-in slide-in-from-left-2">
                   <AlertOctagon size={16} className="mt-0.5 shrink-0"/>
                   <p className="text-xs font-medium">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold tracking-wide hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-500/30 active:scale-[0.98] transform duration-100 flex items-center justify-center space-x-2"
            >
              <span>立即验证并激活</span>
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400">
              遇到问题？请联系系统管理员获取支持
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivationScreen;