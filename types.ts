export interface RawMailRow {
  [key: string]: any;
}

export interface ProcessedMailItem {
  id: string; // Unique ID for keying
  trackingNumber: string; // 邮件号
  recipientAddress: string; // 收件人地址
  receptionTime: string; // 邮件接收时间
  courier: string; // 投递员
  signMethod: string; // 签收方式
  feedback: string; // 反馈情况
  originInstitution: string; // 收寄机构 (Keep for reference/debugging)
}

export interface FilterStats {
  totalRows: number;
  cainiaoRows: number;
  excludedRows: number;
  finalCount: number;
  // Delivery Breakdown
  deliveryStats: {
    address: number; // 按址投递
    station: number; // 驿站投递
    redelivery: number; // 再投
    returned: number; // 退回
    exception: number; // 异常
  };
  // Courier Breakdown
  courierStats: {
    name: string;
    count: number;
    trackingNumbers: string[]; // List of specific tracking numbers for this courier
  }[];
  // Debug info
  detectedHeaders: string[]; // Headers found in the first file
  missingRequiredColumns: string[]; // Critical columns not found
}
