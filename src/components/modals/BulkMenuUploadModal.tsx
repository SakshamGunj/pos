import React, { useState, useRef } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import * as XLSX from 'xlsx';
import { bulkAddMenuItems } from '../../firebase/services/menuService';
import { useNotification } from '../../contexts/NotificationContext';
import { MenuItem, InventoryUnit } from '../../types';

interface BulkMenuUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedMenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  imageUrl?: string;
  available: boolean;
  costPrice?: number;
  preparationTime?: number;
  inventoryAvailable?: boolean;
  inventoryUnit?: string;
  startingInventoryQuantity?: number;
  decrementPerOrder?: number;
  [key: string]: any; // For any additional fields
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const BulkMenuUploadModal: React.FC<BulkMenuUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parseErrors, setParseErrors] = useState<ValidationError[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedMenuItem[]>([]);
  const [uploadStep, setUploadStep] = useState<'select' | 'validate' | 'upload' | 'complete'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  const resetState = () => {
    setFile(null);
    setParseErrors([]);
    setParsedItems([]);
    setUploadStep('select');
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          showNotification('error', 'Failed to read file');
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        validateAndParse(jsonData);
      } catch (error) {
        console.error('Error parsing file:', error);
        showNotification('error', 'Failed to parse file. Please check the file format.');
      }
    };

    reader.onerror = () => {
      showNotification('error', 'Error reading file');
    };

    reader.readAsBinaryString(file);
  };

  const validateAndParse = (data: Record<string, any>[]) => {
    const errors: ValidationError[] = [];
    const items: ParsedMenuItem[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of 0-indexing and header row
      const item: ParsedMenuItem = {
        name: '',
        description: '',
        price: 0,
        category: '',
        tags: [],
        available: true,
      };

      // Required fields validation
      if (!row.name) {
        errors.push({ row: rowNumber, field: 'name', message: 'Name is required' });
      } else {
        item.name = String(row.name);
      }

      if (!row.price && row.price !== 0) {
        errors.push({ row: rowNumber, field: 'price', message: 'Price is required' });
      } else {
        const price = Number(row.price);
        if (isNaN(price) || price < 0) {
          errors.push({ row: rowNumber, field: 'price', message: 'Price must be a valid number' });
        } else {
          item.price = price;
        }
      }

      if (!row.category) {
        errors.push({ row: rowNumber, field: 'category', message: 'Category is required' });
      } else {
        item.category = String(row.category);
      }

      // Optional fields
      if (row.description) {
        item.description = String(row.description);
      } else {
        item.description = '';
      }

      if (row.tags) {
        // Handle tags as comma-separated string
        item.tags = String(row.tags).split(',').map(tag => tag.trim()).filter(Boolean);
      } else {
        item.tags = [];
      }

      if (row.imageUrl) {
        item.imageUrl = String(row.imageUrl);
      }

      if (row.available !== undefined) {
        item.available = row.available === true || row.available === 'true' || row.available === 1;
      } else {
        item.available = true;
      }

      if (row.costPrice !== undefined) {
        const costPrice = Number(row.costPrice);
        if (!isNaN(costPrice) && costPrice >= 0) {
          item.costPrice = costPrice;
        }
      }

      if (row.preparationTime !== undefined) {
        const prepTime = Number(row.preparationTime);
        if (!isNaN(prepTime) && prepTime >= 0) {
          item.preparationTime = prepTime;
        }
      }

      // Inventory fields
      if (row.inventoryAvailable !== undefined) {
        item.inventoryAvailable = row.inventoryAvailable === true || 
                                 row.inventoryAvailable === 'true' || 
                                 row.inventoryAvailable === 1;
      }

      if (row.inventoryUnit) {
        // Validate that it's a valid inventory unit
        const validUnits: InventoryUnit[] = ['piece', 'gram', 'kilogram', 'liter', 'milliliter', 'ounce', 'pound', 'cup', 'tablespoon', 'teaspoon'];
        const unit = String(row.inventoryUnit).toLowerCase();
        if (validUnits.includes(unit as InventoryUnit)) {
          item.inventoryUnit = unit as InventoryUnit;
        } else {
          item.inventoryUnit = 'piece';
        }
      }

      if (row.startingInventoryQuantity !== undefined) {
        const qty = Number(row.startingInventoryQuantity);
        if (!isNaN(qty) && qty >= 0) {
          item.startingInventoryQuantity = qty;
        }
      }

      if (row.decrementPerOrder !== undefined) {
        const decrement = Number(row.decrementPerOrder);
        if (!isNaN(decrement) && decrement >= 0) {
          item.decrementPerOrder = decrement;
        }
      }

      items.push(item);
    });

    setParseErrors(errors);
    setParsedItems(items);
    setUploadStep('validate');
  };

  const handleUpload = async () => {
    if (parsedItems.length === 0) {
      showNotification('error', 'No valid items to upload');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStep('upload');

      // Convert parsed items to MenuItem format
      const menuItems: Partial<MenuItem>[] = parsedItems.map(item => {
        const menuItem: Partial<MenuItem> = {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          tags: item.tags,
          imageUrl: item.imageUrl || '',
          costPrice: item.costPrice || 0,
          preparationTime: item.preparationTime || 5,
          inventoryAvailable: item.inventoryAvailable || false,
          startingInventoryQuantity: item.startingInventoryQuantity || 0,
          decrementPerOrder: item.decrementPerOrder || 1,
        };
        
        // Only add inventoryUnit if it's a valid InventoryUnit type
        if (item.inventoryUnit) {
          menuItem.inventoryUnit = item.inventoryUnit as InventoryUnit;
        }
        
        return menuItem;
      });

      await bulkAddMenuItems(menuItems);
      setUploadStep('complete');
      showNotification('success', `Successfully added ${menuItems.length} menu items`);
      
      // Wait a moment before closing to show success state
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error uploading menu items:', error);
      showNotification('error', 'Failed to upload menu items');
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        name: 'Chicken Biryani',
        description: 'Fragrant rice dish with chicken and spices',
        price: 250,
        category: 'Main Course',
        tags: 'rice,spicy,chicken',
        costPrice: 180,
        preparationTime: 15,
        inventoryAvailable: true,
        inventoryUnit: 'piece',
        startingInventoryQuantity: 50,
        decrementPerOrder: 1
      },
      {
        name: 'Masala Dosa',
        description: 'Crispy rice crepe with spiced potato filling',
        price: 120,
        category: 'Breakfast',
        tags: 'south indian,vegetarian',
        costPrice: 70,
        preparationTime: 10,
        inventoryAvailable: true,
        inventoryUnit: 'piece',
        startingInventoryQuantity: 100,
        decrementPerOrder: 1
      },
      {
        name: 'Mango Lassi',
        description: 'Sweet yogurt drink with mango pulp',
        price: 80,
        category: 'Beverages',
        tags: 'drink,sweet,cold',
        costPrice: 40,
        preparationTime: 5,
        inventoryAvailable: true,
        inventoryUnit: 'cup',
        startingInventoryQuantity: 30,
        decrementPerOrder: 1
      }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');

    // Generate and download file
    const fileName = 'menu_items_template.xlsx';
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    // Convert to blob and download
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Bulk Upload Menu Items</h3>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-2">
                  {uploadStep === 'select' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">Instructions</h4>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          <li>Upload a CSV or Excel file with menu items</li>
                          <li>Required fields: name, price, category</li>
                          <li>Optional fields: description, tags, imageUrl, etc.</li>
                          <li>For multiple tags, separate with commas</li>
                        </ul>
                      </div>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={downloadTemplate}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                          Download Template
                        </button>
                      </div>

                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            CSV, XLS, or XLSX up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadStep === 'validate' && (
                    <div>
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">File: {file?.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {parsedItems.length} items found
                          </span>
                          {parseErrors.length > 0 && (
                            <span className="text-sm text-red-500">
                              {parseErrors.length} errors found
                            </span>
                          )}
                        </div>
                      </div>

                      {parseErrors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-red-600 mb-2">Validation Errors</h4>
                          <div className="bg-red-50 p-3 rounded-md max-h-40 overflow-y-auto">
                            <ul className="text-xs text-red-700 space-y-1">
                              {parseErrors.map((error, index) => (
                                <li key={index}>
                                  Row {error.row}: {error.field} - {error.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <h4 className="font-medium text-gray-700">Preview</h4>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Price
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Category
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {parsedItems.slice(0, 5).map((item, index) => (
                                <tr key={index}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {item.name}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    ₹{item.price}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {item.category}
                                  </td>
                                </tr>
                              ))}
                              {parsedItems.length > 5 && (
                                <tr>
                                  <td colSpan={3} className="px-3 py-2 text-sm text-gray-500 text-center">
                                    ... and {parsedItems.length - 5} more items
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadStep === 'upload' && (
                    <div className="text-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-700">Uploading {parsedItems.length} menu items...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
                    </div>
                  )}

                  {uploadStep === 'complete' && (
                    <div className="text-center py-10">
                      <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-700">Successfully uploaded {parsedItems.length} menu items</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {uploadStep === 'select' && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-300 text-base font-medium text-gray-700 hover:bg-gray-400 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                disabled={true}
              >
                Next
              </button>
            )}

            {uploadStep === 'validate' && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleUpload}
                disabled={isUploading || parsedItems.length === 0}
              >
                Upload {parsedItems.length} Items
              </button>
            )}

            {(uploadStep === 'select' || uploadStep === 'validate') && (
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleClose}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkMenuUploadModal;
