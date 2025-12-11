import * as XLSX from 'xlsx';
import { ProcessedMailItem, FilterStats, RawMailRow } from '../types';

// Keywords for fuzzy matching columns
const KEYWORDS = {
  TRACKING: ['邮件号', '单号', '运单', '凭证号', '号码'],
  ADDRESS: ['收件人地址', '收件地址', '地址', '收件人'],
  TIME: ['邮件接收时间', '收寄时间', '接收时间', '日期', '时间'],
  COURIER: ['投递员', '揽投员', '人员', '员工'],
  SIGN_METHOD: ['签收方式', '签收', '投递方式'],
  FEEDBACK: ['反馈情况', '妥投情况', '投递情况', '反馈', '备注'],
  INSTITUTION: ['收寄机构', '收寄局', '机构', '揽投部']
};

// Updated keywords: Added '蒙欣' to catch both '康巴什蒙欣' and '蒙欣揽投部'
const EXCLUDED_KEYWORDS = ['蒙欣', '康巴什蒙欣', '正意', '盈馨'];

// Helper to find the best matching key from the actual row keys
const findBestKey = (actualKeys: string[], keywords: string[]): string | undefined => {
  // 1. Try exact match
  const exact = actualKeys.find(k => keywords.includes(k.trim()));
  if (exact) return exact;

  // 2. Try partial match (key contains keyword)
  return actualKeys.find(k => keywords.some(w => k.includes(w)));
};

export const processExcelFiles = async (files: File[]): Promise<{ data: ProcessedMailItem[], stats: FilterStats }> => {
  let allRows: ProcessedMailItem[] = [];
  let stats: FilterStats = {
    totalRows: 0,
    cainiaoRows: 0,
    excludedRows: 0,
    finalCount: 0,
    deliveryStats: {
      address: 0,
      station: 0,
      redelivery: 0,
      returned: 0,
      exception: 0
    },
    courierStats: [],
    detectedHeaders: [],
    missingRequiredColumns: []
  };

  for (const file of files) {
    const { rows, headers } = await parseFile(file);
    
    // Store headers from the first file for debugging
    if (stats.detectedHeaders.length === 0) {
      stats.detectedHeaders = headers;
    }

    const processed = processRows(rows, headers, stats);
    allRows = [...allRows, ...processed];
  }

  // --- Calculate Courier Statistics ---
  // We do this after collecting all filtered rows to get a global view
  // Key: Courier Name, Value: Array of tracking numbers
  const courierMap: Record<string, string[]> = {};
  
  allRows.forEach(row => {
    // If courier name is empty, categorize as "未指定"
    const name = row.courier ? row.courier : '未指定';
    
    if (!courierMap[name]) {
      courierMap[name] = [];
    }
    courierMap[name].push(row.trackingNumber);
  });

  // Convert map to array and sort by count descending
  stats.courierStats = Object.entries(courierMap)
    .map(([name, trackingNumbers]) => ({ 
      name, 
      count: trackingNumbers.length,
      trackingNumbers: trackingNumbers
    }))
    .sort((a, b) => b.count - a.count);

  stats.finalCount = allRows.length;
  return { data: allRows, stats };
};

