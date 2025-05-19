import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, PaintBrushIcon, PrinterIcon, ServerIcon, UserCircleIcon, TableCellsIcon, UserGroupIcon, PlusCircleIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Table, TableArea } from '../types';
import { getAllTables, createTable, updateTable, deleteTable, checkTablesCollection } from '../firebase/services/tableService';

interface Employee {
  id: string;
  name: string;
  role: string;
  pin: string;
  isActive: boolean;
}

const emptyRestaurantDetails = {
  name: "",
  address: "",
  phone: "",
  defaultTaxRate: 0,
  currencySymbol: '$',
};

const availableTableAreas: TableArea[] = ['Main Dining', 'Patio', 'Bar', 'VIP Room', 'Counter'];
const employeeRoles = ['Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen Staff'];

// Employees will be managed in Firebase in the future

const SettingsPage: React.FC = () => {
  const [restaurantDetails, setRestaurantDetails] = useState(emptyRestaurantDetails);
  const handleRestaurantDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setRestaurantDetails(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if tables collection exists
        await checkTablesCollection();
        
        const fetchedTables = await getAllTables();
        setTables(fetchedTables);
      } catch (err) {
        console.error('Error fetching tables:', err);
        setError('Failed to load tables. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTables();
  }, []);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<Partial<Table> | null>(null);
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});

  const handleTableFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCurrentTable(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleSaveTable = async () => {
    if (!currentTable || !currentTable.name || !currentTable.area || !currentTable.capacity) return;
    
    try {
      setIsLoading(true);
      
      if (currentTable.id) {
        await updateTable(currentTable.id, currentTable as Partial<Table>);
        setTables(tables.map(t => t.id === currentTable.id ? { ...t, ...currentTable } as Table : t));
      } else {
        const newTable = await createTable({ 
          ...currentTable, 
          status: 'Available' 
        } as Omit<Table, 'id'>);
        
        setTables([...tables, newTable]);
      }
      
      closeTableModal();
    } catch (err) {
      console.error('Error saving table:', err);
      alert('Failed to save table. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openTableModal = (table?: Table) => {
    setCurrentTable(table || { name: '', area: availableTableAreas[0], capacity: 2, status: 'Available' });
    setIsTableModalOpen(true);
  };
  const closeTableModal = () => {
    setIsTableModalOpen(false);
    setCurrentTable(null);
  };
  const handleDeleteTable = async (tableId: string) => {
    try {
      setIsLoading(true);
      
      await deleteTable(tableId);
      
      setTables(tables.filter(t => t.id !== tableId));
    } catch (err) {
      console.error('Error deleting table:', err);
      alert('Failed to delete table. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);

  const handleEmployeeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

    setCurrentEmployee(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : (name === 'pin' && prev?.pin?.length === 4 && value.length > 4 ? prev.pin : value)
    }));
  };

  const handleSaveEmployee = () => {
    if (!currentEmployee || !currentEmployee.name || !currentEmployee.role || !currentEmployee.pin) return;
    if (currentEmployee.pin.length !== 4 || !/^\d{4}$/.test(currentEmployee.pin)) {
      alert("PIN must be exactly 4 digits.");
      return;
    }

    if (currentEmployee.id) {
      setEmployees(employees.map(emp => emp.id === currentEmployee!.id ? { ...emp, ...currentEmployee } as Employee : emp));
    } else {
      setEmployees([...employees, { ...currentEmployee, id: `E${employees.length + Math.random()}`, isActive: currentEmployee.isActive === undefined ? true : currentEmployee.isActive } as Employee]);
    }
    closeEmployeeModal();
  };

  const openEmployeeModal = (employee?: Employee) => {
    setCurrentEmployee(employee || { name: '', role: employeeRoles[0], pin: '', isActive: true });
    setIsEmployeeModalOpen(true);
  };
  const closeEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setCurrentEmployee(null);
  };
  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees(employees.filter(emp => emp.id !== employeeId));
  };
  const toggleShowPin = (employeeId: string) => {
    setShowPin(prev => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const handleSaveAllSettings = async () => {
    try {
      setIsLoading(true);
      
      console.log("Saving settings:", { restaurantDetails, tables, employees });
      
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-neutral mb-8 flex items-center">
        <Cog6ToothIcon className="h-8 w-8 mr-3 text-primary" />
        Settings
      </h1>
      
      <div className="space-y-10">
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-primary mb-5 flex items-center">
            <UserCircleIcon className="h-6 w-6 mr-2" /> Restaurant Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral mb-1">Restaurant Name</label>
              <input type="text" name="name" id="name" value={restaurantDetails.name} onChange={handleRestaurantDetailChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm" />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-neutral mb-1">Address</label>
              <input type="text" name="address" id="address" value={restaurantDetails.address} onChange={handleRestaurantDetailChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral mb-1">Phone Number</label>
              <input type="tel" name="phone" id="phone" value={restaurantDetails.phone} onChange={handleRestaurantDetailChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm" />
            </div>
            <div>
              <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-neutral mb-1">Default Tax Rate (%)</label>
              <input type="number" name="defaultTaxRate" id="defaultTaxRate" value={restaurantDetails.defaultTaxRate} onChange={handleRestaurantDetailChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm" />
            </div>
            <div>
              <label htmlFor="currencySymbol" className="block text-sm font-medium text-neutral mb-1">Currency Symbol</label>
              <input type="text" name="currencySymbol" id="currencySymbol" value={restaurantDetails.currencySymbol} onChange={handleRestaurantDetailChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm" />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-primary mb-5 flex items-center">
            <TableCellsIcon className="h-6 w-6 mr-2" /> Table Management
          </h2>
          <div className="flex justify-between items-center mb-5">
            <button 
              onClick={() => openTableModal()} 
              className="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition flex items-center text-sm font-medium"
              disabled={isLoading}
            >
              <PlusCircleIcon className="h-5 w-5 mr-1.5" /> Add Table
            </button>
          </div>
          
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <div className="overflow-x-auto">
            {!isLoading && tables.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">Area</th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">Capacity</th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium text-neutral tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tables.map(table => (
                    <tr key={table.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral">{table.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{table.area}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{table.capacity} seats</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${table.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {table.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                        <button onClick={() => openTableModal(table)} className="text-primary hover:text-indigo-700 p-1 rounded-md"><PencilIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteTable(table.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md"><TrashIcon className="h-5 w-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !isLoading && (
              <p className="text-gray-500 py-4 text-center">No tables found. Add your first table!</p>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-primary mb-5 flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2" /> Employee Management
          </h2>
          <div className="flex justify-between items-center mb-5">
            <button onClick={() => openEmployeeModal()} className="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition flex items-center text-sm font-medium">
              <PlusCircleIcon className="h-5 w-5 mr-1.5" /> Add Employee
            </button>
          </div>
          <div className="overflow-x-auto">
            {employees.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">Role</th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">PIN</th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium text-neutral tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral">{emp.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{emp.role}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 flex items-center">
                        {showPin[emp.id] ? emp.pin : '••••'}
                        <button onClick={() => toggleShowPin(emp.id)} className="ml-2 text-gray-400 hover:text-gray-600 p-0.5">
                          {showPin[emp.id] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                        <button onClick={() => openEmployeeModal(emp)} className="text-primary hover:text-indigo-700 p-1 rounded-md"><PencilIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md"><TrashIcon className="h-5 w-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-4">No employees configured yet. Click "Add Employee" to get started.</p>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-primary mb-5 flex items-center">
            <PaintBrushIcon className="h-6 w-6 mr-2" /> Theme & Appearance
          </h2>
          <p className="text-sm text-neutral mb-3">Customize the look and feel of your POS.</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">Advanced theme customization options will be available here in a future update (e.g., primary color selection, dark mode toggle).</p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-primary mb-5 flex items-center">
            <PrinterIcon className="h-6 w-6 mr-2" /> Printer Configuration
          </h2>
          <p className="text-sm text-neutral mb-3">Set up receipt printers and kitchen ticket printers.</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">Printer setup and management features are planned. You'll be able to add and configure network printers here.</p>
          </div>
        </section>
        
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-primary mb-5 flex items-center">
            <ServerIcon className="h-6 w-6 mr-2" /> Data & Synchronization
          </h2>
          <p className="text-sm text-neutral mb-3">Manage your application data and sync settings.</p>
          <div className="mt-4 space-y-3">
            <button className="w-full md:w-auto bg-gray-100 hover:bg-gray-200 text-neutral font-medium py-2.5 px-4 rounded-lg transition duration-150 ease-in-out">
              Force Sync Data
            </button>
            <p className="text-xs text-gray-500">Last synced: Just now</p>
          </div>
        </section>

        <div className="mt-10 text-right">
          <button onClick={handleSaveAllSettings} className="bg-primary hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-150 ease-in-out shadow-md hover:shadow-lg">
            Save All Settings
          </button>
        </div>
      </div>

      {isTableModalOpen && currentTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-neutral">{currentTable.id ? 'Edit Table' : 'Add New Table'}</h3>
              <button onClick={closeTableModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label htmlFor="tableName" className="block text-sm font-medium text-neutral mb-1">Table Name/Number</label>
                <input type="text" name="name" id="tableName" value={currentTable.name || ''} onChange={handleTableFormChange} className="w-full input-style" placeholder="e.g., Table 1, T1, Bar Seat 5" />
              </div>
              <div>
                <label htmlFor="tableArea" className="block text-sm font-medium text-neutral mb-1">Area</label>
                <select name="area" id="tableArea" value={currentTable.area || ''} onChange={handleTableFormChange} className="w-full input-style bg-white">
                  {availableTableAreas.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="tableCapacity" className="block text-sm font-medium text-neutral mb-1">Capacity (Seats)</label>
                <input type="number" name="capacity" id="tableCapacity" value={currentTable.capacity || ''} onChange={handleTableFormChange} min="1" className="w-full input-style" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button onClick={closeTableModal} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveTable} className="btn-primary">{currentTable.id ? 'Save Changes' : 'Add Table'}</button>
            </div>
          </div>
        </div>
      )}

      {isEmployeeModalOpen && currentEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-neutral">{currentEmployee.id ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={closeEmployeeModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label htmlFor="employeeName" className="block text-sm font-medium text-neutral mb-1">Employee Name</label>
                <input type="text" name="name" id="employeeName" value={currentEmployee.name || ''} onChange={handleEmployeeFormChange} className="w-full input-style" placeholder="John Doe" />
              </div>
              <div>
                <label htmlFor="employeeRole" className="block text-sm font-medium text-neutral mb-1">Role</label>
                <select name="role" id="employeeRole" value={currentEmployee.role || ''} onChange={handleEmployeeFormChange} className="w-full input-style bg-white">
                  {employeeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="employeePin" className="block text-sm font-medium text-neutral mb-1">4-Digit PIN</label>
                <input type="password" name="pin" id="employeePin" value={currentEmployee.pin || ''} onChange={handleEmployeeFormChange} maxLength={4} pattern="\d{4}" className="w-full input-style" placeholder="e.g., 1234" />
                {currentEmployee.id && <p className="text-xs text-gray-500 mt-1">Leave blank to keep existing PIN.</p>}
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="isActive" id="employeeIsActive" checked={currentEmployee.isActive === undefined ? true : currentEmployee.isActive} onChange={handleEmployeeFormChange} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2" />
                <label htmlFor="employeeIsActive" className="text-sm font-medium text-neutral">Active Employee</label>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button onClick={closeEmployeeModal} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveEmployee} className="btn-primary">{currentEmployee.id ? 'Save Changes' : 'Add Employee'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage; 