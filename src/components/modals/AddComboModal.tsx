import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { ComboMeal, MenuItem, MenuCategory, MenuItemTag } from '../../types';

interface AddComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (combo: Omit<ComboMeal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  menuItems: MenuItem[];
  categories: MenuCategory[];
  availableTags: MenuItemTag[];
}

const AddComboModal: React.FC<AddComboModalProps> = ({
  isOpen,
  onClose,
  onSave,
  menuItems,
  categories,
  availableTags,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ menuItemId: string; quantity: number; isRequired: boolean }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<Array<{ categoryId: string; minSelections: number; maxSelections: number; name: string }>>([]);
  const [displayPriority, setDisplayPriority] = useState('1');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedTags, setSelectedTags] = useState<MenuItemTag[]>([]);

  // Reset form when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setSelectedItems([]);
      setSelectedCategories([]);
      setDisplayPriority('1');
      setStartTime('');
      setEndTime('');
      setStatus('active');
      setSelectedTags([]);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !price) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate that combo has at least one item or category choice
    if (selectedItems.length === 0 && selectedCategories.length === 0) {
      alert('Please add at least one item or category choice to the combo');
      return;
    }

    const newCombo: Omit<ComboMeal, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description: description || undefined,
      price: parseFloat(price),
      imageUrl: imageUrl || undefined,
      items: selectedItems.map((item, index) => ({
        id: `temp-${index}`, // This will be replaced with a real ID when saved
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        isRequired: item.isRequired,
      })),
      categoryChoices: selectedCategories.map((cat, index) => ({
        id: `temp-cat-${index}`, // This will be replaced with a real ID when saved
        name: cat.name,
        categoryId: cat.categoryId,
        minSelections: cat.minSelections,
        maxSelections: cat.maxSelections,
      })),
      displayPriority: parseInt(displayPriority),
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      status,
      tags: selectedTags,
    };

    onSave(newCombo);
    onClose();
  };

  const toggleTag = (tag: MenuItemTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addMenuItem = (menuItemId: string) => {
    // Check if item is already in the list
    if (selectedItems.some(item => item.menuItemId === menuItemId)) {
      alert('This item is already in the combo');
      return;
    }

    setSelectedItems([
      ...selectedItems,
      { menuItemId, quantity: 1, isRequired: true }
    ]);
  };

  const removeMenuItem = (menuItemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.menuItemId !== menuItemId));
  };

  const updateItemQuantity = (menuItemId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.menuItemId === menuItemId ? { ...item, quantity } : item
    ));
  };

  const toggleItemRequired = (menuItemId: string) => {
    setSelectedItems(selectedItems.map(item => 
      item.menuItemId === menuItemId ? { ...item, isRequired: !item.isRequired } : item
    ));
  };

  const addCategoryChoice = (categoryId: string) => {
    // Check if category is already in the list
    if (selectedCategories.some(cat => cat.categoryId === categoryId)) {
      alert('This category is already in the combo');
      return;
    }

    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    setSelectedCategories([
      ...selectedCategories,
      { 
        categoryId, 
        minSelections: 1, 
        maxSelections: 1, 
        name: `Choose your ${category.name.toLowerCase()}` 
      }
    ]);
  };

  const removeCategoryChoice = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(cat => cat.categoryId !== categoryId));
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    setSelectedCategories(selectedCategories.map(cat => 
      cat.categoryId === categoryId ? { ...cat, name } : cat
    ));
  };

  const updateCategorySelections = (categoryId: string, min: number, max: number) => {
    setSelectedCategories(selectedCategories.map(cat => 
      cat.categoryId === categoryId ? { ...cat, minSelections: min, maxSelections: max } : cat
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
          className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900" id="modal-headline">Create Combo Meal</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL</label>
              <div className="mt-1 flex items-center">
                <input
                  type="text"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="ml-2 h-10 w-10 object-cover rounded" />
                ) : (
                  <PhotoIcon className="ml-2 h-10 w-10 text-gray-300" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="displayPriority" className="block text-sm font-medium text-gray-700">Display Priority</label>
                <input
                  type="number"
                  id="displayPriority"
                  value={displayPriority}
                  onChange={(e) => setDisplayPriority(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  min="1"
                />
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedTags.includes(tag) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-b border-gray-200 py-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Combo Items</h4>
              
              {/* Selected items list */}
              {selectedItems.length > 0 && (
                <div className="mb-4 space-y-2">
                  {selectedItems.map((item) => {
                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                    if (!menuItem) return null;
                    
                    return (
                      <div key={item.menuItemId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center">
                          {menuItem.imageUrl && (
                            <img src={menuItem.imageUrl} alt={menuItem.name} className="h-8 w-8 object-cover rounded mr-2" />
                          )}
                          <span className="text-sm font-medium">{menuItem.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <button 
                              type="button" 
                              onClick={() => updateItemQuantity(item.menuItemId, Math.max(1, item.quantity - 1))}
                              className="text-gray-500 hover:text-gray-700 p-1"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <button 
                              type="button" 
                              onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                              className="text-gray-500 hover:text-gray-700 p-1"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => toggleItemRequired(item.menuItemId)}
                            className={`text-xs px-2 py-1 rounded ${item.isRequired ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {item.isRequired ? 'Required' : 'Optional'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => removeMenuItem(item.menuItemId)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add item dropdown */}
              <div className="flex">
                <select
                  className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  onChange={(e) => e.target.value && addMenuItem(e.target.value)}
                  value=""
                >
                  <option value="">Add an item...</option>
                  {menuItems
                    .filter(item => item.status === 'active')
                    .map(item => (
                      <option key={item.id} value={item.id}>{item.name} - ₹{item.price.toFixed(2)}</option>
                    ))}
                </select>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => {
                    const select = document.querySelector('select') as HTMLSelectElement;
                    if (select && select.value) {
                      addMenuItem(select.value);
                      select.value = '';
                    }
                  }}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-gray-200 py-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Category Choices</h4>
              
              {/* Selected categories list */}
              {selectedCategories.length > 0 && (
                <div className="mb-4 space-y-3">
                  {selectedCategories.map((cat) => {
                    const category = categories.find(c => c.id === cat.categoryId);
                    if (!category) return null;
                    
                    return (
                      <div key={cat.categoryId} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeCategoryChoice(cat.categoryId)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Display Name</label>
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => updateCategoryName(cat.categoryId, e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-500">Min</label>
                              <input
                                type="number"
                                value={cat.minSelections}
                                onChange={(e) => updateCategorySelections(cat.categoryId, parseInt(e.target.value), cat.maxSelections)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:outline-none focus:ring-primary focus:border-primary"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500">Max</label>
                              <input
                                type="number"
                                value={cat.maxSelections}
                                onChange={(e) => updateCategorySelections(cat.categoryId, cat.minSelections, parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:outline-none focus:ring-primary focus:border-primary"
                                min={cat.minSelections}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add category dropdown */}
              <div className="flex">
                <select
                  className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  onChange={(e) => e.target.value && addCategoryChoice(e.target.value)}
                  value=""
                >
                  <option value="">Add a category choice...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => {
                    const select = document.querySelectorAll('select')[1] as HTMLSelectElement;
                    if (select && select.value) {
                      addCategoryChoice(select.value);
                      select.value = '';
                    }
                  }}
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

export default AddComboModal;
