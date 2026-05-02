export const menuList = [
  {
    id: 0,
    name: "dashboards",
    path: "/",
    icon: "feather-airplay",
    dropdownMenu: [
      // {
      //     id: 1,
      //     name: "CRM",
      //     path: "/",
      //     subdropdownMenu: false
      // },
    ],
  },
  {
    id: 1,
    name: "inventory",
    path: "#",
    icon: "feather-archive",
    dropdownMenu: [
      {
        id: 1,
        name: "Inventory List",
        path: "/inventory/list",
        subdropdownMenu: false,
      },
    ],
  },
  {
    id: 12,
    name: "stock",
    path: "#",
    icon: "feather-archive",
    dropdownMenu: [
      {
        id: 1,
        name: "Stock List",
        path: "/stock/list",
        subdropdownMenu: false,
      },
    ],
  },
  {
    id: 2,
    name: "medicine",
    path: "#",
    icon: "feather-activity",
    dropdownMenu: [
      {
        id: 1,
        name: "Medicine List",
        path: "/medicine/list",
        subdropdownMenu: false,
      },
      {
        id: 2,
        name: "Medicine Create",
        path: "/medicine/create",
        subdropdownMenu: false,
      },
      {
        id: 3,
        name: "Restore Medicine",
        path: "/medicine/restore",
        subdropdownMenu: false,
      },
    ],
  },
  // {
  //   id: 3,
  //   name: "glossaries",
  //   path: "#",
  //   icon: "feather-file-text",
  //   dropdownMenu: [
  //     {
  //       id: 1,
  //       name: "Groceries List",
  //       path: "/glossary/list",
  //       subdropdownMenu: false,
  //     },
  //     {
  //       id: 2,
  //       name: "Groceries Create",
  //       path: "/glossary/create",
  //       subdropdownMenu: false,
  //     },
  //     {
  //       id: 3,
  //       name: "Restore Groceries",
  //       path: "/glossary/restore",
  //       subdropdownMenu: false,
  //     },
  //   ],
  // },
  {
    id: 4,
    name: "customers",
    path: "#",
    icon: "feather-users",
    dropdownMenu: [
      {
        id: 1,
        name: "Customers List",
        path: "/customers/list",
        subdropdownMenu: false,
      },
      {
        id: 2,
        name: "Customers Create",
        path: "/customers/create",
        subdropdownMenu: false,
      },
      {
        id: 3,
        name: "Restore Customers",
        path: "/customers/restore",
        subdropdownMenu: false,
      },
    ],
  },
  {
    id: 5,
    name: "employees",
    path: "#",
    icon: "feather-user",
    dropdownMenu: [
      {
        id: 1,
        name: "Employees List",
        path: "/employees/list",
        subdropdownMenu: false,
      },
      {
        id: 2,
        name: "Employees Create",
        path: "/employees/create",
        subdropdownMenu: false,
      },
    ],
  },
  {
    id: 8,
    name: "finance",
    path: "/finance",
    icon: "feather-dollar-sign",
    dropdownMenu: [
      {
        id: 1,
        name: "Finance Overview",
        path: "/finance",
        subdropdownMenu: false,
      },
    ],
  },
  {
    id: 6,
    name: "purchasing",
    path: "#",
    icon: "feather-shopping-cart",
    dropdownMenu: [
      {
        id: 1,
        name: "Purchasing List",
        path: "/purchasing/list",
        subdropdownMenu: false,
      },
      {
        id: 2,
        name: "Create Purchase",
        path: "/purchasing/create",
        subdropdownMenu: false,
      },
    ],
  },
  {
    id: 7,
    name: "sales",
    path: "#",
    icon: "feather-shopping-bag",
    dropdownMenu: [
      {
        id: 1,
        name: "Sales Dashboard",
        path: "/sales/list",
        subdropdownMenu: false,
      },
      {
        id: 3,
        name: "Create Receipt",
        path: "/sales/create",
        subdropdownMenu: false,
      },
      {
        id: 4,
        name: "Pay-Later List",
        path: "/sales/paylater",
        subdropdownMenu: false,
      },
    ],
  },
  {
    id: 9,
    name: "suppliers",
    path: "#",
    icon: "feather-users",
    dropdownMenu: [
      {
        id: 1,
        name: "Supplier List",
        path: "/supplier/list",
        subdropdownMenu: false,
      },
      {
        id: 2,
        name: "Create Supplier",
        path: "/supplier/create",
        subdropdownMenu: false,
      },
    ],
  },
];
