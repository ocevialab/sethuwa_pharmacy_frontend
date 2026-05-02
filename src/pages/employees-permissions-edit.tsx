import React from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import EmployeesCreateHeader from "@/components/employeesCreate/EmployeesCreateHeader";
import EmployeePermissionsEdit from "@/components/employees/EmployeePermissionsEdit";
import Footer from "@/components/shared/Footer";

const EmployeesPermissionsEdit = () => {
  return (
    <>
      <PageHeader>
        <EmployeesCreateHeader />
      </PageHeader>
      <div className="main-content">
        <div className="row">
          <EmployeePermissionsEdit />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmployeesPermissionsEdit;













