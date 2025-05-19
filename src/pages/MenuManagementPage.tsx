import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, 
  PencilIcon, TrashIcon, TagIcon, CheckCircleIcon, XCircleIcon,
  ChevronRightIcon, ChevronDownIcon, AdjustmentsHorizontalIcon,
  DocumentDuplicateIcon, CurrencyDollarIcon, ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { 
  MenuItem, MenuCategory, MenuItemStatus, MenuItemTag, 
  VariantGroup, AddOnGroup, ComboMeal 
} from '../types';

// Import Firebase services
import {
  getMenuItems, getCategories, getVariantGroups, getAddOnGroups, getComboMeals,
  addMenuItem, updateMenuItem, deleteMenuItem, permanentlyDeleteMenuItem,
  addCategory, updateCategory, deleteCategory,
  addVariantGroup, updateVariantGroup, deleteVariantGroup,
  addAddOnGroup, updateAddOnGroup, deleteAddOnGroup,
  addComboMeal, updateComboMeal, deleteComboMeal, permanentlyDeleteComboMeal,
  uploadMenuItemImage, uploadCategoryImage, uploadComboMealImage
} from '../firebase/services/menuService';

// Import modal components
import AddMenuItemModal from '../components/modals/AddMenuItemModal';
import AddCategoryModal from '../components/modals/AddCategoryModal';
import AddComboModal from '../components/modals/AddComboModal';
import VariantGroupModal from '../components/modals/VariantGroupModal';
import AddOnGroupModal from '../components/modals/AddOnGroupModal';
import BulkMenuUploadModal from '../components/modals/BulkMenuUploadModal';

// Available tags for menu items
const availableTags: MenuItemTag[] = ['bestseller', 'new', 'vegetarian', 'vegan', 'spicy', 'gluten-free', 'hot', 'cold'];

// Define view modes for the menu management page
type ViewMode = 'items' | 'categories' | 'combos' | 'variants';

