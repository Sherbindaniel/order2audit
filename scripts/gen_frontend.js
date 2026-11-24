const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../frontend/src');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created frontend file:', relPath);
}

// 1. types/index.ts
writeFile('types/index.ts', `
export type Role = 'OWNER' | 'ADMIN' | 'SALESMAN' | 'PRODUCTION_SUPERVISOR' | 'ACCOUNTANT';
export type OrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INVOICED' | 'PARTIALLY_DISPATCHED' | 'DISPATCHED' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type GstType = 'INTRA_STATE' | 'INTER_STATE';
export type ItemType = 'RAW_MATERIAL' | 'PACKAGING_MATERIAL' | 'FINISHED_GOOD';
export type UnitOfMeasure = 'KG' | 'G' | 'L' | 'ML' | 'PIECE' | 'PACKET' | 'CARTON';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  token?: string;
}

export interface Customer {
  id: number;
  name: string;
  customerType: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state: string;
  stateCode: string;
  pincode?: string;
  gstin?: string;
  creditLimit?: number;
  assignedSalesmanId?: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  packSize: number;
  packUnit: string;
  hsnCode: string;
  gstRate: number;
  sellingPrice: number;
  mrp?: number;
  active: boolean;
}

export interface SalesOrderItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock?: number;
  shortageQuantity?: number;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerState: string;
  customerStateCode: string;
  salesmanId: number;
  salesmanName: string;
  orderDate: string;
  status: OrderStatus;
  rejectionReason?: string;
  totalAmount: number;
  notes?: string;
  items: SalesOrderItem[];
}

export interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  salesOrderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerGstin?: string;
  invoiceDate: string;
  financialYear: string;
  gstType: GstType;
  subtotal: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export interface StockBalance {
  id: number;
  name: string;
  code: string;
  itemType: ItemType;
  unit: UnitOfMeasure;
  currentStock: number;
  reorderLevel: number;
  lowStock: boolean;
  isProduct: boolean;
}

export interface StockLedgerEntry {
  id: number;
  date: string;
  movementType: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  sourceType: string;
  referenceNumber: string;
  notes: string;
  runningBalance: number;
}

export interface BomItem {
  id: number;
  inventoryItemId: number;
  inventoryItemName: string;
  itemType: ItemType;
  quantity: number;
  unit: UnitOfMeasure;
}

export interface Bom {
  id: number;
  productId: number;
  productName: string;
  version: number;
  batchSize: number;
  batchUnit: UnitOfMeasure;
  expectedOutput: number;
  outputUnit: UnitOfMeasure;
  active: boolean;
  items: BomItem[];
}

export interface MaterialIssue {
  id: number;
  inventoryItemId: number;
  inventoryItemName: string;
  itemType: ItemType;
  plannedQuantity: number;
  actualQuantity: number;
  damagedQuantity: number;
  unit: UnitOfMeasure;
  unitCost: number;
  totalCost: number;
  varianceQuantity: number;
  variancePercentage: number;
  withinTolerance: boolean;
}

export interface ProductionRun {
  id: number;
  runNumber: string;
  productId: number;
  productName: string;
  bomId: number;
  bomVersion: number;
  batchMultiplier: number;
  plannedOutput: number;
  actualGoodOutput: number;
  damagedOutput: number;
  wastageQuantity: number;
  status: string;
  productionDate: string;
  labourCost: number;
  gasPowerCost: number;
  otherOverheadCost: number;
  totalMaterialCost: number;
  totalPackagingCost: number;
  totalProductionCost: number;
  costPerPacket: number;
  yieldVariancePercentage: number;
  materialIssues: MaterialIssue[];
}

export interface Payment {
  id: number;
  paymentNumber: string;
  customerId: number;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface Outstanding {
  customerId: number;
  customerName: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  bucket0_30: number;
  bucket31_60: number;
  bucket61_90: number;
  bucketOver90: number;
}

export interface Costing {
  runId: number;
  runNumber: string;
  productName: string;
  rawMaterials: { materialName: string; quantity: number; unit: string; unitCost: number; totalCost: number; }[];
  packagingMaterials: { materialName: string; quantity: number; unit: string; unitCost: number; totalCost: number; }[];
  totalMaterialCost: number;
  totalPackagingCost: number;
  labourCost: number;
  gasPowerCost: number;
  otherOverheadCost: number;
  totalProductionCost: number;
  actualGoodOutput: number;
  costPerPacket: number;
  sellingPrice: number;
  grossMargin: number;
  marginPercentage: number;
}
`);

// 2. api/client.ts
writeFile('api/client.ts', `
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
`);

// 3. context/AuthContext.tsx
writeFile('context/AuthContext.tsx', `
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`);

console.log('Frontend core setup files generated!');

