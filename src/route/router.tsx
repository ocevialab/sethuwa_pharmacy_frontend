import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layout/root";
import LayoutAuth from "../layout/layoutAuth";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import Home from "../pages/home";
import CustomersList from "../pages/customers-list";
import CustomersView from "../pages/customers-view";
import CustomersCreate from "../pages/customers-create";
import CustomersRestore from "../pages/customers-restore";
import EmployeesList from "../pages/employees-list";
import EmployeesCreate from "../pages/employees-create";
import EmployeesPermissionsEdit from "../pages/employees-permissions-edit";
import Finance from "../pages/finance";
import GlossaryList from "../pages/glossary-list";
import GlossaryCreate from "../pages/glossary-create";
import GlossaryRestore from "../pages/glossary-restore";
import InventoryList from "../pages/inventory-list";
import InventoryView from "../pages/inventory-view";
import MedicineList from "../pages/medicine-list";
import MedicineCreate from "../pages/medicine-create";
import MedicineRestore from "../pages/medicine-restore";
import PurchasingList from "../pages/purchasing-list";
import PurchasingCreate from "../pages/purchasing-create";
import PurchasingView from "../pages/purchasing-view";
import SalesList from "../pages/sales-list";
import SalesCreate from "../pages/sales-create";
import SalesView from "../pages/sales-view";
import SalesPayLater from "../pages/sales-paylater";
import SupplierList from "../pages/supplier-list";
import SupplierCreate from "../pages/supplier-create";
import SupplierView from "../pages/supplier-view";
import SupplierPurchasing from "../pages/supplier-purchasing";
import StockList from "../pages/stock-list";
import LoginCover from "../pages/login-cover";
import ProfileSetting from "../pages/profile-setting";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/customers/list",
        element: (
          <ProtectedRoute>
            <CustomersList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/customers/view",
        element: (
          <ProtectedRoute>
            <CustomersView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/customers/create",
        element: (
          <ProtectedRoute>
            <CustomersCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/customers/restore",
        element: (
          <ProtectedRoute>
            <CustomersRestore />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employees/list",
        element: (
          <ProtectedRoute>
            <EmployeesList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employees/create",
        element: (
          <ProtectedRoute>
            <EmployeesCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/employees/permissions/edit",
        element: (
          <ProtectedRoute>
            <EmployeesPermissionsEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "/finance",
        element: (
          <ProtectedRoute>
            <Finance />
          </ProtectedRoute>
        ),
      },
      {
        path: "/glossary/list",
        element: (
          <ProtectedRoute>
            <GlossaryList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/glossary/create",
        element: (
          <ProtectedRoute>
            <GlossaryCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/glossary/restore",
        element: (
          <ProtectedRoute>
            <GlossaryRestore />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventory/list",
        element: (
          <ProtectedRoute>
            <InventoryList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventory/view",
        element: (
          <ProtectedRoute>
            <InventoryView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/medicine/list",
        element: (
          <ProtectedRoute>
            <MedicineList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/medicine/create",
        element: (
          <ProtectedRoute>
            <MedicineCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/medicine/restore",
        element: (
          <ProtectedRoute>
            <MedicineRestore />
          </ProtectedRoute>
        ),
      },
      {
        path: "/purchasing/list",
        element: (
          <ProtectedRoute>
            <PurchasingList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/purchasing/create",
        element: (
          <ProtectedRoute>
            <PurchasingCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/purchasing/view",
        element: (
          <ProtectedRoute>
            <PurchasingView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/sales/list",
        element: (
          <ProtectedRoute>
            <SalesList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/sales/create",
        element: (
          <ProtectedRoute>
            <SalesCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/sales/view",
        element: (
          <ProtectedRoute>
            <SalesView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/sales/paylater",
        element: (
          <ProtectedRoute>
            <SalesPayLater />
          </ProtectedRoute>
        ),
      },
      {
        path: "/supplier/list",
        element: (
          <ProtectedRoute>
            <SupplierList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/supplier/create",
        element: (
          <ProtectedRoute>
            <SupplierCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "/supplier/view",
        element: (
          <ProtectedRoute>
            <SupplierView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/supplier/purchasing",
        element: (
          <ProtectedRoute>
            <SupplierPurchasing />
          </ProtectedRoute>
        ),
      },
      {
        path: "/stock/list",
        element: (
          <ProtectedRoute>
            <StockList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile-setting",
        element: (
          <ProtectedRoute>
            <ProfileSetting />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/",
    element: <LayoutAuth />,
    children: [
      {
        path: "/authentication/login/cover",
        element: <LoginCover />,
      },
    ],
  },
]);
