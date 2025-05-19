import React, { useState, useEffect, useMemo } from 'react';
import TableCard from '../components/TableCard';
import OrdersDashboard from '../components/OrdersDashboard';
import { Table, TableArea, TableStatus } from '../types';
import { FunnelIcon, MagnifyingGlassIcon, MapPinIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { getAllTables, getTablesByArea, getTablesByStatus, checkTablesCollection } from '../firebase/services/tableService';

// Tables are now fetched from Firebase

const tableAreas: TableArea[] = ['Main Dining'];
const tableStatuses: TableStatus[] = ['Available', 'Occupied', 'Reserved', 'Cleaning'];

// Restaurant info will be fetched from Firebase in the future
const restaurantInfo = {
  name: "Aries Restro and Pub",
  address: "Gangtok, Sikkim",
};

const TableSelectionPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<TableArea>('Main Dining');
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | 'All'>('All');
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tables from Firebase
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if tables collection exists
        await checkTablesCollection();

        let fetchedTables: Table[] = [];

        // Always filter by area since we removed the 'All' option
        fetchedTables = await getTablesByArea(selectedArea);
        
        // Apply status filter if needed
        if (selectedStatus !== 'All') {
          // Filter in memory since we already filtered by area
          fetchedTables = fetchedTables.filter(table => table.status === selectedStatus);
        }

        setTables(fetchedTables);
      } catch (err) {
        console.error('Error fetching tables:', err);
        setError('Failed to load tables. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, [selectedArea, selectedStatus]);

  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      // We already filter by area in the Firebase query
      // and by status in memory if needed
      const matchesStatus = selectedStatus === 'All' || table.status === selectedStatus;

      // Always filter by search term
      const matchesSearch = 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (table.currentOrderId && table.currentOrderId.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch && matchesStatus;
    });
  }, [tables, searchTerm, selectedArea, selectedStatus]);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Restaurant Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 p-6 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-xl shadow-xl">
          <div className="flex items-center mb-2.5">
            <BuildingOffice2Icon className="h-9 w-9 mr-3.5 flex-shrink-0 text-indigo-200" />
            <h2 className="text-4xl font-bold tracking-tight">{restaurantInfo.name}</h2>
          </div>
          <div className="flex items-center text-base text-indigo-100 pl-1">
            <MapPinIcon className="h-5 w-5 mr-2.5 flex-shrink-0" />
            <span>{restaurantInfo.address}</span>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <OrdersDashboard />
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral">Table Dashboard</h1>
        <div className="relative w-full md:w-1/3 lg:w-1/4">
          <input 
            type="text"
            placeholder="Search tables, orders..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center mb-3">
          <FunnelIcon className="h-5 w-5 text-primary mr-2" />
          <span className="font-semibold text-neutral text-sm sm:text-base">Filter by:</span>
        </div>
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-6">
          {/* Area selection removed as we only use Main Dining */}

          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Status:</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {['All', ...tableStatuses].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status as TableStatus | 'All')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${selectedStatus === status ? 'bg-primary text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10 sm:py-12">
          <p className="text-lg sm:text-xl font-semibold text-red-500 mb-1 sm:mb-2">{error}</p>
          <p className="text-sm sm:text-base text-gray-500">Please try refreshing the page.</p>
        </div>
      ) : filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {filteredTables.map(table => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-12">
          <MagnifyingGlassIcon className="h-12 w-12 sm:h-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-lg sm:text-xl font-semibold text-neutral mb-1 sm:mb-2">No tables match your criteria.</p>
          <p className="text-sm sm:text-base text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default TableSelectionPage; 