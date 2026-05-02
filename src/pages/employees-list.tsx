import React from 'react'
import EmployeesTable from '@/components/employees/EmployeesTable'
import EmployeesHeader from '@/components/employees/EmployeesHeader'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'

const EmployeesList = () => {
    return (
        <>
            <PageHeader>
                <EmployeesHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <EmployeesTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default EmployeesList

