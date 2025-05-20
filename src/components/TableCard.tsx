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
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', icon: null };
  }
};

const TableCard: React.FC<TableCardProps> = ({ table }) => {
  const statusInfo = getStatusStyles(table.status);

  const cardContent = (
    <div 
      className={`aspect-[2/1] rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-center items-center p-3 sm:p-4 border-2 ${statusInfo.border} ${statusInfo.bg} relative`}
    >
      {/* Optional: A subtle inner div to represent the tabletop surface more distinctly */}
      {/* <div className={`absolute inset-1 rounded-md ${statusInfo.bg.replace('-50', '-100')} opacity-60`}></div> */}

      <div className="z-10 text-center">
        <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold ${statusInfo.text}`}>{table.name}</h3>
        <span className={`mt-1 px-1.5 py-0.5 sm:px-2 text-xs font-semibold rounded-full flex items-center justify-center ${statusInfo.bg.replace('-50', '-100')} ${statusInfo.text}`}> 
          {statusInfo.icon}
          {table.status}
        </span>
      </div>
      <div className="z-10 mt-1 sm:mt-2 text-center text-xs text-gray-500">
        <p>Capacity: {table.capacity}</p>
        {/* <p>Area: {table.area}</p> */}
      </div>
      {table.status === 'Occupied' && table.currentOrderId && (
        <p className="z-10 text-xs text-amber-600 mt-1 truncate">Order: #{table.currentOrderId}</p>
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