// Export Firebase configuration and services
export * from './config';

// Export all services
export * from './services/menuService';
export * from './services/authService';
export * from './services/orderService';
export * from './services/promotionService';
export * from './services/crmService';
export * from './services/tableService';

// Export a default object with all services grouped by category
import * as menuService from './services/menuService';
import * as authService from './services/authService';
import * as orderService from './services/orderService';
import * as promotionService from './services/promotionService';
import * as crmService from './services/crmService';
import * as tableService from './services/tableService';

const firebaseServices = {
  menu: menuService,
  auth: authService,
  order: orderService,
  promotion: promotionService,
  crm: crmService,
  table: tableService
};

export default firebaseServices;