const parseFile = (file: File): Promise<{ rows: RawMailRow[], headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // raw: false ensures everything is treated as formatted text (fixes scientific notation issues)
        const jsonData = XLSX.utils.sheet_to_json<RawMailRow>(worksheet, { raw: false, defval: "" });
        
        // Extract headers from the first row if available
        let headers: string[] = [];
        if (jsonData.length > 0) {
          headers = Object.keys(jsonData[0]);
        }

        resolve({ rows: jsonData, headers });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

const processRows = (rows: RawMailRow[], availableHeaders: string[], stats: FilterStats): ProcessedMailItem[] => {
  stats.totalRows += rows.length;
  const filtered: ProcessedMailItem[] = [];

  // Map columns dynamically based on this file's headers
  const keyTracking = findBestKey(availableHeaders, KEYWORDS.TRACKING);
  const keyInstitution = findBestKey(availableHeaders, KEYWORDS.INSTITUTION);
  const keyAddress = findBestKey(availableHeaders, KEYWORDS.ADDRESS);
  const keyTime = findBestKey(availableHeaders, KEYWORDS.TIME);
  const keyCourier = findBestKey(availableHeaders, KEYWORDS.COURIER);
  const keySign = findBestKey(availableHeaders, KEYWORDS.SIGN_METHOD);
  const keyFeedback = findBestKey(availableHeaders, KEYWORDS.FEEDBACK);

  // Check for critical missing columns
  if (!keyTracking && !stats.missingRequiredColumns.includes('邮件号')) stats.missingRequiredColumns.push('邮件号');
  if (!keyInstitution && !stats.missingRequiredColumns.includes('收寄机构')) stats.missingRequiredColumns.push('收寄机构');

  // If we can't find the tracking number column, we can't process this file
  if (!keyTracking) return [];

  for (const row of rows) {
    const trackingNumberRaw = row[keyTracking];
    const originInstitutionRaw = keyInstitution ? row[keyInstitution] : '';

    const trackingNumber = String(trackingNumberRaw || '').trim();
    const originInstitution = String(originInstitutionRaw || '').trim();

    // 1. Identification Logic (Cainiao)
    const isCainiao = trackingNumber.length >= 2 && 
      trackingNumber.startsWith('13') && 
      (trackingNumber.endsWith('16') || 
       trackingNumber.endsWith('31') || 
       trackingNumber.endsWith('32') || 
       trackingNumber.endsWith('34'));

    if (isCainiao) {
      stats.cainiaoRows++;

      // 2. Exclusion Logic
      let isExcluded = false;
      if (originInstitution) {
        isExcluded = EXCLUDED_KEYWORDS.some(keyword => originInstitution.includes(keyword));
      }

      if (isExcluded) {
        stats.excludedRows++;
      } else {
        // 3. Extraction
        const recipientAddress = keyAddress ? String(row[keyAddress] || '').trim() : '';
        const receptionTime = keyTime ? String(row[keyTime] || '').trim() : '';
        const courier = keyCourier ? String(row[keyCourier] || '').trim() : '';
        const signMethod = keySign ? String(row[keySign] || '').trim() : '';
        const feedback = keyFeedback ? String(row[keyFeedback] || '').trim() : '';

        // 4. Statistics Calculation
        const combinedInfo = (signMethod + feedback);
        
        // Rule 1: Returned (退回)
        if (combinedInfo.includes('退回') || combinedInfo.includes('退收')) {
          stats.deliveryStats.returned++;
        }
        // Rule 2: Exception (异常)
        else if (combinedInfo.includes('异常')) {
          stats.deliveryStats.exception++;
        }
        // Rule 3: Redelivery (再投)
        // Logic: Includes '留存', '未妥投', '未反馈', or if feedback is empty/null
        else if (feedback.includes('留存') || feedback.includes('未妥投') || feedback.includes('再投') || feedback.includes('未反馈') || feedback.trim() === '') {
          stats.deliveryStats.redelivery++;
        }
        // Rule 4: Station Delivery (驿站)
        // Logic: Includes '物业', '自提', '收发室', '包裹柜', '驿站', '丰巢'
        else if (signMethod.includes('物业') || signMethod.includes('自提') || signMethod.includes('收发室') || signMethod.includes('包裹柜') || signMethod.includes('柜') || signMethod.includes('驿站') || signMethod.includes('丰巢')) {
          stats.deliveryStats.station++;
        }
        // Rule 5: Address Delivery (按址)
        // Logic: Includes '本人', '他人', '家门口'
        else if (signMethod.includes('本人') || signMethod.includes('他人') || signMethod.includes('家门口') || signMethod.includes('门口') || signMethod.includes('按址')) {
          stats.deliveryStats.address++;
        } 
        // Fallback: If it says '妥投' but didn't match specific sign methods, default to Address (assumed standard delivery)
        else if (feedback.includes('妥投')) {
             stats.deliveryStats.address++;
        } else {
             // Fallback for completely unknown states
             stats.deliveryStats.address++;
        }

        filtered.push({
          id: Math.random().toString(36).substr(2, 9),
          trackingNumber,
          recipientAddress,
          receptionTime,
          courier,
          signMethod,
          feedback,
          originInstitution
        });
      }
    }
  }

  return filtered;
};

export const exportToExcel = (data: ProcessedMailItem[], fileName: string = '菜鸟邮件汇总.xlsx') => {
  const exportData = data.map(item => ({
    '邮件号': item.trackingNumber,
    '收件人地址': item.recipientAddress,
    '邮件接收时间': item.receptionTime,
    '投递员': item.courier,
    '签收方式': item.signMethod,
    '反馈情况': item.feedback,
    '原收寄机构': item.originInstitution // Included for verification
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "汇总数据");
  XLSX.writeFile(workbook, fileName);
};
