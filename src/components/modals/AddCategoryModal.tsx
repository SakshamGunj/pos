import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { MenuCategory } from '../../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingCategory?: MenuCategory | null;
  existingCategories?: MenuCategory[];
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCategory,
  existingCategories,
}) => {
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState('');
  const [color, setColor] = useState('#6366F1'); // Default to primary color

  // Reset form when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      if (existingCategory) {
        // If editing existing category, populate form with its values
        setName(existingCategory.name);
        setDisplayOrder(existingCategory.displayOrder.toString());
        setColor(existingCategory.color || '#6366F1');
      } else {
        // If creating new category, reset form
        setName('');
        // Set display order to the next available number
        const nextOrder = existingCategories && existingCategories.length > 0 
          ? Math.max(...existingCategories.map(c => c.displayOrder)) + 1 
          : 1;
        setDisplayOrder(nextOrder.toString());
        setColor('#6366F1');
      }
    }
  }, [isOpen, existingCategory, existingCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !displayOrder) {
      alert('Please fill in all required fields');
      return;
    }

    const newCategory: Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      displayOrder: parseInt(displayOrder),
      color,
    };

    onSave(newCategory);
    onClose();
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
            <h3 className="text-lg font-medium text-gray-900" id="modal-headline">Add Category</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              />
            </div>



            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">Display Order *</label>
              <input
                type="number"
                id="displayOrder"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                min="1"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Lower numbers will appear first</p>
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
              <div className="mt-1 flex items-center">
                <input
                  type="color"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                <span className="ml-2 text-sm text-gray-500">{color}</span>
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

export default AddCategoryModal;
