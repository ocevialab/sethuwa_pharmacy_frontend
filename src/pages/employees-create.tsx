import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import EmployeesCreateHeader from '@/components/employeesCreate/EmployeesCreateHeader'
import EmployeeForm from '@/components/employees/EmployeeForm'
import Footer from '@/components/shared/Footer'

const EmployeesCreate = () => {
    return (
        <>
            <PageHeader>
                <EmployeesCreateHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <EmployeeForm />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default EmployeesCreate

