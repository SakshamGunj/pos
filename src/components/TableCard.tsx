import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableStatus } from '../types'; // Assuming types are in src/types
import { UsersIcon, LockClosedIcon, SparklesIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TableCardProps {
  table: Table;
}

const getStatusStyles = (status: TableStatus) => {
  switch (status) {
    case 'Available':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', icon: <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" /> };
    case 'Occupied':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', icon: <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" /> };
    case 'Reserved':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', icon: <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" /> };
    case 'Cleaning':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', icon: <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" /> };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', icon: null };
  }
};

const TableCard: React.FC<TableCardProps> = ({ table }) => {
  const statusInfo = getStatusStyles(table.status);

  const cardContent = (
    <div 
      className={`aspect-[4/3] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-3 sm:p-4 md:p-5 border-2 ${statusInfo.border} ${statusInfo.bg}`}
    >
      <div className="flex justify-between items-start">
        <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold ${statusInfo.text}`}>{table.name}</h3>
        <span className={`px-1.5 py-0.5 sm:px-2 text-xs font-semibold rounded-full flex items-center ${statusInfo.bg === 'bg-emerald-50' ? 'bg-emerald-100' : statusInfo.bg === 'bg-amber-50' ? 'bg-amber-100' : statusInfo.bg === 'bg-blue-50' ? 'bg-blue-100' : 'bg-purple-100'} ${statusInfo.text}`}>
          {statusInfo.icon}
          {table.status}
        </span>
      </div>
      <div className="mt-1 sm:mt-2">
        <p className="text-xs text-gray-500">Area: {table.area}</p>
        <p className="text-xs text-gray-500">Capacity: {table.capacity} guests</p>
      </div>
      {table.status === 'Occupied' && table.currentOrderId && (
        <p className="text-xs text-amber-600 mt-1 truncate">Order: #{table.currentOrderId}</p>
      )}
    </div>
  );

  // Make all tables clickable regardless of status
  return (
    <Link to={`/order/${table.id}`} className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl block">
      {cardContent}
    </Link>
  );
};

export default TableCard;