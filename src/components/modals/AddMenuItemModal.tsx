import React, { useState, useRef } from 'react';
import { XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { MenuItem, MenuItemTag, MenuCategory, InventoryUsage, InventoryUnit } from '../../types';
import InventoryTrackingSection from '../InventoryTrackingSection';
import { uploadMenuItemImage } from '../../firebase/services/menuService';

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: MenuCategory[];
  availableTags: MenuItemTag[];
  existingItem?: MenuItem | null;
}

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  availableTags,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<MenuItemTag[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [allergenInfo, setAllergenInfo] = useState('');
  const [ingredientNotes, setIngredientNotes] = useState('');
  // Inventory management state
  const [hasInventoryTracking, setHasInventoryTracking] = useState(false);
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsage[]>([]);
  const [inventoryAvailable, setInventoryAvailable] = useState(true);
  const [inventoryUnit, setInventoryUnit] = useState<InventoryUnit>('piece');
  const [startingInventory, setStartingInventory] = useState(0);
  const [decrementCounter, setDecrementCounter] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setPrice('');
      setCostPrice('');
      setCategory(categories.length > 0 ? categories[0].id : '');
      setSelectedTags([]);
      setImageUrl('');
      setImageFile(null);
      setUploadProgress(0);
      setStatus('active');
      setAllergenInfo('');
      setIngredientNotes('');
      // Reset inventory management state
      setHasInventoryTracking(false);
      setInventoryUsage([]);
      setInventoryAvailable(true);
      setInventoryUnit('piece');
      setStartingInventory(0);
      setDecrementCounter(1);
    }
  }, [isOpen, categories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !price || !category) {
      alert('Please fill in all required fields');
      return;
    }

    // Upload image if a new one was selected
    let finalImageUrl = imageUrl;
    if (imageFile) {
      setIsUploading(true);
      try {
        // Generate a temporary ID for the image upload
        const tempId = `temp_${Date.now()}`;
        finalImageUrl = await uploadMenuItemImage(imageFile, tempId);
        setIsUploading(false);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        setIsUploading(false);
        return;
      }
    }

    // Create menu item object
    const menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description: description || null,
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : null,
      category,
      imageUrl: finalImageUrl || null,
      tags: selectedTags,
      status: status === 'active' ? 'active' : 'inactive',
      variantGroups: null,
      addOnGroups: null,
      taxGroup: null,
      allergenInfo: allergenInfo || null,
      ingredientNotes: ingredientNotes || null,
      hasInventoryTracking: hasInventoryTracking,
      inventoryUsage: hasInventoryTracking ? inventoryUsage : null,
      inventoryAvailable: hasInventoryTracking ? inventoryAvailable : undefined,
      inventoryUnit: hasInventoryTracking ? inventoryUnit : undefined,
      startingInventoryQuantity: hasInventoryTracking ? startingInventory : undefined,
      decrementPerOrder: hasInventoryTracking ? decrementCounter : undefined,
      deletedAt: null,
      isPartOfCombo: false
    };

    // Save menu item
    onSave(menuItem);
    onClose();
  };

  const toggleTag = (tag: MenuItemTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
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
            <h3 className="text-lg font-medium text-gray-900" id="modal-headline">Add Menu Item</h3>
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
              <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">Item Image</label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  id="imageUpload"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Menu item preview"
                      className="h-32 w-32 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageFile(null);
                      }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <div className="flex flex-col items-center">
                      <ArrowUpTrayIcon className="h-8 w-8 text-gray-400" />
                      <span className="mt-2 text-xs text-gray-500">Upload Image</span>
                    </div>
                  </button>
                )}
                
                {/* Optional: Allow URL input as alternative */}
                <div className="ml-4 flex-1">
                  <label htmlFor="imageUrl" className="block text-xs font-medium text-gray-500">Or enter image URL</label>
                  <input
                    type="text"
                    id="imageUrl"
                    value={imageFile ? '' : imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageFile(null);
                    }}
                    disabled={!!imageFile}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Uploading image... {uploadProgress}%</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div>
                <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">Cost Price</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="costPrice"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
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

            {/* Allergen Information */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergen Information
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={allergenInfo}
                onChange={(e) => setAllergenInfo(e.target.value)}
                placeholder="Contains nuts, dairy, etc."
              />
            </div>

            {/* Ingredient Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredient Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={ingredientNotes}
                onChange={(e) => setIngredientNotes(e.target.value)}
                placeholder="Special preparation notes, ingredients list, etc."
              />
            </div>

            {/* Inventory Tracking Section */}
            <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <InventoryTrackingSection
                hasInventoryTracking={hasInventoryTracking}
                inventoryUsage={inventoryUsage}
                onInventoryTrackingChange={setHasInventoryTracking}
                onInventoryUsageChange={setInventoryUsage}
                inventoryAvailable={inventoryAvailable}
                onInventoryAvailableChange={setInventoryAvailable}
                inventoryUnit={inventoryUnit}
                onInventoryUnitChange={setInventoryUnit}
                startingInventory={startingInventory}
                onStartingInventoryChange={setStartingInventory}
                decrementCounter={decrementCounter}
                onDecrementCounterChange={setDecrementCounter}
              />
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

export default AddMenuItemModal;
