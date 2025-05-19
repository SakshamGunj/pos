import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AddOnGroup, AddOnItem } from '../../types';

interface AddOnGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addOnGroup: Omit<AddOnGroup, 'id'>) => void;
  existingGroup?: AddOnGroup | null; // For editing existing groups
}

const AddOnGroupModal: React.FC<AddOnGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingGroup,
}) => {
  const [name, setName] = useState('');
  const [items, setItems] = useState<Omit<AddOnItem, 'id'>[]>([]);
  const [multiSelect, setMultiSelect] = useState(true);
  const [required, setRequired] = useState(false);
  const [maxSelections, setMaxSelections] = useState<number | undefined>(undefined);
  const [minSelections, setMinSelections] = useState<number | undefined>(0);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Reset form when modal is opened or when editing an existing group
  useEffect(() => {
    if (isOpen) {
      if (existingGroup) {
        // Editing mode
        setName(existingGroup.name);
        setItems(existingGroup.items.map(item => ({
          name: item.name,
          price: item.price,
          available: item.available,
        })));
        setMultiSelect(existingGroup.multiSelect);
        setRequired(existingGroup.required);
        setMaxSelections(existingGroup.maxSelections);
        setMinSelections(existingGroup.minSelections);
      } else {
        // New group mode
        setName('');
        setItems([]);
        setMultiSelect(true);
        setRequired(false);
        setMaxSelections(undefined);
        setMinSelections(0);
      }
      setNewItemName('');
      setNewItemPrice('');
    }
  }, [isOpen, existingGroup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name) {
      alert('Please enter a name for the add-on group');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item to the add-on group');
      return;
    }

    const addOnGroup: Omit<AddOnGroup, 'id'> = {
      name,
      items: items.map((item, index) => ({
        id: existingGroup?.items[index]?.id || `temp-${index}`, // Keep existing IDs or use temp ones
        name: item.name,
        price: item.price,
        available: item.available,
      })),
      multiSelect,
      required,
      maxSelections: multiSelect ? maxSelections : 1,
      minSelections: required ? (minSelections || 1) : 0,
    };

    onSave(addOnGroup);
    onClose();
  };

  const addItem = () => {
    if (!newItemName) {
      alert('Please enter a name for the item');
      return;
    }

    const price = newItemPrice ? parseFloat(newItemPrice) : 0;

    setItems([...items, { name: newItemName, price, available: true }]);
    setNewItemName('');
    setNewItemPrice('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const toggleItemAvailability = (index: number) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, available: !item.available } : item
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900" id="modal-headline">
              {existingGroup ? 'Edit Add-on Group' : 'Add Add-on Group'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Group Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Toppings, Extra Cheese, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="multiSelect"
                  checked={multiSelect}
                  onChange={(e) => setMultiSelect(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="multiSelect" className="ml-2 block text-sm text-gray-700">
                  Allow multiple selections
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                  Required (customer must select at least one option)
                </label>
              </div>
            </div>

            {multiSelect && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minSelections" className="block text-sm font-medium text-gray-700">Min Selections</label>
                  <input
                    type="number"
                    id="minSelections"
                    value={minSelections !== undefined ? minSelections : ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setMinSelections(value);
                      if (value !== undefined && maxSelections !== undefined && value > maxSelections) {
                        setMaxSelections(value);
                      }
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    min="0"
                    max={items.length}
                    placeholder={required ? "1" : "0"}
                  />
                </div>
                <div>
                  <label htmlFor="maxSelections" className="block text-sm font-medium text-gray-700">Max Selections</label>
                  <input
                    type="number"
                    id="maxSelections"
                    value={maxSelections !== undefined ? maxSelections : ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setMaxSelections(value);
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    min={minSelections !== undefined ? minSelections : 0}
                    max={items.length || 1}
                    placeholder={items.length.toString()}
                  />
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Add-on Items</h4>
              
              {/* Items list */}
              {items.length > 0 && (
                <div className="mb-4 space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="ml-2 text-xs text-gray-500">₹{item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button" 
                          onClick={() => toggleItemAvailability(index)}
                          className={`text-xs px-2 py-1 rounded ${item.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {item.available ? 'Available' : 'Unavailable'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item form */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Item name"
                  />
                </div>
                <div className="w-24">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddOnGroupModal;