const MenuManagementPage: React.FC = () => {
  // State for view mode, search, and filters
  const [viewMode, setViewMode] = useState<ViewMode>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<MenuItemStatus | 'All'>('All');
  const [selectedTag, setSelectedTag] = useState<MenuItemTag | 'All'>('All');
  
  // State for menu items, categories, and combos
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [combos, setCombos] = useState<ComboMeal[]>([]);
  
  // State for modals
  const [isAddMenuItemModalOpen, setIsAddMenuItemModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddComboModalOpen, setIsAddComboModalOpen] = useState(false);
  const [isVariantGroupModalOpen, setIsVariantGroupModalOpen] = useState(false);
  const [isAddOnGroupModalOpen, setIsAddOnGroupModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  
  // State for editing items
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCombo, setEditingCombo] = useState<ComboMeal | null>(null);
  const [editingVariantGroup, setEditingVariantGroup] = useState<VariantGroup | null>(null);
  const [editingAddOnGroup, setEditingAddOnGroup] = useState<AddOnGroup | null>(null);
  
  // State for variant groups and add-on groups
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [addOnGroups, setAddOnGroups] = useState<AddOnGroup[]>([]);
  
  // Available tags for menu items
  const availableTags: MenuItemTag[] = ['bestseller', 'new', 'vegetarian', 'vegan', 'spicy', 'gluten-free', 'hot', 'cold'];
  
  // Fetch data from Firebase when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [menuItemsData, categoriesData, combosData, variantGroupsData, addOnGroupsData] = await Promise.all([
          getMenuItems(),
          getCategories(),
          getComboMeals(),
          getVariantGroups(),
          getAddOnGroups()
        ]);
        
        // Update state with fetched data
        setMenuItems(menuItemsData);
        setCategories(categoriesData);
        setCombos(combosData);
        setVariantGroups(variantGroupsData);
        setAddOnGroups(addOnGroupsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Dashboard statistics
  const stats = useMemo(() => {
    return {
      totalItems: menuItems.length,
      totalCategories: categories.length,
      totalCombos: combos.length,
      activeItems: menuItems.filter(item => item.status === 'active').length,
      inactiveItems: menuItems.filter(item => item.status === 'inactive').length,
    };
  }, [menuItems, categories, combos]);
  
  // Filtered menu items based on search and filters
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      const matchesTag = selectedTag === 'All' || item.tags.includes(selectedTag);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesTag;
    });
  }, [menuItems, searchTerm, selectedCategory, selectedStatus, selectedTag]);
  
  // Filtered combos based on search
  const filteredCombos = useMemo(() => {
    return combos.filter(combo => {
      return combo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (combo.description && combo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            combo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [combos, searchTerm]);

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };
  
  // Toggle menu item status (active/inactive)
  const toggleItemStatus = async (itemId: string) => {
    try {
      const item = menuItems.find(item => item.id === itemId);
      if (!item) return;
      
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      await updateMenuItem(itemId, { status: newStatus });
      
      // Update local state
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? 
            { ...item, status: newStatus } : 
            item
        )
      );
    } catch (error) {
      console.error('Error toggling item status:', error);
      alert('Failed to update item status. Please try again.');
    }
  };
  
  // Delete menu item (soft delete)
  const handleDeleteMenuItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item? This can be undone later.')) {
      try {
        // Call the Firebase service function
        await deleteMenuItem(itemId);
        
        // Update local state
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId ? 
              { ...item, status: 'deleted', deletedAt: new Date() } : 
              item
          )
        );
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };
  
  // Delete category
  const handleDeleteCategory = async (categoryId: string) => {
    // Check if category is in use
    const itemsInCategory = menuItems.filter(item => item.category === categoryId);
    
    if (itemsInCategory.length > 0) {
      if (window.confirm(`This category contains ${itemsInCategory.length} items. Would you like to reassign them to another category?`)) {
        // TODO: Implement category reassignment logic
        alert('Category reassignment feature coming soon.');
        return;
      }
    }
    
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        // Call Firebase service function
        await deleteCategory(categoryId);
        
        // Update local state
        setCategories(prevCategories => prevCategories.filter(cat => cat.id !== categoryId));
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };
  
  // Delete combo
  const handleDeleteCombo = async (comboId: string) => {
    if (window.confirm('Are you sure you want to delete this combo?')) {
      try {
        // Call Firebase service function
        await deleteComboMeal(comboId);
        
        // Update local state
        setCombos(prevCombos => prevCombos.filter(combo => combo.id !== comboId));
      } catch (error) {
        console.error('Error deleting combo:', error);
        alert('Failed to delete combo. Please try again.');
      }
    }
  };
  
  // Delete variant group
  const handleDeleteVariantGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this variant group?')) {
      try {
        // Call Firebase service function
        await deleteVariantGroup(groupId);
        
        // Update local state
        setVariantGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
      } catch (error) {
        console.error('Error deleting variant group:', error);
        alert('Failed to delete variant group. Please try again.');
      }
    }
  };
  
  // Delete add-on group
  const handleDeleteAddOnGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this add-on group?')) {
      try {
        // Call Firebase service function
        await deleteAddOnGroup(groupId);
        
        // Update local state
        setAddOnGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
      } catch (error) {
        console.error('Error deleting add-on group:', error);
        alert('Failed to delete add-on group. Please try again.');
      }
    }
  };
  
  // Duplicate combo
  const duplicateCombo = (comboId: string) => {
    const combo = combos.find(c => c.id === comboId);
    if (!combo) return;
    
    const newCombo: ComboMeal = {
      ...combo,
      id: `COMBO${Date.now()}`,
      name: `${combo.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCombos([...combos, newCombo]);
  };
  
  // Render tab buttons for switching between view modes
  const renderTabButtons = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => setViewMode('items')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'items' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-primary hover:bg-white/60'
        }`}
      >
        Menu Items
      </button>
      <button
        onClick={() => setViewMode('categories')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'categories' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-primary hover:bg-white/60'
        }`}
      >
        Categories
      </button>
      <button
        onClick={() => setViewMode('combos')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'combos' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-primary hover:bg-white/60'
        }`}
      >
        Combos & Deals
      </button>
      <button
        onClick={() => setViewMode('variants')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'variants' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-primary hover:bg-white/60'
        }`}
      >
        Variants & Add-ons
      </button>
    </div>
  );
  
  // Render dashboard stats
  const renderDashboardStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Items</h3>
        <p className="text-2xl font-bold text-primary">{stats.totalItems}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Categories</h3>
        <p className="text-2xl font-bold text-primary">{stats.totalCategories}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Combo Meals</h3>
        <p className="text-2xl font-bold text-primary">{stats.totalCombos}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Active Items</h3>
        <p className="text-2xl font-bold text-green-500">{stats.activeItems}</p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Unavailable</h3>
        <p className="text-2xl font-bold text-amber-500">{stats.inactiveItems}</p>
      </div>
    </div>
  );
  
  // Render action buttons
  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {viewMode === 'items' && (
        <button
          onClick={() => setIsAddMenuItemModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Menu Item</span>
        </button>
      )}
      {viewMode === 'categories' && (
        <button
          onClick={() => setIsAddCategoryModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Category</span>
        </button>
      )}
      {viewMode === 'combos' && (
        <button
          onClick={() => setIsAddComboModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Combo</span>
        </button>
      )}
      {viewMode === 'items' && (
        <button
          onClick={() => setIsBulkUploadModalOpen(true)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          <span>Bulk Import</span>
        </button>
      )}
    </div>
  );
  
  // Render search and filter bar
  const renderSearchAndFilter = () => (
    <div className="bg-white p-4 rounded-xl shadow-md mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        
        {viewMode === 'items' && (
          <>
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              >
                <option value="All">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as MenuItemStatus | 'All')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </>
        )}
        
        <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          <span>More Filters</span>
        </button>
      </div>
    </div>
  );
  
  // Render menu items list
  const renderMenuItems = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMenuItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.imageUrl && (
                      <div className="flex-shrink-0 h-10 w-10 mr-3">
                        <img className="h-10 w-10 rounded-md object-cover" src={item.imageUrl} alt={item.name} />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getCategoryName(item.category)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                  {item.costPrice && (
                    <div className="text-xs text-gray-500">Cost: ${item.costPrice.toFixed(2)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => toggleItemStatus(item.id)}
                      className={`p-1.5 rounded-md ${
                        item.status === 'active' ? 'text-yellow-600 hover:bg-yellow-100' : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={item.status === 'active' ? 'Mark as inactive' : 'Mark as active'}
                    >
                      {item.status === 'active' ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingMenuItem(item);
                        setIsAddMenuItemModalOpen(true);
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md" 
                      title="Edit item"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"
                      title="Delete item"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Render categories list
  const renderCategories = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(category => (
        <div key={category.id} className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500">Display Order: {category.displayOrder}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                setEditingCategory(category);
                setIsAddCategoryModalOpen(true);
              }}
              className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md" 
              title="Edit category"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => handleDeleteCategory(category.id)}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded-md" 
              title="Delete category"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Render combos list
  const renderCombos = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredCombos.map(combo => (
        <div key={combo.id} className="bg-white rounded-xl shadow-md overflow-hidden">
          {combo.imageUrl && (
            <div className="w-full h-48 bg-gray-200">
              <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{combo.name}</h3>
                {combo.description && <p className="text-sm text-gray-500 mt-1">{combo.description}</p>}
              </div>
              <div className="text-xl font-bold text-primary">${combo.price.toFixed(2)}</div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Included Items:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {combo.items.map(item => {
                  const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                  return menuItem ? (
                    <li key={item.id} className="flex items-center">
                      <span className="mr-2">{item.quantity}x</span>
                      <span>{menuItem.name}</span>
                    </li>
                  ) : null;
                })}
                {combo.categoryChoices?.map(choice => (
                  <li key={choice.id} className="flex items-center text-indigo-600">
                    <span>{choice.name} ({choice.minSelections}-{choice.maxSelections})</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setEditingCombo(combo);
                  setIsAddComboModalOpen(true);
                }}
                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md" 
                title="Edit combo"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => duplicateCombo(combo.id)}
                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md" 
                title="Duplicate combo"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleDeleteCombo(combo.id)}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-md" 
                title="Delete combo"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Handlers for saving new items
  const handleSaveMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingMenuItem) {
        // Update existing item in Firebase
        await updateMenuItem(editingMenuItem.id, menuItem);
        
        // Update local state
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.id === editingMenuItem.id ? 
              { 
                ...item, 
                ...menuItem, 
                updatedAt: new Date() 
              } : 
              item
          )
        );
        setEditingMenuItem(null);
      } else {
        // Add new item to Firebase
        const newItem = await addMenuItem(menuItem);
        
        // Update local state
        setMenuItems(prevItems => [...prevItems, newItem]);
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item. Please try again.');
    }
  };

  const handleSaveCategory = async (category: Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingCategory) {
        // Update existing category in Firebase
        await updateCategory(editingCategory.id, category);
        
        // Update local state
        setCategories(prevCategories => 
          prevCategories.map(cat => 
            cat.id === editingCategory.id ? 
              { 
                ...cat, 
                ...category, 
                updatedAt: new Date() 
              } : 
              cat
          )
        );
        setEditingCategory(null);
      } else {
        // Add new category to Firebase
        const newCategory = await addCategory(category);
        
        // Update local state
        setCategories(prevCategories => [...prevCategories, newCategory]);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleSaveCombo = async (combo: Omit<ComboMeal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingCombo) {
        // Update existing combo in Firebase
        await updateComboMeal(editingCombo.id, combo);
        
        // Update local state
        setCombos(prevCombos => 
          prevCombos.map(c => 
            c.id === editingCombo.id ? 
              { 
                ...c, 
                ...combo, 
                updatedAt: new Date() 
              } : 
              c
          )
        );
        setEditingCombo(null);
      } else {
        // Add new combo to Firebase
        const newCombo = await addComboMeal(combo);
        
        // Update local state
        setCombos(prevCombos => [...prevCombos, newCombo]);
      }
    } catch (error) {
      console.error('Error saving combo:', error);
      alert('Failed to save combo. Please try again.');
    }
  };

  const handleSaveVariantGroup = async (group: Omit<VariantGroup, 'id'>) => {
    try {
      if (editingVariantGroup) {
        // Update existing variant group in Firebase
        await updateVariantGroup(editingVariantGroup.id, group);
        
        // Update local state
        setVariantGroups(prevGroups => 
          prevGroups.map(g => 
            g.id === editingVariantGroup.id ? 
              { 
                ...g, 
                ...group 
              } : 
              g
          )
        );
        setEditingVariantGroup(null);
      } else {
        // Add new variant group to Firebase
        const newGroup = await addVariantGroup(group);
        
        // Update local state
        setVariantGroups(prevGroups => [...prevGroups, newGroup]);
      }
    } catch (error) {
      console.error('Error saving variant group:', error);
      alert('Failed to save variant group. Please try again.');
    }
  };

  const handleSaveAddOnGroup = async (group: Omit<AddOnGroup, 'id'>) => {
    try {
      if (editingAddOnGroup) {
        // Update existing add-on group in Firebase
        await updateAddOnGroup(editingAddOnGroup.id, group);
        
        // Update local state
        setAddOnGroups(prevGroups => 
          prevGroups.map(g => 
            g.id === editingAddOnGroup.id ? 
              { 
                ...g, 
                ...group 
              } : 
              g
          )
        );
        setEditingAddOnGroup(null);
      } else {
        // Add new add-on group to Firebase
        const newGroup = await addAddOnGroup(group);
        
        // Update local state
        setAddOnGroups(prevGroups => [...prevGroups, newGroup]);
      }
    } catch (error) {
      console.error('Error saving add-on group:', error);
      alert('Failed to save add-on group. Please try again.');
    }
  };

  // Render variants and add-ons section
  const renderVariantsAndAddons = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Variant Groups</h3>
          <button 
            onClick={() => {
              setEditingVariantGroup(null);
              setIsVariantGroupModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Variant Group</span>
          </button>
        </div>
        
        {variantGroups.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No variant groups created yet. Add your first variant group like sizes or options.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {variantGroups.map(group => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-500">
                      {group.required ? 'Required' : 'Optional'} · 
                      {group.minSelections}-{group.maxSelections} selections
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => {
                        setEditingVariantGroup(group);
                        setIsVariantGroupModalOpen(true);
                      }}
                      className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteVariantGroup(group.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Options:</p>
                  <div className="flex flex-wrap gap-1">
                    {group.options.map((option, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {option.name}
                        {option.priceAdjustment > 0 && <span className="ml-1 text-gray-500">+${option.priceAdjustment.toFixed(2)}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Add-on Groups</h3>
          <button 
            onClick={() => {
              setEditingAddOnGroup(null);
              setIsAddOnGroupModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Add-on Group</span>
          </button>
        </div>
        
        {addOnGroups.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No add-on groups created yet. Add your first add-on group like toppings or extras.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOnGroups.map(group => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-500">
                      {group.multiSelect ? 'Multiple' : 'Single'} selection · 
                      {group.required ? 'Required' : 'Optional'}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => {
                        setEditingAddOnGroup(group);
                        setIsAddOnGroupModalOpen(true);
                      }}
                      className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAddOnGroup(group.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Items:</p>
                  <div className="flex flex-wrap gap-1">
                    {group.items.map((item, index) => (
                      <span 
                        key={index} 
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${item.available ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-400 line-through'}`}
                      >
                        {item.name}
                        <span className="ml-1 text-gray-500">${item.price.toFixed(2)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  // Main render
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral mb-2">Menu Management</h1>
        <p className="text-gray-500">Create and manage your restaurant's menu items, categories, and combos.</p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading menu data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {renderDashboardStats()}
          
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {renderTabButtons()}
            {renderActionButtons()}
          </div>
          
          {renderSearchAndFilter()}
          
          {viewMode === 'items' && renderMenuItems()}
          {viewMode === 'categories' && renderCategories()}
          {viewMode === 'combos' && renderCombos()}
          {viewMode === 'variants' && renderVariantsAndAddons()}
        </>
      )}

      {/* Modal Components */}
      <AddMenuItemModal
        isOpen={isAddMenuItemModalOpen}
        onClose={() => {
          setIsAddMenuItemModalOpen(false);
          setEditingMenuItem(null);
        }}
        onSave={handleSaveMenuItem}
        categories={categories}
        availableTags={availableTags}
        existingItem={editingMenuItem}
      />

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => {
          setIsAddCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        existingCategory={editingCategory}
        existingCategories={categories}
      />

      <AddComboModal
        isOpen={isAddComboModalOpen}
        onClose={() => {
          setIsAddComboModalOpen(false);
          setEditingCombo(null);
        }}
        onSave={handleSaveCombo}
        menuItems={menuItems}
        categories={categories}
        availableTags={availableTags}
      />

      <VariantGroupModal
        isOpen={isVariantGroupModalOpen}
        onClose={() => {
          setIsVariantGroupModalOpen(false);
          setEditingVariantGroup(null);
        }}
        onSave={handleSaveVariantGroup}
        existingGroup={editingVariantGroup}
      />

      <AddOnGroupModal
        isOpen={isAddOnGroupModalOpen}
        onClose={() => {
          setIsAddOnGroupModalOpen(false);
          setEditingAddOnGroup(null);
        }}
        onSave={handleSaveAddOnGroup}
        existingGroup={editingAddOnGroup}
      />

      <BulkMenuUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={() => {
          // Refresh menu items after successful upload
          const fetchMenuItems = async () => {
            try {
              const menuItemsData = await getMenuItems();
              setMenuItems(menuItemsData);
            } catch (err) {
              console.error('Error fetching menu items:', err);
            }
          };
          fetchMenuItems();
        }}
      />
    </div>
  );
};

export default MenuManagementPage;
